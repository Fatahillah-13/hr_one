<?php

namespace App\Models\VirtualOffice;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayoutVersion extends Model
{
    protected $table = 'vo_layout_versions';

    protected $guarded = ['id'];

    protected $casts = ['layout' => 'array'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
