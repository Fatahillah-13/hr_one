<?php

namespace App\Models\VirtualOffice;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $table = 'vo_messages';

    protected $guarded = ['id'];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'user_name' => $this->user?->name,
            'body' => $this->body,
            'attachment' => $this->attachment_path ? [
                'name' => $this->attachment_name,
                'mime' => $this->attachment_mime,
                'size' => $this->attachment_size,
                'is_image' => str_starts_with((string) $this->attachment_mime, 'image/'),
                'url' => route('vo.attachments.show', $this->id),
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
