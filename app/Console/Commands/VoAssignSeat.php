<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\VirtualOffice\Seat;
use Illuminate\Console\Command;

/**
 * Tetapkan karyawan ke meja.
 *   php artisan vo:assign A-2 andy@perusahaan.com
 *   php artisan vo:assign A-2 15          (pakai id user)
 *   php artisan vo:assign A-2 --clear     (kosongkan meja)
 *   php artisan vo:assign --list          (lihat semua meja)
 */
class VoAssignSeat extends Command
{
    protected $signature = 'vo:assign {seat?} {user?} {--clear} {--list}';

    protected $description = 'Virtual Office: tetapkan atau kosongkan meja karyawan';

    public function handle(): int
    {
        if ($this->option('list')) {
            $this->table(['Meja', 'Zona', 'Karyawan'], Seat::with('user')->orderBy('code')->get()
                ->map(fn ($s) => [$s->code, $s->zone, $s->is_printer ? '(printer)' : ($s->user?->name ?? '-')]));

            return self::SUCCESS;
        }

        $seat = Seat::where('code', strtoupper(trim((string) $this->argument('seat'))))->first();
        if (! $seat) {
            $this->error('Meja tidak ditemukan. Lihat daftar: php artisan vo:assign --list');

            return self::FAILURE;
        }
        if ($seat->is_printer) {
            $this->error('Meja ini berisi printer.');

            return self::FAILURE;
        }

        if ($this->option('clear')) {
            $seat->update(['user_id' => null]);
            $this->info("Meja {$seat->code} dikosongkan.");

            return self::SUCCESS;
        }

        $key = (string) $this->argument('user');
        // id, email, atau username HR One (username bisa berupa NIK angka, jadi dicek dulu)
        $user = User::where('email', $key)
            ->when(\Illuminate\Support\Facades\Schema::hasColumn('users', 'username'), fn ($q) => $q->orWhere('username', $key))
            ->first() ?? (ctype_digit($key) ? User::find($key) : null);
        if (! $user) {
            $this->error('User tidak ditemukan (pakai username, email, atau id).');

            return self::FAILURE;
        }

        // satu karyawan hanya boleh punya satu meja
        Seat::where('user_id', $user->id)->update(['user_id' => null]);
        $seat->update(['user_id' => $user->id]);
        $this->info("{$user->name} sekarang duduk di meja {$seat->code}.");

        return self::SUCCESS;
    }
}
