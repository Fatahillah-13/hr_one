<?php

namespace App\Events\VirtualOffice;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Status, bubble, atau avatar seseorang berubah → semua yang membuka lantai ikut update. */
class ProfileUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $userId, public array $profile) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('vo.office')];
    }

    public function broadcastAs(): string
    {
        return 'profile.updated';
    }

    public function broadcastWith(): array
    {
        return ['user_id' => $this->userId, 'profile' => $this->profile];
    }
}
