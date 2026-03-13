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
        'category_id',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
