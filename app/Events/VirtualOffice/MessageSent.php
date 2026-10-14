<?php

namespace App\Events\VirtualOffice;

use App\Models\VirtualOffice\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Pesan baru dikirim ke channel pribadi tiap anggota percakapan. */
class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /** @param int[] $memberIds */
    public function __construct(public Message $message, public array $memberIds) {}

    public function broadcastOn(): array
    {
        return array_map(fn ($id) => new PrivateChannel('vo.user.' . $id), $this->memberIds);
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $c = $this->message->conversation;

        return [
            'message' => $this->message->toPublic(),
            // untuk notifikasi di halaman HR One lain (nama grup / tipe chat)
            'conversation' => $c ? ['id' => $c->id, 'type' => $c->type, 'name' => $c->type === 'group' ? $c->name : null] : null,
        ];
    }
}
