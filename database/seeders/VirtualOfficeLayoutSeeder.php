<?php

namespace Database\Seeders;

use App\Models\VirtualOffice\OfficeObject;
use App\Models\VirtualOffice\Seat;
use Illuminate\Database\Seeder;

/**
 * Denah awal Lantai HRD (Zona A–E) + ruangan & perabot.
 * Satuan koordinat = unit denah (lantai 1100 x 700).
 *
 * Setelah ini denah diubah lewat Editor Denah (/virtual-office/editor).
 * Aman dijalankan ulang: meja hanya diisi kalau tabel vo_seats masih kosong dan perabot
 * hanya kalau vo_objects kosong, jadi denah hasil Editor Denah tidak pernah ditimpa.
 */
class VirtualOfficeLayoutSeeder extends Seeder
{
    private const DW = 36;  // panjang meja (arah karyawan menghadap)

    private const DH = 40;  // lebar meja

    public function run(): void
    {
        $this->seedDesks();
        $this->seedObjects();
    }

    private function seedDesks(): void
    {
        if (Seat::exists()) {
            return;
        }

        // head: meja kepala (top/bottom/null), rows: jumlah baris pasangan meja,
        // printer: indeks baris yang meja kirinya berisi printer.
        $clusters = [
            ['zone' => 'A', 'ox' => 90,  'oy' => 430, 'head' => 'top',    'rows' => 3, 'printer' => null],
            ['zone' => 'B', 'ox' => 290, 'oy' => 430, 'head' => 'top',    'rows' => 3, 'printer' => null],
            ['zone' => 'C', 'ox' => 650, 'oy' => 220, 'head' => null,     'rows' => 2, 'printer' => null],
            ['zone' => 'D', 'ox' => 900, 'oy' => 30,  'head' => 'bottom', 'rows' => 4, 'printer' => 0],
            ['zone' => 'E', 'ox' => 900, 'oy' => 330, 'head' => 'top',    'rows' => 5, 'printer' => null],
        ];

        foreach ($clusters as $c) {
            $n = 1;
            $rowStart = $c['oy'];
            $save = function (array $data) use ($c, &$n) {
                $data['zone'] = $c['zone'];
                Seat::updateOrCreate(['code' => $c['zone'] . '-' . $n++], $data + Seat::derive($data));
            };

            if ($c['head'] === 'top') {
                $save(['x' => $c['ox'] + 8, 'y' => $c['oy'], 'w' => 56, 'd' => 30, 'facing' => 'T', 'has_panel' => true, 'is_printer' => false]);
                $rowStart = $c['oy'] + 30;
            }

            for ($i = 0; $i < $c['rows']; $i++) {
                $y = $rowStart + $i * self::DH;
                $save(['x' => $c['ox'], 'y' => $y, 'w' => self::DW, 'd' => self::DH, 'facing' => 'L', 'has_panel' => true, 'is_printer' => $c['printer'] === $i]);
                $save(['x' => $c['ox'] + self::DW, 'y' => $y, 'w' => self::DW, 'd' => self::DH, 'facing' => 'R', 'has_panel' => false, 'is_printer' => false]);
            }

            if ($c['head'] === 'bottom') {
                $y = $rowStart + $c['rows'] * self::DH;
                $save(['x' => $c['ox'] + 8, 'y' => $y, 'w' => 56, 'd' => 30, 'facing' => 'B', 'has_panel' => true, 'is_printer' => false]);
            }
        }
    }

    private function seedObjects(): void
    {
        if (OfficeObject::exists()) {
            return;
        }

        $objects = [
            // ruangan & dinding
            ['room', 20, 20, 450, 660, 0, null],
            ['room', 540, 20, 540, 660, 0, null],
            ['wall', 20, 12, 1060, 8, 0, null],
            ['wall', 1078, 20, 8, 660, 0, null],
            ['glass', 466, 20, 4, 280, 0, null],
            ['glass', 466, 370, 4, 310, 0, null],
            ['glass', 540, 20, 4, 280, 0, null],
            ['glass', 540, 370, 4, 310, 0, null],
            ['text', 480, 320, 50, 30, 0, 'LORONG'],
            // perabot
            ['meeting_table', 90, 120, 170, 90, 0, 'Meja Rapat'],
            ['sofa', 300, 110, 130, 36, 0, null],
            ['sofa', 300, 146, 36, 72, 270, null],
            ['coffee_table', 356, 166, 56, 36, 0, null],
            ['sofa', 350, 226, 80, 34, 180, null],
            ['cabinet', 590, 50, 110, 64, 0, 'Lemari'],
            ['id_machine', 600, 545, 54, 72, 0, 'ID 2'],
            ['id_machine', 700, 545, 54, 72, 0, 'ID 1'],
            ['locker', 590, 640, 252, 28, 0, null],
            ['plant', 428, 26, 30, 30, 0, null],
            ['plant', 28, 26, 30, 30, 0, null],
            ['plant', 1038, 292, 30, 30, 0, null],
            ['plant', 552, 292, 30, 30, 0, null],
        ];

        // tulisan zona di bawah kelompok meja tiap zona (bisa diubah di Editor Denah)
        Seat::query()->selectRaw('zone, MIN(x) AS minx, MAX(x + w) AS maxx, MAX(y + d) AS maxy')
            ->groupBy('zone')->orderBy('zone')->get()
            ->each(function ($z) use (&$objects) {
                $cx = (int) round(($z->minx + $z->maxx) / 2);
                $objects[] = ['zone_label', $cx - 60, (int) round($z->maxy + 20), 120, 40, 0, 'ZONA '.$z->zone];
            });

        foreach ($objects as $i => [$type, $x, $y, $w, $d, $rot, $label]) {
            OfficeObject::create(compact('type', 'x', 'y', 'w', 'd', 'label') + ['rotation' => $rot, 'sort' => $i]);
        }
    }
}
