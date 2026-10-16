<?php

namespace App\Support\VirtualOffice;

use App\Models\App;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

class VoAccess
{
    /** Admin Editor Denah: role Admin HR One, atau tercantum di VO_ADMINS (email / username / id). */
    public static function isAdmin(?Authenticatable $user): bool
    {
        if (! $user) {
            return false;
        }
        if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
            return true;
        }

        $admins = array_map('strtolower', config('virtual-office.admins', []));

        return in_array((string) $user->getAuthIdentifier(), $admins, true)
            || in_array(strtolower((string) ($user->email ?? '')), $admins, true)
            || in_array(strtolower((string) ($user->username ?? '')), $admins, true);
    }

    /** Boleh membuka Virtual Office: sama dengan aturan kartu aplikasi di Beranda HR One. */
    public static function canUse(?Authenticatable $user): bool
    {
        if (! $user) {
            return false;
        }
        if (! class_exists(App::class) || ! method_exists($user, 'canAccessApp')) {
            return true;
        }
        $app = self::app();

        return $app ? $user->canAccessApp($app) : false;
    }

    /**
     * Semua karyawan yang boleh memakai Virtual Office (aktif + admin atau divisinya diberi akses).
     * Dipakai untuk lantai, daftar chat, dan pilihan karyawan di Editor Denah.
     */
    public static function members(): Builder
    {
        $q = User::query();
        if (Schema::hasColumn('users', 'is_active')) {
            $q->where('is_active', true);
        }
        if (! class_exists(App::class) || ! method_exists(User::class, 'canAccessApp')) {
            return $q;
        }

        $app = self::app();
        if (! $app || ! $app->is_active) {
            return $q->whereRaw('1 = 0');
        }
        $divisionIds = $app->divisions()->pluck('divisions.id')->all();

        return $q->where(function (Builder $w) use ($divisionIds) {
            $w->whereIn('division_id', $divisionIds ?: [0])
                ->orWhereHas('role', fn (Builder $r) => $r->where('name', Role::ADMIN));
        });
    }

    /** Baris aplikasi Virtual Office di tabel apps (di-cache per request). */
    private static function app(): ?App
    {
        static $cache = [];
        $slug = (string) config('virtual-office.app_slug', 'virtual-office');
        if (! array_key_exists($slug, $cache) || app()->runningUnitTests()) {
            $cache[$slug] = App::where('slug', $slug)->first();
        }

        return $cache[$slug];
    }
}
