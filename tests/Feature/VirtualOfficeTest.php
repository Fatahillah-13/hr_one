<?php

namespace Tests\Feature;

use App\Models\App;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use App\Models\VirtualOffice\Conversation;
use App\Models\VirtualOffice\Message;
use App\Models\VirtualOffice\OfficeObject;
use App\Models\VirtualOffice\Profile;
use App\Models\VirtualOffice\Seat;
use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class VirtualOfficeTest extends TestCase
{
    use RefreshDatabase;

    protected Division $hrd;

    protected function setUp(): void
    {
        parent::setUp();

        // Tanpa server Reverb & tanpa database HRD kecuali test yang membutuhkannya.
        Config::set('broadcasting.default', 'null');
        Config::set('virtual-office.employee.enabled', false);
        Cache::flush();

        // Aplikasi "Virtual Office" didaftarkan migration; buka untuk divisi HRD saja.
        $this->hrd = Division::create(['name' => 'HRD', 'slug' => 'hrd']);
        $this->voApp()->divisions()->attach($this->hrd);
    }

    private function voApp(): App
    {
        return App::where('slug', 'virtual-office')->firstOrFail();
    }

    private function member(array $attrs = []): User
    {
        return User::factory()->create($attrs + ['division_id' => $this->hrd->id, 'is_active' => true]);
    }

    private function admin(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => Role::ADMIN])->id, 'is_active' => true]);
    }

    private function outsider(): User
    {
        $other = Division::create(['name' => 'Produksi', 'slug' => 'produksi']);

        return User::factory()->create(['division_id' => $other->id, 'is_active' => true]);
    }

    // ---------- akses & halaman ----------

    public function test_app_is_registered_with_chat_icon_and_link(): void
    {
        $app = $this->voApp();
        $this->assertSame('/virtual-office', $app->app_link);
        $this->assertSame('chat', $app->icon);
        $this->assertTrue((bool) $app->is_active);
    }

    public function test_guest_is_redirected_and_other_division_is_forbidden(): void
    {
        $this->get('/virtual-office')->assertRedirect('/login');
        $this->actingAs($this->outsider())->get('/virtual-office')->assertForbidden();
    }

    public function test_member_sees_floor_with_only_allowed_users(): void
    {
        $me = $this->member(['name' => 'Andy']);
        $this->member(['name' => 'Tika']);
        $this->member(['name' => 'Lama', 'is_active' => false]);
        $this->outsider();
        Seat::create(['code' => 'A-1', 'zone' => 'A', 'facing' => 'L', 'has_panel' => true, 'x' => 100, 'y' => 100, 'w' => 36, 'd' => 40, 'user_id' => $me->id]
            + Seat::derive(['facing' => 'L', 'x' => 100, 'y' => 100, 'w' => 36, 'd' => 40, 'is_printer' => false]));

        $this->actingAs($me)->get('/virtual-office')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('VirtualOffice/Index')
                ->has('users', 2)
                ->where('users.0.name', 'Andy')
                ->where('users.0.seat_code', 'A-1')
                ->where('canEdit', false)
                ->where('virtualOffice.unread', 0));
    }

    public function test_shared_prop_is_null_without_access(): void
    {
        $this->actingAs($this->outsider())->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('virtualOffice', null));
    }

    // ---------- chat ----------

    public function test_personal_chat_send_read_and_unread_count(): void
    {
        $a = $this->member();
        $b = $this->member();

        $cid = $this->actingAs($a)->postJson("/virtual-office/conversations/personal/{$b->id}")
            ->assertOk()->json('conversation.id');
        $this->actingAs($a)->postJson("/virtual-office/conversations/{$cid}/messages", ['body' => '  Halo Tika  '])
            ->assertOk()->assertJsonPath('message.body', 'Halo Tika');

        // penerima: 1 belum dibaca (badge header), lalu dibaca
        $this->actingAs($b)->get('/virtual-office')->assertInertia(fn (Assert $p) => $p->where('virtualOffice.unread', 1));
        $this->actingAs($b)->getJson("/virtual-office/conversations/{$cid}/messages")->assertOk()->assertJsonCount(1, 'messages');
        $this->actingAs($b)->postJson("/virtual-office/conversations/{$cid}/read")->assertOk();
        $this->actingAs($b)->get('/virtual-office')->assertInertia(fn (Assert $p) => $p->where('virtualOffice.unread', 0));

        // membuka chat yang sama tidak membuat percakapan baru
        $this->actingAs($b)->postJson("/virtual-office/conversations/personal/{$a->id}")->assertJsonPath('conversation.id', $cid);
    }

    public function test_non_member_cannot_read_or_post_in_conversation(): void
    {
        [$a, $b, $c] = [$this->member(), $this->member(), $this->member()];
        $cid = $this->actingAs($a)->postJson("/virtual-office/conversations/personal/{$b->id}")->json('conversation.id');

        $this->actingAs($c)->getJson("/virtual-office/conversations/{$cid}/messages")->assertForbidden();
        $this->actingAs($c)->postJson("/virtual-office/conversations/{$cid}/messages", ['body' => 'nyelonong'])->assertForbidden();
        $this->assertSame(0, Message::count());
    }

    public function test_cannot_chat_users_without_access_and_groups_drop_them(): void
    {
        $a = $this->member();
        $b = $this->member();
        $out = $this->outsider();
        $inactive = $this->member(['is_active' => false]);

        $this->actingAs($a)->postJson("/virtual-office/conversations/personal/{$out->id}")->assertStatus(422);

        $res = $this->actingAs($a)->postJson('/virtual-office/conversations/group', [
            'name' => 'Tim Payroll', 'member_ids' => [$b->id, $out->id, $inactive->id],
        ])->assertOk();
        $members = Conversation::find($res->json('conversation.id'))->members()->pluck('users.id')->sort()->values()->all();
        $this->assertSame(collect([$a->id, $b->id])->sort()->values()->all(), $members);

        $this->actingAs($a)->postJson('/virtual-office/conversations/group', ['name' => 'Kosong', 'member_ids' => [$out->id]])
            ->assertStatus(422);
    }

    public function test_message_is_saved_even_when_realtime_server_is_down(): void
    {
        Broadcast::extend('mati', fn () => new class extends Broadcaster
        {
            public function auth($request) {}

            public function validAuthenticationResponse($request, $result) {}

            public function broadcast(array $channels, $event, array $payload = [])
            {
                throw new RuntimeException('Reverb tidak jalan');
            }
        });
        Config::set('broadcasting.connections.mati', ['driver' => 'mati']);
        Config::set('broadcasting.default', 'mati');

        $a = $this->member();
        $b = $this->member();
        $cid = $this->actingAs($a)->postJson("/virtual-office/conversations/personal/{$b->id}")->json('conversation.id');

        $this->actingAs($a)->postJson("/virtual-office/conversations/{$cid}/messages", ['body' => 'Tetap masuk'])->assertOk();
        $this->actingAs($a)->putJson('/virtual-office/status', ['status' => 'rapat', 'bubble' => 'Rapat s/d 11.00', 'duration' => '60'])->assertOk();
        $this->assertSame(1, Message::count());
    }

    public function test_user_with_chat_history_can_still_be_deleted(): void
    {
        $a = $this->member();
        $b = $this->member();
        $cid = $this->actingAs($a)->postJson("/virtual-office/conversations/personal/{$b->id}")->json('conversation.id');
        $this->actingAs($a)->postJson("/virtual-office/conversations/{$cid}/messages", ['body' => 'Halo'])->assertOk();

        $a->delete();

        $this->assertNull(Message::first()->user_id);
        $this->assertNull(Conversation::find($cid)->created_by);
    }

    // ---------- status ----------

    public function test_status_only_accepts_real_statuses(): void
    {
        $me = $this->member();
        $this->actingAs($me)->putJson('/virtual-office/status', ['status' => 'hadir'])->assertStatus(422);
        $this->actingAs($me)->putJson('/virtual-office/status', ['status' => 'sibuk', 'bubble' => 'Tutup payroll', 'duration' => 'today'])
            ->assertOk();
        $this->assertSame('sibuk', Profile::find($me->id)->status);
        $this->assertSame('Tutup payroll', Profile::find($me->id)->bubble);
    }

    public function test_expired_bubbles_are_cleared_by_scheduler_command(): void
    {
        $me = $this->member();
        Profile::forUser($me->id)->update(['bubble' => 'Istirahat', 'bubble_expires_at' => now()->subMinute()]);

        $this->artisan('vo:expire-bubbles')->assertSuccessful();
        $this->assertNull(Profile::find($me->id)->bubble);
    }

    // ---------- Editor Denah ----------

    private function layout(array $seats, array $objects = []): array
    {
        return ['seats' => $seats, 'objects' => $objects];
    }

    private function seat(string $code, int $x, ?int $userId = null): array
    {
        return ['id' => null, 'code' => $code, 'zone' => 'A', 'facing' => 'L', 'has_panel' => true, 'is_printer' => false,
            'x' => $x, 'y' => 100, 'w' => 36, 'd' => 40, 'user_id' => $userId];
    }

    public function test_editor_is_admin_only(): void
    {
        $this->actingAs($this->member())->get('/virtual-office/editor')->assertForbidden();
        $this->actingAs($this->admin())->get('/virtual-office/editor')->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('VirtualOffice/Editor'));
    }

    public function test_admin_publishes_layout_with_editable_zone_label(): void
    {
        $admin = $this->admin();
        $emp = $this->member();

        $this->actingAs($admin)->postJson('/virtual-office/editor/publish', $this->layout(
            [$this->seat('a-1', 100, $emp->id), $this->seat('A-2', 140)],
            [['type' => 'zone_label', 'x' => 60, 'y' => 160, 'w' => 168, 'd' => 56, 'rotation' => 0, 'label' => 'TIM PAYROLL'],
             ['type' => 'wall', 'x' => 20, 'y' => 12, 'w' => 8, 'd' => 1060, 'rotation' => 90, 'label' => null]],
        ) + ['note' => 'Uji'])->assertOk();

        $this->assertSame(['A-1', 'A-2'], Seat::orderBy('code')->pluck('code')->all());
        $this->assertSame($emp->id, Seat::where('code', 'A-1')->value('user_id'));
        $this->assertSame('TIM PAYROLL', OfficeObject::where('type', 'zone_label')->value('label'));
    }

    public function test_publish_rejects_duplicate_codes_ignoring_case_and_double_assignment(): void
    {
        $admin = $this->admin();
        $emp = $this->member();

        $this->actingAs($admin)->postJson('/virtual-office/editor/publish', $this->layout([$this->seat('a-1', 100), $this->seat('A-1 ', 140)]))
            ->assertStatus(422);
        $this->actingAs($admin)->postJson('/virtual-office/editor/publish', $this->layout([$this->seat('A-1', 100, $emp->id), $this->seat('A-2', 140, $emp->id)]))
            ->assertStatus(422);
        $this->assertSame(0, Seat::count());
    }

    // ---------- data karyawan & absensi dari database HRD ----------

    public function test_attendance_sync_sets_present_home_leave_and_absent(): void
    {
        Config::set('database.connections.hrd', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => false]);
        DB::purge('hrd');
        $s = Schema::connection('hrd');
        $s->create('departments', fn (Blueprint $t) => [$t->id(), $t->string('department')]);
        $s->create('jobs', fn (Blueprint $t) => [$t->id(), $t->string('job_level')]);
        $s->create('employees', function (Blueprint $t) {
            $t->id();
            $t->string('number_of_employees')->nullable();
            $t->string('finger_id')->nullable();
            $t->string('name')->nullable();
            $t->string('bagian')->nullable();
            $t->unsignedBigInteger('department_id')->nullable();
            $t->unsignedBigInteger('job_id')->nullable();
        });
        $s->create('attendance_logs', fn (Blueprint $t) => [$t->id(), $t->string('finger_id'), $t->dateTime('scan_time')]);
        $s->create('leaves', fn (Blueprint $t) => [$t->id(), $t->unsignedBigInteger('employee_id'), $t->date('start_date'), $t->date('end_date'), $t->string('type')]);

        $hrd = DB::connection('hrd');
        $hrd->table('departments')->insert(['department' => 'HRD']);
        $hrd->table('jobs')->insert(['job_level' => 'STAFF']);
        foreach (['1001' => 'F1', '1002' => 'F2', '1003' => 'F3', '1004' => 'F4'] as $nik => $finger) {
            $hrd->table('employees')->insert(['number_of_employees' => $nik, 'finger_id' => $finger, 'department_id' => 1, 'job_id' => 1]);
        }
        Carbon::setTestNow(Carbon::today()->setTime(17, 0));
        $hrd->table('attendance_logs')->insert([
            ['finger_id' => 'F1', 'scan_time' => Carbon::today()->setTime(7, 30)],                       // masuk saja
            ['finger_id' => 'F2', 'scan_time' => Carbon::today()->setTime(7, 40)],                       // masuk...
            ['finger_id' => 'F2', 'scan_time' => Carbon::today()->setTime(16, 5)],                       // ...dan pulang
            ['finger_id' => 'F4', 'scan_time' => Carbon::yesterday()->setTime(7, 0)],                     // kemarin, bukan hari ini
        ]);
        $hrd->table('leaves')->insert(['employee_id' => 3, 'start_date' => Carbon::today()->subDay(), 'end_date' => Carbon::today()->addDay(), 'type' => 'Sakit']);

        Config::set('virtual-office.employee.enabled', true);
        Config::set('virtual-office.attendance.enabled', true);
        Config::set('virtual-office.attendance.source', 'database');
        Config::set('virtual-office.attendance.leave_table', 'leaves');
        $users = collect(['1001', '1002', '1003', '1004'])->mapWithKeys(fn ($nik) => [$nik => $this->member(['username' => $nik])]);

        $this->artisan('vo:sync-attendance')->assertSuccessful();

        $state = fn ($nik) => Profile::find($users[$nik]->id);
        $this->assertSame('present', $state('1001')->attendance_state);
        $this->assertSame('home', $state('1002')->attendance_state);
        $this->assertSame('Sudah pulang', $state('1002')->attendance_label);
        $this->assertSame('leave', $state('1003')->attendance_state);
        $this->assertSame('Tidak masuk hari ini', $state('1003')->attendance_label); // jenis "sakit" tidak ditampilkan
        $this->assertSame('absent', $state('1004')->attendance_state);

        // data karyawan ikut tampil di lantai
        $id = $users['1001']->id;
        $this->actingAs($users['1001'])->get('/virtual-office')->assertInertia(fn (Assert $p) => $p
            ->where('users', function ($list) use ($id) {
                $u = collect($list)->firstWhere('id', $id);

                return $u['employee']['nik'] === '1001'
                    && $u['employee']['department'] === 'HRD'
                    && $u['profile']['attendance']['state'] === 'present';
            }));

        Carbon::setTestNow();
    }

    public function test_attendance_sync_from_jpayroll_api(): void
    {
        Carbon::setTestNow(Carbon::today()->setTime(17, 0));
        Config::set('virtual-office.attendance.enabled', true);
        Config::set('virtual-office.attendance.source', 'api');
        Config::set('virtual-office.attendance.api.url', 'http://jpayroll.test/api/attendance');
        Config::set('virtual-office.attendance.api.token', 'rahasia');
        Http::fake([
            'jpayroll.test/*' => Http::response(['data' => [
                ['number_of_employees' => '2001', 'time_in' => '07:31', 'time_out' => null, 'leave_type' => null],
                ['number_of_employees' => '2002', 'time_in' => '07:40:00', 'time_out' => '16:05:00', 'leave_type' => ''],
                ['number_of_employees' => '2003', 'time_in' => null, 'time_out' => null, 'leave_type' => 'CUTI'],
                ['number_of_employees' => '2004', 'time_in' => null, 'time_out' => null, 'leave_type' => 'Sakit'],
                ['number_of_employees' => '9999', 'time_in' => '07:00', 'time_out' => null, 'leave_type' => null], // bukan user HR One
            ]]),
        ]);
        $users = collect(['2001', '2002', '2003', '2004', '2005'])->mapWithKeys(fn ($nik) => [$nik => $this->member(['username' => $nik])]);

        $this->artisan('vo:sync-attendance')->assertSuccessful();

        Http::assertSent(fn ($req) => $req->hasHeader('Authorization', 'Bearer rahasia')
            && str_contains($req->url(), 'date='.Carbon::today()->toDateString()));
        $p = fn ($nik) => Profile::find($users[$nik]->id);
        $this->assertSame('present', $p('2001')->attendance_state);
        $this->assertSame('home', $p('2002')->attendance_state);
        $this->assertSame(['leave', 'Cuti'], [$p('2003')->attendance_state, $p('2003')->attendance_label]);
        $this->assertSame('Tidak masuk hari ini', $p('2004')->attendance_label); // "sakit" tidak ditampilkan
        $this->assertSame('absent', $p('2005')->attendance_state);

        Carbon::setTestNow();
    }

    public function test_attendance_api_failure_keeps_previous_status(): void
    {
        Config::set('virtual-office.attendance.enabled', true);
        Config::set('virtual-office.attendance.source', 'api');
        Config::set('virtual-office.attendance.api.url', 'http://jpayroll.test/api/attendance');
        Http::fake(['jpayroll.test/*' => Http::response('error', 500)]);
        $me = $this->member(['username' => '3001']);
        Profile::forUser($me->id)->update(['attendance_state' => 'present']);

        $this->artisan('vo:sync-attendance')->assertFailed();
        $this->assertSame('present', Profile::find($me->id)->attendance_state);
    }

}
