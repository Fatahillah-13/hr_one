<?php

namespace Tests\Feature;

use App\Models\App;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SsoLoginTest extends TestCase
{
    use RefreshDatabase;

    protected const PRIVATE_KEY = <<<'KEY'
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqHkyxBKgVJn2M
yxt8VLEtGAqlXcUYVZLK9qigHM5QjdHM9IQDhp5pJhDOQP+YUjdCuS3Zq5+702ps
xll3zL501MYJqHUrwPr0p6TX7YI89nq1LhgD2Q0ODJcgidvClJDYtEPMljv5VnHx
ZDvg4dKLV4dJb97DfFWCv5WzQSqc6ZeE3nyWJf/papCDaoeMJzNC4o0GDevfJRiF
WQuQUPK2XK1D8GwtxGnYMAFsCq+p+zUUmBwljNEynp+JizMSoZBEdXkVJ3Y9FQ+p
7QloCCSwaeRht/ZN1OHcvXVu7E3IUGFsInFn2IPVh1Y2D87tIv49n0nFvS8xgXII
gVQzJIhZAgMBAAECggEAJTZ7kD10hyvkSugjGw9rsnGP4pyggLI3ai6KtHuYpgZf
3nWeaycHf/jTtEqDns5dSDs5zGO+jVex8BlzeMFQ6D2jFHnFJ80PGHWTmaha1PsV
3Iw4tJ7GPEyEwplleSsGhGDqc9ZpSCGgyy0h7A95/wEmlunh0OFh0zgVhyC6MZiL
1zuYhupqkOKPIkoVoCPjqUXW2kK2ns+/LhcANtCx9IPCBwSpFXuF5OoagePu5K49
5pypzEnrvPnhWTy2y3P86X5QwLJ29HRqup118zg32Fkwej5DRVL0qVhae4zv5/5J
Iv+UZWvq2Uj0UeKkvmLxXqpg5uqMeZdmm3Xh4GKAAQKBgQDlW9CQHx9LnwOaUEUS
p5FuIN+ITUWTvkQRwQlni4SHsROAlTyLG4RrG+9QLInCIzSLwjj+fjSFV07VTH6k
HvQJ1h+5QrhouS3Wq1StDtsAnBtoGH8N8d/9lxUAAZUKFmw1qvpQ67TPJQ75VGjA
t5aS8dkJv4J2n/bdqrMnMuSoNQKBgQC94OvtkB3SFr0/QY2Z2mpGCmnfk8Evh59Z
F1f06jX5yOXqNEwpv0+Bla5qv4gOg/hUYMEbx5BwThGIwRVqPA6Ewv3aIBczrWoY
J5d+VhDxf25T8GM83dhteyPRpKMPUjWUTZKQ94/8mLAesBmCMNb+siLUSXQWx8IB
LCddvwdMFQKBgBcsxdAqNOFROe33umL+J4W3MJ73H9aj3QDmPmsF/+guDkhpy+pK
Z4DjG7VAKtNA92g/wb6FRg1LGx4WUp2GuyXbSu1PPo7mVylfuniaDarsGyDTiNMB
454eC/MqNcMFLP3nPs+6YVSk6/RpgQQoCMDkSwffH/GYjDstqliFnfEZAoGBAIzl
tUxQT8CQvReOVjvfdlLI8W1FX+ocEmNyzgLgNPNIX0teSVIFM0MuRgHSZGyZAxHh
xgoOGSEs3RgEZxawv/lGFEbi3zSqrvqDjofh56q8a6r/yzPkTvBWmuq654C7+SQ2
N9c4zPCcgLwU4qjYAwF2QCAU7X7l9hEWqZOH6CtNAoGBAKVb+fFz49Yvq3PZHM53
Tc92DbceQMLZhNN9J3Z3GhoJ/mb9VnFd81qmASFBAMT/0EMRpUhY7dDPG/dD3lkx
eD6+xFjZUOhnUWXe0ls4I1nl2Dh0zBt2FkSdHppj1NVG6JX2EGRhVvWAcv6S8mCa
Satlpyqr68d6o+piAj0krHqI
-----END PRIVATE KEY-----
KEY;

    protected const PUBLIC_KEY = <<<'KEY'
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqh5MsQSoFSZ9jMsbfFSx
LRgKpV3FGFWSyvaooBzOUI3RzPSEA4aeaSYQzkD/mFI3Qrkt2aufu9NqbMZZd8y+
dNTGCah1K8D69Kek1+2CPPZ6tS4YA9kNDgyXIInbwpSQ2LRDzJY7+VZx8WQ74OHS
i1eHSW/ew3xVgr+Vs0EqnOmXhN58liX/6WqQg2qHjCczQuKNBg3r3yUYhVkLkFDy
tlytQ/BsLcRp2DABbAqvqfs1FJgcJYzRMp6fiYszEqGQRHV5FSd2PRUPqe0JaAgk
sGnkYbf2TdTh3L11buxNyFBhbCJxZ9iD1YdWNg/O7SL+PZ9Jxb0vMYFyCIFUMySI
WQIDAQAB
-----END PUBLIC KEY-----
KEY;

    protected string $privateKey;

    protected string $publicKey;

    protected function setUp(): void
    {
        parent::setUp();

        $this->privateKey = self::PRIVATE_KEY;
        $this->publicKey = self::PUBLIC_KEY;

        Config::set('sso.private_key', $this->privateKey);
        Config::set('sso.public_key', $this->publicKey);
        Config::set('sso.issuer', 'http://hr-one.test');
        Config::set('sso.code_ttl', 60);
        Config::set('sso.jwt_ttl', 300);
    }

    public function test_authenticated_user_can_launch_an_sso_enabled_app(): void
    {
        $user = User::factory()->create();
        $app = $this->makeSsoApp();

        $response = $this->actingAs($user)->get(route('sso.launch', $app));

        $response->assertRedirect();
        $location = $response->headers->get('Location');

        $this->assertNotNull($location);
        $this->assertStringStartsWith('http://localhost:8001/sso/callback?', $location);

        parse_str(parse_url($location, PHP_URL_QUERY) ?? '', $query);

        $this->assertArrayHasKey('code', $query);
        $this->assertArrayHasKey('state', $query);
        $this->assertDatabaseHas('sso_login_handoffs', [
            'app_id' => $app->id,
            'user_id' => $user->id,
            'code_hash' => hash('sha256', $query['code']),
            'state' => $query['state'],
        ]);
    }

    public function test_guest_cannot_access_sso_launch_route(): void
    {
        $app = $this->makeSsoApp();

        $response = $this->get(route('sso.launch', $app));

        $response->assertRedirect(route('login'));
    }

    public function test_exchange_rejects_invalid_client_credentials(): void
    {
        $user = User::factory()->create();
        $app = $this->makeSsoApp();
        $launchResponse = $this->actingAs($user)->get(route('sso.launch', $app));
        parse_str(parse_url($launchResponse->headers->get('Location'), PHP_URL_QUERY) ?? '', $query);

        $response = $this->postJson(route('api.sso.exchange'), [
            'client_id' => $app->sso_client_id,
            'client_secret' => 'wrong-secret-value',
            'code' => $query['code'],
            'state' => $query['state'],
        ]);

        $response->assertStatus(401)->assertJson([
            'message' => 'Invalid SSO client credentials.',
        ]);
    }

    public function test_exchange_rejects_expired_code(): void
    {
        Carbon::setTestNow(now());

        $user = User::factory()->create();
        $app = $this->makeSsoApp();
        $launchResponse = $this->actingAs($user)->get(route('sso.launch', $app));
        parse_str(parse_url($launchResponse->headers->get('Location'), PHP_URL_QUERY) ?? '', $query);

        Carbon::setTestNow(now()->addSeconds(61));

        $response = $this->postJson(route('api.sso.exchange'), [
            'client_id' => $app->sso_client_id,
            'client_secret' => 'very-secret-123',
            'code' => $query['code'],
            'state' => $query['state'],
        ]);

        $response->assertStatus(422)->assertJson([
            'message' => 'This SSO handoff code has expired.',
        ]);

        Carbon::setTestNow();
    }

    public function test_exchange_rejects_reused_code(): void
    {
        $user = User::factory()->create();
        $app = $this->makeSsoApp();
        $launchResponse = $this->actingAs($user)->get(route('sso.launch', $app));
        parse_str(parse_url($launchResponse->headers->get('Location'), PHP_URL_QUERY) ?? '', $query);

        $payload = [
            'client_id' => $app->sso_client_id,
            'client_secret' => 'very-secret-123',
            'code' => $query['code'],
            'state' => $query['state'],
        ];

        $this->postJson(route('api.sso.exchange'), $payload)->assertOk();
        $this->postJson(route('api.sso.exchange'), $payload)
            ->assertStatus(422)
            ->assertJson([
                'message' => 'This SSO handoff code has already been used.',
            ]);
    }

    public function test_exchange_returns_a_signed_jwt_with_expected_claims(): void
    {
        $user = User::factory()->create([
            'username' => 'joko',
            'name' => 'Joko Widodo',
            'email' => 'joko@example.test',
        ]);
        $app = $this->makeSsoApp([
            'sso_client_id' => 'payroll-local',
        ]);
        $launchResponse = $this->actingAs($user)->get(route('sso.launch', $app));
        parse_str(parse_url($launchResponse->headers->get('Location'), PHP_URL_QUERY) ?? '', $query);

        $response = $this->postJson(route('api.sso.exchange'), [
            'client_id' => $app->sso_client_id,
            'client_secret' => 'very-secret-123',
            'code' => $query['code'],
            'state' => $query['state'],
        ]);

        $response->assertOk();

        $token = $response->json('access_token');
        $claims = $this->decodeJwtPayload($token);

        $this->assertSame('http://hr-one.test', $claims['iss']);
        $this->assertSame('payroll-local', $claims['aud']);
        $this->assertSame((string) $user->id, $claims['sub']);
        $this->assertSame('joko', $claims['username']);
        $this->assertSame('Joko Widodo', $claims['name']);
        $this->assertSame('joko@example.test', $claims['email']);
        $this->assertTrue($claims['exp'] > $claims['iat']);
    }

    protected function makeSsoApp(array $overrides = []): App
    {
        return App::create(array_merge([
            'name' => 'Payroll',
            'slug' => 'payroll',
            'description' => 'Payroll system',
            'app_link' => 'http://localhost:8001',
            'sso_enabled' => true,
            'sso_client_id' => 'payroll-client',
            'sso_redirect_uri' => 'http://localhost:8001/sso/callback',
            'sso_client_secret_hash' => Hash::make('very-secret-123'),
        ], $overrides));
    }

    protected function decodeJwtPayload(string $token): array
    {
        [$header, $payload, $signature] = explode('.', $token);

        $signingInput = $header.'.'.$payload;
        $decodedSignature = base64_decode(strtr($signature, '-_', '+/'));
        $verified = openssl_verify($signingInput, $decodedSignature, $this->publicKey, OPENSSL_ALGO_SHA256);

        $this->assertSame(1, $verified);

        return json_decode(base64_decode(strtr($payload, '-_', '+/')), true, 512, JSON_THROW_ON_ERROR);
    }
}
