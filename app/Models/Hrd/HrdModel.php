<?php

namespace App\Models\Hrd;

use Illuminate\Database\Eloquent\Model;
use LogicException;

/**
 * Basis model untuk tabel di database sistem HRD lama.
 * Tahap 1 bersifat READ-ONLY: semua operasi tulis ditolak supaya modul
 * HR One tidak mengubah data sebelum proses input dipindah secara resmi.
 */
abstract class HrdModel extends Model
{
    protected $connection = 'hrd';

    protected $guarded = ['*'];

    public $timestamps = false;

    public function save(array $options = []): bool
    {
        throw new LogicException(static::class.' bersifat read-only (tahap 1 modul HRD).');
    }

    public function delete(): ?bool
    {
        throw new LogicException(static::class.' bersifat read-only (tahap 1 modul HRD).');
    }
}
