<?php

namespace Tests\Feature;

use App\Models\App;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    // ---------- Registrasi ----------

    public function test_self_registration_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();

        $this->post('/register', [
            'username' => 'stranger',
            'name' => 'Stranger',
            'email' => 'stranger@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertNotFound();

        $this->assertDatabaseMissing('users', ['username' => 'stranger']);
    }

    // ---------- Login ----------

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->post('/login', ['username' => $user->username, 'password' => 'password'])
            ->assertSessionHasErrors('username');

        $this->assertGuest();
    }

    public function test_successful_login_records_last_login_at(): void
    {
        $user = User::factory()->create(['last_login_at' => null]);

        $this->post('/login', ['username' => $user->username, 'password' => 'password']);

        $this->assertAuthenticated();
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_user_deactivated_during_session_is_logged_out(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get('/')->assertOk();

        $user->forceFill(['is_active' => false])->save();

        $this->actingAs($user->fresh())->get('/')
            ->assertRedirect(route('login'))
            ->assertSessionHas('status');

        $this->assertGuest();
    }

    // ---------- Dashboard ----------

    public function test_dashboard_only_lists_apps_of_users_division(): void
    {
        $payroll = Division::create(['name' => 'Payroll', 'slug' => 'payroll']);
        $it = Division::create(['name' => 'IT', 'slug' => 'it']);

        $salary = $this->makeApp('salary', $payroll);
        $this->makeApp('helpdesk', $it);
        $this->makeApp('old-payroll', $payroll, ['is_active' => false]);

        $user = User::factory()->create(['division_id' => $payroll->id]);

        $this->actingAs($user)->get('/')
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('apps', 1)
                ->where('apps.0.slug', 'salary')
                ->where('apps.0.launch_url', route('sso.launch', $salary->slug))
                ->missing('apps.0.sso_client_id')
                ->missing('apps.0.sso_redirect_uri')
                ->has('divisions', 1)
                ->where('divisions.0.slug', 'payroll')
            );
    }

    public function test_dashboard_lists_all_active_apps_for_admin(): void
    {
        $payroll = Division::create(['name' => 'Payroll', 'slug' => 'payroll']);
        $it = Division::create(['name' => 'IT', 'slug' => 'it']);
        $this->makeApp('salary', $payroll);
        $this->makeApp('helpdesk', $it);

        $admin = User::factory()->create([
            'role_id' => Role::create(['name' => Role::ADMIN])->id,
        ]);

        $this->actingAs($admin)->get('/')
            // 2 aplikasi di atas + modul internal "Master Karyawan", "IT Call", dan "Virtual Office" yang didaftarkan migration.
            ->assertInertia(fn (Assert $page) => $page->has('apps', 5)->has('divisions', 2));
    }

    public function test_dashboard_shows_recent_apps_newest_first(): void
    {
        $payroll = Division::create(['name' => 'Payroll', 'slug' => 'payroll']);
        $a = $this->makeApp('app-a', $payroll);
        $b = $this->makeApp('app-b', $payroll);
        $user = User::factory()->create(['division_id' => $payroll->id]);

        $this->travelTo(now()->subMinutes(5), fn () => $user->recordAppOpened($a));
        $user->recordAppOpened($b);

        $this->actingAs($user)->get('/')
            ->assertInertia(fn (Assert $page) => $page
                ->has('recentApps', 2)
                ->where('recentApps.0.slug', 'app-b')
                ->where('recentApps.1.slug', 'app-a')
            );
    }

    public function test_non_admin_cannot_open_settings(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/settings')->assertForbidden();
        $this->actingAs($user)->get('/settings/apps')->assertForbidden();
    }

    // ---------- Profile ----------

    public function test_user_cannot_change_own_email_or_delete_account(): void
    {
        $user = User::factory()->create(['email' => 'asli@example.test']);

        $this->actingAs($user)->patch('/profile', [
            'name' => 'Nama Baru',
            'email' => 'palsu@example.test',
        ])->assertRedirect('/profile');

        $user->refresh();
        $this->assertSame('Nama Baru', $user->name);
        $this->assertSame('asli@example.test', $user->email);

        $this->actingAs($user)->delete('/profile', ['password' => 'password'])->assertStatus(405);
        $this->assertNotNull($user->fresh());
    }

    protected function makeApp(string $slug, Division $division, array $attributes = []): App
    {
        $app = App::create(array_merge([
            'name' => ucfirst($slug),
            'slug' => $slug,
            'app_link' => "http://10.10.100.193/{$slug}",
            'sso_enabled' => true,
            'sso_client_id' => "{$slug}-client",
            'sso_redirect_uri' => "http://10.10.100.193/{$slug}/sso/callback",
            'sso_client_secret_hash' => bcrypt('secret-123456'),
        ], $attributes));

        if (array_key_exists('is_active', $attributes)) {
            $app->forceFill(['is_active' => $attributes['is_active']])->save();
        }

        $app->divisions()->attach($division);

        return $app;
    }
}
