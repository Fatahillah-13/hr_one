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
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function divisions()
    {
        return $this->belongsToMany(Division::class)->withTimestamps();
    }
}
