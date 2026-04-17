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
            'sso_enabled' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function divisions()
    {
        return $this->belongsToMany(Division::class)->withTimestamps();
    }

    public function ssoLoginHandoffs()
    {
        return $this->hasMany(SsoLoginHandoff::class);
    }
}
