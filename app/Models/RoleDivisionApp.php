<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleDivisionApp extends Model
{
    protected $table = 'role_division_app';

    protected $fillable = [
        'role_id',
        'division_id',
        'app_id',
        'is_allowed',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function app()
    {
        return $this->belongsTo(App::class);
    }
}
