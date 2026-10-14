<?php

namespace App\Events\VirtualOffice;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Denah baru dipublikasikan → semua yang membuka lantai memuat ulang meja & perabot. */
class LayoutUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(public int $versionId, public string $publishedBy) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('vo.office')];
    }

    public function broadcastAs(): string
    {
        return 'layout.updated';
    }

    public function broadcastWith(): array
    {
        return ['version_id' => $this->versionId, 'published_by' => $this->publishedBy];
    }
}
