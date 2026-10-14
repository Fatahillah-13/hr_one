<?php

namespace App\Models\Hrd;

use Illuminate\Database\Eloquent\Builder;

class Employee extends HrdModel
{
    protected $table = 'employees';

    /** Pilihan "Ket. Keluar" sama persis dengan sistem HRD lama. */
    public const EXIT_STATEMENTS = [
        'BATAL MASUK',
        'BATAL MASUK (>6 Bulan)',
        'BATAL MASUK (2X DIBULAN YANG SAMA)',
        'BATAL MASUK (TIDAK LULUS MCU)',
        'BLACK LIST',
        'ERESIGN',
        'PHK',
        'PHK (END OF CONTRACT)',
        'PHK (MENINGGAL DUNIA)',
        'PHK (PENSIUN)',
        'PHK (SAKIT 1 TAHUN)',
        'PHK (TIDAK LULUS TRAINING)',
        'RESIGN',
        'RESIGN (KARENA KABUR)',
        'RESIGN (MUTASI HWP)',
    ];

    public const PER_PAGE_OPTIONS = [10, 50, 100, 200];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function violations()
    {
        return $this->hasMany(Violation::class);
    }

    public function layoffs()
    {
        return $this->hasMany(Layoff::class);
    }

    /**
     * Filter yang sama dengan halaman Karyawan lama:
     * search (NIK / nama / KTP), department_id, job_id, status_employee, exit_statement.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                $q->where(function (Builder $w) use ($search) {
                    $like = '%'.$search.'%';
                    $w->where('number_of_employees', 'like', $like)
                        ->orWhere('name', 'like', $like)
                        ->orWhere('national_id', 'like', $like);
                });
            })
            ->when($filters['department_id'] ?? null, fn (Builder $q, $id) => $q->where('department_id', $id))
            ->when($filters['job_id'] ?? null, fn (Builder $q, $id) => $q->where('job_id', $id))
            ->when($filters['status_employee'] ?? null, fn (Builder $q, $s) => $q->where('status_employee', $s))
            ->when($filters['exit_statement'] ?? null, fn (Builder $q, $s) => $q->where('exit_statement', $s));
    }
}
