<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SsoLoginHandoff extends Model
{
    use HasFactory;

    protected $fillable = [
        'app_id',
        'user_id',
        'code_hash',
        'state',
        'expires_at',
        'used_at',
        'created_by_ip',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function app()
    {
        return $this->belongsTo(App::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
