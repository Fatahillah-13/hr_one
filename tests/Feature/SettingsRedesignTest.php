<?php

namespace Tests\Feature;

use App\Models\App;
use App\Models\Division;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Perilaku tambahan dari redesign HR One (Settings & navbar). */
class SettingsRedesignTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role_id' => Role::create(['name' => Role::ADMIN])->id]);
    }

    public function test_users_index_redirects_to_settings_users_tab_and_keeps_flash(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->withSession(['success' => 'User berhasil dihapus.'])
            ->get(route('users.index'))
            ->assertRedirect(route('settings', ['tab' => 'users']));

        $this->actingAs($admin)
            ->get(route('settings', ['tab' => 'users']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings/Settings')
                ->has('apps')
                ->where('flash.success', 'User berhasil dihapus.'));
    }

    public function test_creating_user_ends_on_settings_with_success_message(): void
    {
        $admin = $this->admin();
        $div = Division::create(['name' => 'HRD Master', 'slug' => 'hrd']);

        $this->actingAs($admin)
            ->followingRedirects()
            ->post(route('users.store'), [
                'name' => 'User Baru', 'username' => 'userbaru', 'email' => 'baru@test.local',
                'password' => 'password123', 'division_id' => $div->id, 'is_active' => true,
            ])
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings/Settings')
                ->has('apps')
                ->where('flash.success', 'User created successfully.'));
    }

    public function test_navbar_knows_if_user_can_open_master_karyawan(): void
    {
        $hrd = Division::create(['name' => 'HRD Master', 'slug' => 'hrd']);
        $it = Division::create(['name' => 'IT', 'slug' => 'it']);
        // Aplikasi modul dibuat oleh migration modul HRD.
        $module = App::firstOrCreate(['slug' => config('hrd.employees_app_slug')], ['name' => 'Master Karyawan', 'app_link' => '/hrd/employees', 'sso_enabled' => false]);
        $module->divisions()->sync([$hrd->id]);

        $hrdUser = User::factory()->create(['division_id' => $hrd->id]);
        $itUser = User::factory()->create(['division_id' => $it->id]);

        $this->actingAs($hrdUser)->get('/')->assertInertia(fn (Assert $page) => $page->where('auth.hasEmployees', true));
        $this->actingAs($itUser)->get('/')->assertInertia(fn (Assert $page) => $page->where('auth.hasEmployees', false));
    }
}
