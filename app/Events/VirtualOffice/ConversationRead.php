<?php

namespace App\Events\VirtualOffice;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Seseorang sudah membaca percakapan sampai pesan tertentu (untuk tanda "Dibaca"). */
class ConversationRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /** @param int[] $memberIds */
    public function __construct(
        public int $conversationId,
        public int $readerId,
        public int $lastReadMessageId,
        public array $memberIds,
    ) {}

    public function broadcastOn(): array
    {
        return array_map(fn ($id) => new PrivateChannel('vo.user.' . $id), $this->memberIds);
    }

    public function broadcastAs(): string
    {
        return 'conversation.read';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'reader_id' => $this->readerId,
            'last_read_message_id' => $this->lastReadMessageId,
        ];
    }
}
