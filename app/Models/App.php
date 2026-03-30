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

    public function divisions()
    {
        return $this->belongsToMany(Division::class)->withTimestamps();
    }
}
