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
        'birth_date',
        'avatar',
        'role_id',
        'division_id',
        'last_login_at',
        'password',
        'is_active',
        'must_change_password',
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
            'birth_date' => 'date:Y-m-d',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (User $user) {
            // Jika kolom password baru saja diubah / diupdate, sinkronkan ke database aplikasi lokal
            if ($user->wasChanged('password')) {
                \App\Services\PasswordSyncService::sync($user, $user->password);
            }
        });
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
     * - Jika role user memiliki daftar aplikasi yang dipilih secara spesifik:
     *     Gunakan aplikasi aktif yang diizinkan untuk rolenya (difilter divisi jika diset).
     * - User tanpa divisi (All): semua aplikasi aktif (atau sesuai izin role jika dikonfigurasi).
     * - User dengan divisi: aplikasi aktif yang terdaftar untuk divisinya + virtual-office.
     */
    public function accessibleApps(): Builder
    {
        return App::query()
            ->where('is_active', true)
            ->when(! $this->isAdmin(), function (Builder $query) {
                // Jika role user memiliki konfigurasi aplikasi khusus (role centang aplikasi)
                if ($this->role && $this->role->apps()->exists()) {
                    $query->whereHas('roles', function (Builder $roles) {
                        $roles->where('roles.id', $this->role_id);
                    });
                }

                if ($this->division_id) {
                    $query->where(function (Builder $q) {
                        $q->where('slug', 'virtual-office')
                          ->orWhereHas('divisions', function (Builder $divisions) {
                              $divisions->where('divisions.id', $this->division_id);
                          });
                    });
                }
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
