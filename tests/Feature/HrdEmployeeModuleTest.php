<?php

namespace Tests\Feature;

use App\Models\App;
use App\Models\Division;
use App\Models\Hrd\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use LogicException;
use Tests\TestCase;

class HrdEmployeeModuleTest extends TestCase
{
    use RefreshDatabase;

    protected Division $hrdDivision;

    protected function setUp(): void
    {
        parent::setUp();

        // Database "hrd" tiruan (SQLite in-memory) dengan kolom yang dipakai modul.
        Config::set('database.connections.hrd', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => false,
        ]);
        DB::purge('hrd');
        Cache::flush();

        $schema = Schema::connection('hrd');
        $schema->create('departments', function (Blueprint $t) {
            $t->id();
            $t->string('department');
        });
        $schema->create('jobs', function (Blueprint $t) {
            $t->id();
            $t->string('code_job_level')->nullable();
            $t->string('job_level');
        });
        $schema->create('employees', function (Blueprint $t) {
            $t->id();
            foreach ([
                'number_of_employees', 'finger_id', 'name', 'gender', 'place_of_birth', 'date_of_birth',
                'marital_status', 'religion', 'biological_mothers_name', 'national_id',
                'address_jalan', 'address_rt', 'address_rw', 'address_village', 'address_district',
                'address_city', 'address_province', 'phone', 'email', 'educate', 'major', 'hire_date',
                'end_of_contract', 'date_out', 'employee_type', 'grade_employee', 'status_employee',
                'exit_statement', 'bank_name', 'bank_branch', 'bank_account_name', 'bank_account_number',
                'bpjs_ketenagakerjaan', 'date_bpjs_ketenagakerjaan', 'bpjs_kesehatan', 'date_bpjs_kesehatan',
                'npwp', 'kode_ptkp', 'year_ptkp', 'bagian', 'cell',
            ] as $col) {
                $t->string($col)->nullable();
            }
            $t->unsignedBigInteger('department_id')->nullable();
            $t->unsignedBigInteger('job_id')->nullable();
        });
        $schema->create('violations', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('employee_id');
            $t->string('no_violation')->nullable();
            $t->string('type_of_violation')->nullable();
            $t->string('date_of_violation')->nullable();
            $t->string('reporting_date')->nullable();
            $t->string('date_end_violation')->nullable();
            $t->string('violation_status')->nullable();
        });
        $schema->create('layoffs', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('employee_id');
            $t->string('no_layoff')->nullable();
            $t->string('layoff_date')->nullable();
            $t->string('layoff_date_start')->nullable();
        });

        $hrd = DB::connection('hrd');
        $hrd->table('departments')->insert([['department' => 'PRODUCTION'], ['department' => 'HRD']]);
        $hrd->table('jobs')->insert([['job_level' => 'OPERATOR'], ['job_level' => 'STAFF']]);
        $hrd->table('employees')->insert([
            $this->emp('1001', 'Andi Saputra', '3301010101900001', 'active', 'Permanent', 1, 1),
            $this->emp('1002', 'Budi Santoso', '3301010101900002', 'active', 'Contract', 1, 1),
            $this->emp('1003', 'Citra Lestari', '3301010101900003', 'notactive', 'Contract', 2, 2, 'RESIGN'),
            $this->emp('1004', 'Dewi Anggraini', '3301010101900004', 'active', 'Probation', 2, 2),
        ]);
        $hrd->table('violations')->insert([
            'employee_id' => 1, 'no_violation' => '12', 'type_of_violation' => 'SP 1',
            'date_of_violation' => '2026-05-02', 'reporting_date' => '2026-05-03',
            'date_end_violation' => '2026-11-02', 'violation_status' => 'active',
        ]);
        $hrd->table('layoffs')->insert(['employee_id' => 3, 'no_layoff' => '7', 'layoff_date' => '2026-06-01', 'layoff_date_start' => '2026-06-15']);

        // App modul terdaftar oleh migration; pasangkan ke divisi HRD untuk test.
        $this->hrdDivision = Division::create(['name' => 'HRD Master', 'slug' => 'hrd']);
        App::where('slug', config('hrd.employees_app_slug'))->firstOrFail()->divisions()->attach($this->hrdDivision);
    }

    protected function emp(string $nik, string $name, string $ktp, string $status, string $type, int $dept, int $job, ?string $exit = null): array
    {
        return [
            'number_of_employees' => $nik, 'name' => $name, 'national_id' => $ktp,
            'status_employee' => $status, 'employee_type' => $type, 'exit_statement' => $exit,
            'department_id' => $dept, 'job_id' => $job, 'gender' => 'M',
            'hire_date' => '2020-01-15', 'date_of_birth' => '1995-07-20', 'address_city' => 'SEMARANG',
            'bank_account_number' => '1234567890', 'end_of_contract' => '0000-00-00',
        ];
    }

    protected function hrdUser(): User
    {
        return User::factory()->create(['division_id' => $this->hrdDivision->id]);
    }

    // ---------- Akses ----------

    public function test_module_is_registered_as_internal_app(): void
    {
        $app = App::where('slug', 'hrd-master-karyawan')->first();

        $this->assertNotNull($app);
        $this->assertSame('/hrd/employees', $app->app_link);
        $this->assertTrue($app->isInternalModule());
    }

    public function test_user_outside_hrd_division_is_forbidden(): void
    {
        $other = Division::create(['name' => 'IT', 'slug' => 'it']);
        $user = User::factory()->create(['division_id' => $other->id]);

        $this->actingAs($user)->get('/hrd/employees')->assertForbidden();
        $this->actingAs($user)->get('/hrd/employees/1')->assertForbidden();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/hrd/employees')->assertRedirect(route('login'));
    }

    public function test_admin_can_open_module_without_division(): void
    {
        $admin = User::factory()->create(['role_id' => Role::create(['name' => Role::ADMIN])->id]);

        $this->actingAs($admin)->get('/hrd/employees')->assertOk();
    }

    // ---------- Daftar ----------

    public function test_index_lists_employees_with_stats_and_masked_ktp(): void
    {
        $this->actingAs($this->hrdUser())->get('/hrd/employees')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Hrd/Employees/Index')
                ->has('employees.data', 4)
                ->where('employees.data.0.nik', '1001')
                ->where('employees.data.0.department', 'PRODUCTION')
                ->where('employees.data.0.job_level', 'OPERATOR')
                ->where('employees.data.0.national_id_masked', '••••••••••••0001')
                ->missing('employees.data.0.national_id')
                ->missing('employees.data.0.bank_account_number')
                ->where('stats.total', 4)
                ->where('stats.active', 3)
                ->where('stats.notactive', 1)
                ->where('stats.by_type.Permanent', 1)
                ->where('stats.by_type.Contract', 1)
                ->where('stats.by_type.Probation', 1)
                ->has('options.departments', 2)
                ->has('options.exit_statements', 15)
                ->where('links.export_all', 'http://10.10.100.193:1000/exportemployees?tipe=ALL')
            );
    }

    public function test_search_matches_name_nik_and_ktp(): void
    {
        $user = $this->hrdUser();

        foreach (['citra' => '1003', '1002' => '1002', '900004' => '1004'] as $term => $nik) {
            $this->actingAs($user)->get('/hrd/employees?search='.$term)
                ->assertInertia(fn (Assert $page) => $page->has('employees.data', 1)->where('employees.data.0.nik', $nik));
        }
    }

    public function test_filters_match_legacy_behaviour(): void
    {
        $user = $this->hrdUser();

        $this->actingAs($user)->get('/hrd/employees?status_employee=notactive')
            ->assertInertia(fn (Assert $p) => $p->has('employees.data', 1)->where('employees.data.0.exit_statement', 'RESIGN'));

        $this->actingAs($user)->get('/hrd/employees?department_id=2&job_id=2')
            ->assertInertia(fn (Assert $p) => $p->has('employees.data', 2));

        $this->actingAs($user)->get('/hrd/employees?exit_statement=RESIGN')
            ->assertInertia(fn (Assert $p) => $p->has('employees.data', 1));
    }

    public function test_pagination_respects_per_page_and_rejects_unknown_values(): void
    {
        $user = $this->hrdUser();

        $this->actingAs($user)->get('/hrd/employees?per_page=10')
            ->assertInertia(fn (Assert $p) => $p->where('employees.per_page', 10)->where('filters.per_page', 10));

        $this->actingAs($user)->get('/hrd/employees?per_page=9999')->assertSessionHasErrors('per_page');
        $this->actingAs($user)->get('/hrd/employees?status_employee=hacked')->assertSessionHasErrors('status_employee');
    }

    // ---------- Detail ----------

    public function test_show_returns_sections_and_history(): void
    {
        $this->actingAs($this->hrdUser())->get('/hrd/employees/1')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Hrd/Employees/Show')
                ->where('employee.nik', '1001')
                ->where('employee.sections.identitas', fn ($i) => $i['No. KTP'] === '3301010101900001'
                    && $i['Jenis Kelamin'] === 'Laki-laki')
                ->where('employee.sections.pekerjaan', fn ($p) => $p['Tanggal Masuk'] === '2020-01-15'
                    && $p['Akhir Kontrak'] === null)
                ->where('employee.sections.bank', fn ($b) => $b['No. Rekening'] === '1234567890')
                ->has('violations', 1)
                ->where('violations.0.type', 'SP 1')
                ->has('layoffs', 0)
                ->where('links.legacy_edit', 'http://10.10.100.193:8080/employees/1/edit')
            );

        $this->actingAs($this->hrdUser())->get('/hrd/employees/3')
            ->assertInertia(fn (Assert $page) => $page->has('layoffs', 1)->where('layoffs.0.date', '2026-06-01'));
    }

    public function test_show_returns_404_for_unknown_employee(): void
    {
        $this->actingAs($this->hrdUser())->get('/hrd/employees/999')->assertNotFound();
    }

    // ---------- Read-only & launcher ----------

    public function test_hrd_models_are_read_only(): void
    {
        $employee = Employee::first();
        $employee->name = 'Diubah';

        $this->expectException(LogicException::class);
        $employee->save();
    }

    public function test_dashboard_opens_internal_module_in_same_tab_and_launch_redirects(): void
    {
        $user = $this->hrdUser();

        $this->actingAs($user)->get('/')
            ->assertInertia(fn (Assert $page) => $page
                ->where('apps.0.slug', 'hrd-master-karyawan')
                ->where('apps.0.is_internal', true)
                ->where('apps.0.launch_url', '/sso/launch/hrd-master-karyawan')
            );

        $this->actingAs($user)->get('/sso/launch/hrd-master-karyawan')->assertRedirect('/hrd/employees');
    }

    public function test_admin_can_set_internal_path_as_app_link(): void
    {
        $admin = User::factory()->create(['role_id' => Role::create(['name' => Role::ADMIN])->id]);

        $this->actingAs($admin)->post('/settings/apps', [
            'name' => 'Modul Baru',
            'slug' => 'modul-baru',
            'app_link' => '/hrd/modul-baru',
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->post('/settings/apps', [
            'name' => 'Link Aneh',
            'slug' => 'link-aneh',
            'app_link' => 'javascript:alert(1)',
        ])->assertSessionHasErrors('app_link');
    }
}
