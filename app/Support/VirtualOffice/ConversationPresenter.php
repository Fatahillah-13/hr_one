<?php

namespace App\Support\VirtualOffice;

use App\Models\VirtualOffice\Conversation;
use App\Models\VirtualOffice\Message;

/** Menyusun ringkasan percakapan untuk satu user (daftar chat di panel kanan). */
class ConversationPresenter
{
    public static function summary(Conversation $c, int $forUserId): array
    {
        $c->loadMissing(['members:users.id,users.name', 'lastMessage.user:id,name']);

        $me = $c->members->firstWhere('id', $forUserId);
        $lastRead = $me?->pivot->last_read_message_id;

        $unread = Message::where('conversation_id', $c->id)
            ->where('user_id', '!=', $forUserId)
            ->when($lastRead, fn ($q) => $q->where('id', '>', $lastRead))
            ->count();

        // untuk chat personal: sampai pesan mana lawan bicara sudah membaca (tanda "Dibaca")
        $others = $c->members->where('id', '!=', $forUserId)->values();
        $otherRead = $c->type === 'personal' ? $others->first()?->pivot->last_read_message_id : null;

        return [
            'id' => $c->id,
            'type' => $c->type,
            'name' => $c->type === 'group' ? $c->name : ($others->first()?->name ?? 'Chat'),
            'peer_id' => $c->type === 'personal' ? $others->first()?->id : null,
            'member_ids' => $c->members->pluck('id')->values(),
            'members_count' => $c->members->count(),
            'last_message' => $c->lastMessage?->toPublic(),
            'unread' => $unread,
            'peer_last_read_id' => $otherRead,
            'updated_at' => ($c->lastMessage?->created_at ?? $c->created_at)?->toIso8601String(),
        ];
    }
}
