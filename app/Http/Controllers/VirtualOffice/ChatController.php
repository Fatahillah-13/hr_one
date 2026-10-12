<?php

namespace App\Http\Controllers\VirtualOffice;

use App\Events\VirtualOffice\ConversationCreated;
use App\Events\VirtualOffice\ConversationRead;
use App\Events\VirtualOffice\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VirtualOffice\Conversation;
use App\Models\VirtualOffice\Message;
use App\Support\VirtualOffice\ConversationPresenter;
use App\Support\VirtualOffice\Realtime;
use App\Support\VirtualOffice\VoAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    /** Daftar percakapan milik user (personal + grup), terbaru di atas. */
    public function index(Request $request): JsonResponse
    {
        $me = $request->user()->id;

        $list = Conversation::whereHas('members', fn ($q) => $q->where('users.id', $me))
            ->with(['members:users.id,users.name', 'lastMessage.user:id,name'])
            ->get()
            ->map(fn ($c) => ConversationPresenter::summary($c, $me))
            ->sortByDesc('updated_at')
            ->values();

        return response()->json(['conversations' => $list]);
    }

    /** Buka (atau buat) chat personal dengan user lain. */
    public function openPersonal(Request $request, User $user): JsonResponse
    {
        $me = $request->user()->id;
        abort_if($user->id === $me, 422, 'Tidak bisa chat dengan diri sendiri.');
        abort_unless(VoAccess::members()->whereKey($user->id)->exists(), 422, 'Karyawan ini tidak bisa menerima chat Virtual Office.');

        $conversation = DB::transaction(function () use ($me, $user) {
            $c = Conversation::firstOrCreate(
                ['personal_key' => Conversation::personalKey($me, $user->id)],
                ['type' => 'personal', 'created_by' => $me],
            );
            $c->members()->syncWithoutDetaching([$me, $user->id]);

            return $c;
        });

        return response()->json(['conversation' => ConversationPresenter::summary($conversation->fresh(), $me)]);
    }

    /** Buat grup baru. Pembuat otomatis jadi admin. */
    public function storeGroup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);
        $me = $request->user()->id;
        // hanya karyawan aktif yang punya akses Virtual Office
        $data['member_ids'] = VoAccess::members()->whereKey($data['member_ids'])->pluck('id')->all();
        abort_if(! array_diff($data['member_ids'], [$me]), 422, 'Pilih minimal satu anggota yang bisa memakai Virtual Office.');

        $conversation = DB::transaction(function () use ($data, $me) {
            $c = Conversation::create(['type' => 'group', 'name' => $data['name'], 'created_by' => $me]);
            $ids = collect($data['member_ids'])->push($me)->unique()->values();
            $c->members()->attach($ids->mapWithKeys(fn ($id) => [$id => ['is_admin' => $id === $me]])->all());

            return $c;
        });

        $conversation->load('members:users.id,users.name');
        foreach ($conversation->members as $m) {
            if ($m->id !== $me) {
                Realtime::send(new ConversationCreated($conversation, $m->id));
            }
        }

        return response()->json(['conversation' => ConversationPresenter::summary($conversation, $me)]);
    }

    /** Riwayat pesan, 40 per halaman. ?before_id=123 untuk memuat pesan lebih lama. */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeMember($request, $conversation);

        $messages = $conversation->messages()
            ->with('user:id,name')
            ->when($request->integer('before_id'), fn ($q, $id) => $q->where('id', '<', $id))
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->reverse()
            ->values()
            ->map(fn ($m) => $m->toPublic());

        return response()->json(['messages' => $messages, 'has_more' => $messages->count() === 40]);
    }

    /** Kirim pesan teks dan/atau lampiran (maks 10 MB). */
    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeMember($request, $conversation);

        $request->validate([
            'body' => ['nullable', 'string', 'max:4000', 'required_without:file'],
            'file' => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,gif,pdf,xlsx,xls,csv,docx,doc,pptx,txt,zip'],
        ]);

        $data = [
            'conversation_id' => $conversation->id,
            'user_id' => $request->user()->id,
            'body' => trim((string) $request->input('body')) ?: null,
        ];

        if ($file = $request->file('file')) {
            $data['attachment_path'] = $file->store('vo-attachments/' . $conversation->id, 'local');
            $data['attachment_name'] = $file->getClientOriginalName();
            $data['attachment_mime'] = $file->getMimeType();
            $data['attachment_size'] = $file->getSize();
        }

        $message = Message::create($data)->load('user:id,name');
        $conversation->touch();

        // pengirim otomatis dianggap sudah membaca pesannya sendiri
        $conversation->members()->updateExistingPivot($request->user()->id, ['last_read_message_id' => $message->id]);

        Realtime::send(new MessageSent($message, $conversation->members()->pluck('users.id')->all()));

        return response()->json(['message' => $message->toPublic()]);
    }

    /** Tandai percakapan sudah dibaca sampai pesan terakhir. */
    public function read(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeMember($request, $conversation);

        $lastId = (int) $conversation->messages()->max('id');
        if ($lastId) {
            $conversation->members()->updateExistingPivot($request->user()->id, ['last_read_message_id' => $lastId]);
            Realtime::send(new ConversationRead(
                $conversation->id,
                $request->user()->id,
                $lastId,
                $conversation->members()->pluck('users.id')->all(),
            ), true);
        }

        return response()->json(['last_read_message_id' => $lastId]);
    }

    /** Unduh/tampilkan lampiran. Hanya anggota percakapan yang boleh. */
    public function attachment(Request $request, Message $message): StreamedResponse
    {
        $this->authorizeMember($request, $message->conversation);
        abort_unless($message->attachment_path && Storage::disk('local')->exists($message->attachment_path), 404);

        $inline = str_starts_with((string) $message->attachment_mime, 'image/');

        return Storage::disk('local')->response(
            $message->attachment_path,
            $message->attachment_name,
            ['Content-Type' => $message->attachment_mime],
            $inline ? 'inline' : 'attachment',
        );
    }

    private function authorizeMember(Request $request, Conversation $conversation): void
    {
        abort_unless($conversation->hasMember($request->user()->id), 403);
    }
}
