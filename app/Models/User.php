<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'name',
        'email',
        'avatar',
        'role_id',
        'division_id',
        'last_login_at',
        'password',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function isAdmin(): bool
    {
        return $this->role?->name === Role::ADMIN;
    }

    /**
     * Aplikasi yang boleh dibuka user ini.
     * - Admin: semua aplikasi aktif.
     * - User lain: hanya aplikasi aktif yang terdaftar untuk divisinya.
     * - User tanpa divisi: tidak ada aplikasi.
     */
    public function accessibleApps(): Builder
    {
        return App::query()
            ->where('is_active', true)
            ->when(! $this->isAdmin(), function (Builder $query) {
                $query->whereHas('divisions', function (Builder $divisions) {
                    $divisions->where('divisions.id', $this->division_id);
                });
            });
    }

    public function canAccessApp(App $app): bool
    {
        return $this->is_active
            && $this->accessibleApps()->whereKey($app->getKey())->exists();
    }

    public function recordAppOpened(App $app): void
    {
        DB::table('user_recent_apps')->updateOrInsert(
            ['user_id' => $this->getKey(), 'app_id' => $app->getKey()],
            ['opened_at' => now(), 'updated_at' => now(), 'created_at' => now()],
        );
    }

    /**
     * ID aplikasi yang terakhir dibuka, terbaru lebih dulu.
     */
    public function recentAppIds(int $limit = 8): array
    {
        return DB::table('user_recent_apps')
            ->where('user_id', $this->getKey())
            ->orderByDesc('opened_at')
            ->limit($limit)
            ->pluck('app_id')
            ->all();
    }
}
