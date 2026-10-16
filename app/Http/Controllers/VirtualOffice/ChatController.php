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
    /** Daftar percakapan milik user (personal + grup), terbaru di atas.
     * Khusus Administrator: melihat semua grup yang ada.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $me = $user->id;
        $isAdmin = VoAccess::isAdmin($user);

        $query = Conversation::query();
        if ($isAdmin) {
            $query->where(function ($q) use ($me) {
                $q->where('type', 'group')
                  ->orWhereHas('members', fn ($mq) => $mq->where('users.id', $me));
            });
        } else {
            $query->whereHas('members', fn ($q) => $q->where('users.id', $me));
        }

        $list = $query
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

    /** Buat grup baru. Hanya Administrator yang diperbolehkan. */
    public function storeGroup(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(VoAccess::isAdmin($user), 403, 'Hanya Administrator yang memiliki akses untuk membuat grup baru.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);
        $me = $user->id;
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

    /** Tambah anggota ke grup. Hanya Administrator yang diperbolehkan. */
    public function addMembers(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless(VoAccess::isAdmin($user), 403, 'Hanya Administrator yang memiliki akses untuk mengelola anggota grup.');
        abort_if($conversation->type !== 'group', 422, 'Hanya percakapan grup yang bisa ditambah anggota.');

        $data = $request->validate([
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $validIds = VoAccess::members()->whereKey($data['member_ids'])->pluck('id')->all();
        $existingIds = $conversation->members()->pluck('users.id')->all();
        $newIds = array_diff($validIds, $existingIds);

        abort_if(empty($newIds), 422, 'Semua user yang dipilih sudah menjadi anggota grup ini.');

        $attachData = collect($newIds)->mapWithKeys(fn ($id) => [$id => ['is_admin' => false]])->all();
        $conversation->members()->attach($attachData);

        $conversation->load('members:users.id,users.name');
        foreach ($newIds as $newId) {
            Realtime::send(new ConversationCreated($conversation, $newId));
        }

        return response()->json(['conversation' => ConversationPresenter::summary($conversation->fresh(), $user->id)]);
    }

    /** Hapus grup beserta seluruh pesan dan lampirannya. Hanya Administrator yang diperbolehkan. */
    public function destroyGroup(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless(VoAccess::isAdmin($user), 403, 'Hanya Administrator yang memiliki akses untuk menghapus grup.');
        abort_if($conversation->type !== 'group', 422, 'Hanya percakapan grup yang bisa dihapus.');

        // Hapus file attachment dari disk
        $attachmentPaths = $conversation->messages()->whereNotNull('attachment_path')->pluck('attachment_path')->all();
        foreach ($attachmentPaths as $path) {
            if ($path && Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
            }
        }

        $conversation->delete();

        return response()->json(['ok' => true, 'id' => $conversation->id]);
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

        // kirim realtime ke semua anggota + administrator jika grup
        $targetUserIds = $conversation->members()->pluck('users.id');
        if ($conversation->type === 'group') {
            $adminIds = User::whereHas('role', fn ($q) => $q->where('name', 'Admin'))->pluck('id');
            $targetUserIds = $targetUserIds->merge($adminIds)->unique();
        }

        Realtime::send(new MessageSent($message, $targetUserIds->values()->all()));

        return response()->json(['message' => $message->toPublic()]);
    }

    /** Tandai percakapan sudah dibaca sampai pesan terakhir. */
    public function read(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeMember($request, $conversation);

        $lastId = (int) $conversation->messages()->max('id');
        if ($lastId) {
            if ($conversation->hasMember($request->user()->id)) {
                $conversation->members()->updateExistingPivot($request->user()->id, ['last_read_message_id' => $lastId]);
            }
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
        $user = $request->user();
        if ($conversation->type === 'group' && VoAccess::isAdmin($user)) {
            return;
        }

        abort_unless($conversation->hasMember($user->id), 403);
    }
}
