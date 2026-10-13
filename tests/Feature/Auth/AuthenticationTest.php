<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_redirects_to_keycloak_sso(): void
    {
        $response = $this->get('/login');

        $response->assertRedirect(route('sso.redirect'));
    }

    public function test_users_can_logout(): void
    {
        config()->set('services.keycloak.base_url', 'https://keycloak.test');
        config()->set('services.keycloak.realms', 'testing');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $this->assertStringStartsWith(
            'https://keycloak.test/realms/testing/protocol/openid-connect/logout',
            $response->headers->get('Location'),
        );
    }
}
