<?php

namespace App\Events\VirtualOffice;

use App\Models\VirtualOffice\Conversation;
use App\Support\VirtualOffice\ConversationPresenter;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Grup baru dibuat → muncul di daftar chat semua anggotanya. Dikirim terpisah per anggota. */
class ConversationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public Conversation $conversation, public int $forUserId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('vo.user.' . $this->forUserId)];
    }

    public function broadcastAs(): string
    {
        return 'conversation.created';
    }

    public function broadcastWith(): array
    {
        return ['conversation' => ConversationPresenter::summary($this->conversation, $this->forUserId)];
    }
}
