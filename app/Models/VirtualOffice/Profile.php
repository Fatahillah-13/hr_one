<?php

namespace App\Models\VirtualOffice;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Profile extends Model
{
    protected $table = 'vo_profiles';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $guarded = [];

    protected $attributes = ['status' => 'online', 'avatar_mode' => 'initial'];

    protected $casts = [
        'bubble_expires_at' => 'datetime',
        'avatar_config' => 'array',
    ];

    public const STATUSES = ['online', 'rapat', 'sibuk', 'offline'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Bubble yang masih berlaku (null kalau sudah kedaluwarsa). */
    public function activeBubble(): ?string
    {
        if (! $this->bubble) {
            return null;
        }
        if ($this->bubble_expires_at && $this->bubble_expires_at->isPast()) {
            return null;
        }

        return $this->bubble;
    }

    /** Data yang dikirim ke frontend. */
    public function toPublic(): array
    {
        return [
            'status' => $this->status,
            'bubble' => $this->activeBubble(),
            'bubble_expires_at' => $this->bubble_expires_at?->toIso8601String(),
            'avatar_mode' => $this->avatar_mode,
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'avatar_config' => $this->avatar_config,
            'attendance' => $this->attendance_state ? [
                'state' => $this->attendance_state,
                'label' => $this->attendance_label,
            ] : null,
        ];
    }

    public static function forUser(int $userId): self
    {
        return static::firstOrCreate(['user_id' => $userId]);
    }
}
