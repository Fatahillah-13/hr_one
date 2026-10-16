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

    /** Boleh membuka Virtual Office: semua user yang aktif boleh akses. */
    public static function canUse(?Authenticatable $user): bool
    {
        if (! $user) {
            return false;
        }

        return (bool) ($user->is_active ?? true);
    }

    /**
     * Semua karyawan aktif untuk Virtual Office.
     * Dipakai untuk lantai, daftar chat, dan pilihan karyawan di Editor Denah.
     */
    public static function members(): Builder
    {
        $q = User::query();
        if (Schema::hasColumn('users', 'is_active')) {
            $q->where('is_active', true);
        }

        return $q;
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
