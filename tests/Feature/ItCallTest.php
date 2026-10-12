<?php

namespace Tests\Feature;

use App\Models\App;
use App\Models\Division;
use App\Models\ItAgent;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ItCallTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role_id' => Role::firstOrCreate(['name' => Role::ADMIN])->id]);
    }

    private function agent(array $attrs = []): ItAgent
    {
        return ItAgent::create($attrs + ['name' => 'Udin', 'role' => 'IT Support', 'wa_number' => '6281200000002', 'status' => 'ready']);
    }

    private function agentPayload(array $attrs = []): array
    {
        return $attrs + ['name' => 'Fatah', 'role' => 'IT Support', 'wa_number' => '0812-3456-7890', 'user_id' => null, 'status' => 'ready', 'status_note' => '', 'is_active' => true];
    }

    public function test_every_logged_in_user_can_open_it_call_and_sees_only_active_agents(): void
    {
        $div = Division::create(['name' => 'Payroll', 'slug' => 'payroll']);
        $user = User::factory()->create(['division_id' => $div->id]);
        $this->agent(['name' => 'Udin', 'status' => 'meeting', 'status_note' => 'Meeting sampai 14:00']);
        $this->agent(['name' => 'Lama', 'is_active' => false]);

        $this->actingAs($user)->get(route('itcall.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ItCall/Index')
                ->has('agents', 1)
                ->where('agents.0.name', 'Udin')
                ->where('agents.0.status', 'meeting')
                ->where('agents.0.status_note', 'Meeting sampai 14:00')
                ->where('myAgentId', null)
                ->where('reporter.name', $user->name)
                ->where('reporter.division', 'Payroll'));
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/it-call')->assertRedirect('/login');
    }

    public function test_agent_can_change_own_status_and_note(): void
    {
        $user = User::factory()->create();
        $agent = $this->agent(['user_id' => $user->id]);

        $this->actingAs($user)->get(route('itcall.index'))
            ->assertInertia(fn (Assert $page) => $page->where('myAgentId', $agent->id));

        $this->actingAs($user)->from('/it-call')
            ->patch(route('itcall.my-status'), ['status' => 'off', 'status_note' => ' Cuti setengah hari '])
            ->assertRedirect('/it-call')
            ->assertSessionHas('success');

        $agent->refresh();
        $this->assertSame('off', $agent->status);
        $this->assertSame('Cuti setengah hari', $agent->status_note);
        $this->assertNotNull($agent->status_changed_at);
    }

    public function test_non_agent_cannot_change_status_and_invalid_status_is_rejected(): void
    {
        $agentUser = User::factory()->create();
        $this->agent(['user_id' => $agentUser->id]);

        $this->actingAs(User::factory()->create())
            ->patch(route('itcall.my-status'), ['status' => 'off'])
            ->assertForbidden();

        $this->actingAs($agentUser)
            ->patch(route('itcall.my-status'), ['status' => 'liburan'])
            ->assertSessionHasErrors('status');

        $this->actingAs($agentUser)
            ->patch(route('itcall.my-status'), ['status' => 'meeting', 'status_note' => str_repeat('x', 61)])
            ->assertSessionHasErrors('status_note');
    }

    public function test_inactive_agent_account_cannot_change_status(): void
    {
        $user = User::factory()->create();
        $this->agent(['user_id' => $user->id, 'is_active' => false]);

        $this->actingAs($user)->patch(route('itcall.my-status'), ['status' => 'off'])->assertForbidden();
    }

    public function test_admin_can_create_update_and_delete_agents(): void
    {
        $admin = $this->admin();
        $linked = User::factory()->create(['username' => 'fatah']);

        $this->actingAs($admin)
            ->post(route('settings.it-agents.store'), $this->agentPayload(['user_id' => $linked->id]))
            ->assertRedirect(route('settings', ['tab' => 'itcall']))
            ->assertSessionHas('success');

        $agent = ItAgent::firstWhere('name', 'Fatah');
        $this->assertSame('6281234567890', $agent->wa_number);
        $this->assertSame($linked->id, $agent->user_id);

        $this->actingAs($admin)
            ->put(route('settings.it-agents.update', $agent), $this->agentPayload([
                'wa_number' => '+62 813 1111 2222', 'status' => 'lapangan', 'status_note' => 'Cek jaringan gedung B', 'is_active' => false,
            ]))
            ->assertRedirect(route('settings', ['tab' => 'itcall']));

        $agent->refresh();
        $this->assertSame('6281311112222', $agent->wa_number);
        $this->assertSame('lapangan', $agent->status);
        $this->assertSame('Cek jaringan gedung B', $agent->status_note);
        $this->assertFalse($agent->is_active);
        $this->assertNull($agent->user_id);

        $this->actingAs($admin)->delete(route('settings.it-agents.destroy', $agent))->assertRedirect();
        $this->assertDatabaseMissing('it_agents', ['id' => $agent->id]);
    }

    public function test_agent_validation(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();
        $this->agent(['user_id' => $user->id]);

        $this->actingAs($admin)
            ->post(route('settings.it-agents.store'), $this->agentPayload(['name' => '', 'wa_number' => '12345', 'status' => 'x', 'user_id' => $user->id]))
            ->assertSessionHasErrors(['name', 'wa_number', 'status', 'user_id']);

        $this->assertSame(1, ItAgent::count());
    }

    public function test_settings_page_sends_agents_and_non_admin_cannot_manage(): void
    {
        $admin = $this->admin();
        $this->agent(['status' => 'meeting']);

        $this->actingAs($admin)->get(route('settings', ['tab' => 'itcall']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings/Settings')
                ->has('itAgents', 1)
                ->where('itAgents.0.status', 'meeting')
                ->has('itUserOptions')
                ->where('itStatuses.off', 'Tidak ready'));

        $user = User::factory()->create();
        $agent = ItAgent::first();
        $this->actingAs($user)->post(route('settings.it-agents.store'), $this->agentPayload())->assertForbidden();
        $this->actingAs($user)->put(route('settings.it-agents.update', $agent), $this->agentPayload())->assertForbidden();
        $this->actingAs($user)->delete(route('settings.it-agents.destroy', $agent))->assertForbidden();
    }

    public function test_reset_command_sets_every_agent_back_to_ready(): void
    {
        Carbon::setTestNow('2026-10-05 07:00:00');
        $a = $this->agent(['status' => 'meeting', 'status_note' => 'Meeting sampai 14:00']);
        $b = $this->agent(['name' => 'Fatah', 'status' => 'off']);
        $c = $this->agent(['name' => 'Andy', 'status' => 'ready']);

        $this->artisan('itcall:reset-status')->assertSuccessful();

        foreach ([$a, $b, $c] as $agent) {
            $agent->refresh();
            $this->assertSame('ready', $agent->status);
            $this->assertNull($agent->status_note);
        }
        $this->assertTrue($a->status_changed_at->equalTo(now()));
        Carbon::setTestNow();
    }

    public function test_reset_is_scheduled_daily_at_configured_time(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($e) => str_contains($e->command ?? '', 'itcall:reset-status'));

        $this->assertNotNull($event);
        $this->assertSame('0 7 * * *', $event->expression);
        $this->assertSame(config('app.timezone'), $event->timezone);
    }

    public function test_it_call_card_is_registered_for_existing_divisions(): void
    {
        // Migration berjalan saat RefreshDatabase; divisi dibuat sesudahnya, jadi jalankan ulang logikanya.
        $div = Division::create(['name' => 'Payroll', 'slug' => 'payroll']);
        App::where('slug', 'it-call')->delete();
        (require database_path('migrations/2026_10_03_000002_register_it_call_app.php'))->up();

        $app = App::with('divisions')->firstWhere('slug', 'it-call');
        $this->assertSame('/it-call', $app->app_link);
        $this->assertTrue($app->isInternalModule());
        $this->assertTrue($app->divisions->contains($div));

        $user = User::factory()->create(['division_id' => $div->id]);
        $this->actingAs($user)->get(route('sso.launch', 'it-call'))->assertRedirect('/it-call');
    }
}
