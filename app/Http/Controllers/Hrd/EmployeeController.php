<?php

namespace App\Http\Controllers\Hrd;

use App\Http\Controllers\Controller;
use App\Models\Hrd\Department;
use App\Models\Hrd\Employee;
use App\Models\Hrd\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Modul Master Karyawan (tahap 1: read-only) - membaca database sistem HRD lama.
 */
class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'department_id' => ['nullable', 'integer'],
            'job_id' => ['nullable', 'integer'],
            'status_employee' => ['nullable', Rule::in(['active', 'notactive'])],
            'exit_statement' => ['nullable', Rule::in(Employee::EXIT_STATEMENTS)],
            'per_page' => ['nullable', 'integer', Rule::in(Employee::PER_PAGE_OPTIONS)],
        ]);

        $perPage = (int) ($filters['per_page'] ?? 10);

        $employees = Employee::query()
            ->with(['department:id,department', 'job:id,job_level'])
            ->filter($filters)
            ->orderBy('number_of_employees')
            ->paginate($perPage, [
                'id', 'number_of_employees', 'name', 'national_id', 'gender',
                'status_employee', 'employee_type', 'exit_statement', 'hire_date',
                'department_id', 'job_id',
            ])
            ->withQueryString()
            ->through(fn (Employee $e) => [
                'id' => $e->id,
                'nik' => $e->number_of_employees,
                'name' => $e->name,
                'national_id_masked' => $this->mask($e->national_id),
                'gender' => $e->gender,
                'department' => $e->department?->department,
                'job_level' => $e->job?->job_level,
                'status' => $e->status_employee,
                'employee_type' => $e->employee_type,
                'exit_statement' => $e->exit_statement,
                'hire_date' => $this->date($e->hire_date),
            ]);

        return Inertia::render('Hrd/Employees/Index', [
            'employees' => $employees,
            'filters' => array_merge(
                array_filter($filters, fn ($v) => $v !== null && $v !== ''),
                ['per_page' => $perPage],
            ),
            'options' => [
                'departments' => Department::orderBy('department')->get(['id', 'department as name']),
                'jobs' => Job::orderBy('job_level')->get(['id', 'job_level as name']),
                'exit_statements' => Employee::EXIT_STATEMENTS,
                'per_page' => Employee::PER_PAGE_OPTIONS,
            ],
            'stats' => $this->stats(),
            'links' => $this->links(),
        ]);
    }

    public function show(int $id): Response
    {
        $employee = Employee::with(['department:id,department', 'job:id,job_level'])->findOrFail($id);

        $violations = $employee->violations()
            ->orderByDesc('date_of_violation')
            ->get(['id', 'no_violation', 'type_of_violation', 'date_of_violation', 'reporting_date', 'date_end_violation', 'violation_status'])
            ->map(fn ($v) => [
                'id' => $v->id,
                'number' => $v->no_violation,
                'type' => $v->type_of_violation,
                'date' => $this->date($v->date_of_violation),
                'reported_at' => $this->date($v->reporting_date),
                'ends_at' => $this->date($v->date_end_violation),
                'status' => $v->violation_status,
            ]);

        $layoffs = $employee->layoffs()
            ->orderByDesc('layoff_date')
            ->get(['id', 'no_layoff', 'layoff_date', 'layoff_date_start'])
            ->map(fn ($l) => [
                'id' => $l->id,
                'number' => $l->no_layoff,
                'date' => $this->date($l->layoff_date),
                'starts_at' => $this->date($l->layoff_date_start),
            ]);

        $e = $employee;

        return Inertia::render('Hrd/Employees/Show', [
            'employee' => [
                'id' => $e->id,
                'nik' => $e->number_of_employees,
                'name' => $e->name,
                'status' => $e->status_employee,
                'employee_type' => $e->employee_type,
                'department' => $e->department?->department,
                'job_level' => $e->job?->job_level,
                'sections' => [
                    'identitas' => [
                        'NIK' => $e->number_of_employees,
                        'Finger ID' => $e->finger_id,
                        'No. KTP' => $e->national_id,
                        'Jenis Kelamin' => $this->gender($e->gender),
                        'Tempat Lahir' => $e->place_of_birth,
                        'Tanggal Lahir' => $this->date($e->date_of_birth),
                        'Agama' => $e->religion,
                        'Status Pernikahan' => $this->marital($e->marital_status),
                        'Nama Ibu Kandung' => $e->biological_mothers_name,
                        'Pendidikan' => trim(($e->educate ?? '').' '.($e->major ?? '')) ?: null,
                        'Telepon' => $e->phone,
                        'Email' => $e->email,
                    ],
                    'pekerjaan' => [
                        'Departemen' => $e->department?->department,
                        'Job Level' => $e->job?->job_level,
                        'Bagian' => $e->bagian,
                        'Cell' => $e->cell,
                        'Tipe Karyawan' => $e->employee_type,
                        'Grade' => $e->grade_employee,
                        'Tanggal Masuk' => $this->date($e->hire_date),
                        'Akhir Kontrak' => $this->date($e->end_of_contract),
                        'Tanggal Keluar' => $this->date($e->date_out),
                        'Ket. Keluar' => $e->exit_statement,
                    ],
                    'alamat' => [
                        'Jalan' => $e->address_jalan,
                        'RT / RW' => collect([$e->address_rt, $e->address_rw])->filter()->implode(' / ') ?: null,
                        'Kelurahan / Desa' => $e->address_village,
                        'Kecamatan' => $e->address_district,
                        'Kota / Kabupaten' => $e->address_city,
                        'Provinsi' => $e->address_province,
                    ],
                    'bank' => [
                        'Nama Bank' => $e->bank_name,
                        'Cabang' => $e->bank_branch,
                        'Atas Nama' => $e->bank_account_name,
                        'No. Rekening' => $e->bank_account_number,
                    ],
                    'bpjs_pajak' => [
                        'BPJS Ketenagakerjaan' => $e->bpjs_ketenagakerjaan,
                        'Tgl. BPJS TK' => $this->date($e->date_bpjs_ketenagakerjaan),
                        'BPJS Kesehatan' => $e->bpjs_kesehatan,
                        'Tgl. BPJS Kesehatan' => $this->date($e->date_bpjs_kesehatan),
                        'NPWP' => $e->npwp,
                        'Kode PTKP' => $e->kode_ptkp,
                        'Tahun PTKP' => $e->year_ptkp,
                    ],
                ],
            ],
            'violations' => $violations,
            'layoffs' => $layoffs,
            'links' => $this->links($e),
        ]);
    }

    /** Ringkasan untuk kartu statistik, di-cache 5 menit agar ringan. */
    protected function stats(): array
    {
        return Cache::remember('hrd.employees.stats', now()->addMinutes(5), function () {
            $byStatus = Employee::query()
                ->selectRaw('status_employee, COUNT(*) as total')
                ->groupBy('status_employee')
                ->pluck('total', 'status_employee');

            $byType = Employee::query()
                ->where('status_employee', 'active')
                ->selectRaw('employee_type, COUNT(*) as total')
                ->groupBy('employee_type')
                ->pluck('total', 'employee_type');

            return [
                'total' => (int) $byStatus->sum(),
                'active' => (int) ($byStatus['active'] ?? 0),
                'notactive' => (int) ($byStatus['notactive'] ?? 0),
                'by_type' => collect(['Permanent', 'Contract', 'Probation'])
                    ->mapWithKeys(fn ($t) => [$t => (int) ($byType[$t] ?? 0)])
                    ->all(),
            ];
        });
    }

    protected function links(?Employee $employee = null): array
    {
        $legacy = config('hrd.legacy_url');
        $export = config('hrd.export_url');

        $links = [
            'legacy_index' => $legacy.'/employees',
            'legacy_create' => $legacy.'/employees/create',
            'export_all' => $export.'/exportemployees?tipe=ALL',
            'export_standard' => $export.'/exportemployees?tipe=STANDARD',
        ];

        if ($employee) {
            $links['legacy_show'] = $legacy.'/employees/'.$employee->id.'/show';
            $links['legacy_edit'] = $legacy.'/employees/'.$employee->id.'/edit';
            $links['legacy_profile'] = $legacy.'/employees/profile?search='.urlencode((string) $employee->number_of_employees);
        }

        return $links;
    }

    /** Nomor KTP di daftar hanya menampilkan 4 digit terakhir. Detail tetap lengkap. */
    protected function mask(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        return str_repeat('•', max(strlen($value) - 4, 0)).substr($value, -4);
    }

    protected function date($value): ?string
    {
        if (! $value || str_starts_with((string) $value, '0000')) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    protected function gender(?string $g): ?string
    {
        return match (strtoupper((string) $g)) {
            'M' => 'Laki-laki',
            'F' => 'Perempuan',
            default => $g ?: null,
        };
    }

    protected function marital(?string $m): ?string
    {
        return match (strtoupper((string) $m)) {
            'M' => 'Menikah',
            'S' => 'Belum Menikah',
            'D' => 'Cerai',
            default => $m ?: null,
        };
    }
}
