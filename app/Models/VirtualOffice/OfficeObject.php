<?php

namespace App\Models\VirtualOffice;

use Illuminate\Database\Eloquent\Model;

/** Ruangan, dinding, partisi, dan perabot di lantai kantor. */
class OfficeObject extends Model
{
    protected $table = 'vo_objects';

    protected $guarded = ['id'];

    /** Harus sama dengan OBJECT_TYPES di resources/js/VirtualOffice/catalog.js */
    public const TYPES = [
        'room', 'wall', 'glass', 'meeting_table', 'sofa', 'coffee_table', 'cabinet',
        'id_machine', 'locker', 'plant', 'dispenser', 'whiteboard', 'text', 'zone_label',
    ];

    public const PUBLIC_COLUMNS = ['id', 'type', 'x', 'y', 'w', 'd', 'rotation', 'label', 'sort'];
}
