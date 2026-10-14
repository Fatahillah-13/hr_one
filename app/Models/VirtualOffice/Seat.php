<?php

namespace App\Models\VirtualOffice;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seat extends Model
{
    protected $table = 'vo_seats';

    protected $guarded = ['id'];

    protected $casts = ['is_printer' => 'boolean', 'has_panel' => 'boolean'];

    public const FACINGS = ['L', 'R', 'T', 'B'];

    /** Kolom yang dikirim ke frontend (lantai & editor). */
    public const PUBLIC_COLUMNS = [
        'id', 'code', 'zone', 'facing', 'has_panel', 'x', 'y', 'w', 'd', 'monitor', 'panel',
        'is_printer', 'seat_x', 'seat_y', 'chair_side', 'user_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Hitung posisi monitor, partisi, dan titik duduk dari arah duduk (facing).
     * facing = sisi meja tempat karyawan duduk: L kiri, R kanan, T atas, B bawah.
     * Rumus yang sama ada di resources/js/VirtualOffice/catalog.js (deriveSeat).
     */
    public static function derive(array $s): array
    {
        $f = in_array($s['facing'] ?? 'L', self::FACINGS, true) ? $s['facing'] : 'L';
        $x = (int) $s['x'];
        $y = (int) $s['y'];
        $w = (int) $s['w'];
        $d = (int) $s['d'];
        $printer = ! empty($s['is_printer']);

        [$sx, $sy] = match ($f) {
            'L' => [$x - 16, $y + intdiv($d, 2)],
            'R' => [$x + $w + 16, $y + intdiv($d, 2)],
            'T' => [$x + intdiv($w, 2), $y - 16],
            default => [$x + intdiv($w, 2), $y + $d + 16],
        };

        return [
            'monitor' => $printer ? 'none' : ['L' => 'right', 'R' => 'left', 'T' => 'top', 'B' => 'bottom'][$f],
            'panel' => ! empty($s['has_panel']) ? ['L' => 'xr', 'R' => 'xl', 'T' => 'yb', 'B' => 'yt'][$f] : null,
            'seat_x' => $printer ? null : $sx,
            'seat_y' => $printer ? null : $sy,
            'chair_side' => $printer ? null : $f,
        ];
    }
}
