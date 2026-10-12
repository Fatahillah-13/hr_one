<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItAgent extends Model
{
    /** Status kerja agent. "off" (Tidak ready) tidak bisa dipilih pelapor. */
    public const STATUSES = [
        'ready' => 'Ready',
        'meeting' => 'Meeting',
        'lapangan' => 'Di lapangan',
        'off' => 'Tidak ready',
    ];

    protected $fillable = [
        'name',
        'role',
        'wa_number',
        'user_id',
        'is_active',
        'status',
        'status_note',
        'status_changed_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'status_changed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /** 08xx / +62 8xx / 62-8xx  ->  628xx (format wa.me). */
    public static function normalizeWa(?string $value): string
    {
        $digits = preg_replace('/\D+/', '', (string) $value);

        return str_starts_with($digits, '0') ? '62'.substr($digits, 1) : $digits;
    }

    /** Ganti status (dan catatan); waktu perubahan hanya diperbarui bila ada yang berubah. */
    public function setWorkStatus(string $status, ?string $note): void
    {
        $note = filled($note) ? trim($note) : null;

        if ($status !== $this->status || $note !== $this->status_note) {
            $this->status_changed_at = now();
        }

        $this->status = $status;
        $this->status_note = $note;
    }

    /** Data agent untuk halaman IT Call (semua user). */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => $this->role,
            'wa_number' => $this->wa_number,
            'status' => $this->status,
            'status_note' => $this->status_note,
            'status_changed_at' => $this->status_changed_at?->toIso8601String(),
        ];
    }
}
