<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class App extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'app_link',
        'is_active',
        'sso_enabled',
        'sso_client_id',
        'sso_redirect_uri',
        'sso_client_secret_hash',
    ];

    protected $hidden = [
        'sso_client_secret_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** Modul yang dibangun di dalam HR One sendiri (app_link berupa path, mis. "/hrd/employees"). */
    public function isInternalModule(): bool
    {
        return str_starts_with((string) $this->app_link, '/') && ! $this->sso_enabled;
    }

    public function divisions()
    {
        return $this->belongsToMany(Division::class)->withTimestamps();
    }
}
