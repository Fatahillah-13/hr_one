<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class JPayrollAttendanceController extends Controller
{
    /**
     * REST API adapter untuk membaca dan merangkum absensi harian dari server JPayroll.
     * GET /api/jpayroll/attendance?date=YYYY-MM-DD
     */
    public function index(Request $request): JsonResponse
    {
        $date = $request->query('date', now()->toDateString());
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['status' => 'error', 'message' => 'Format tanggal harus YYYY-MM-DD'], 400);
        }

        // Cache hasil olahan selama 3 menit agar sinkronisasi berulang instan
        $cacheKey = "jpayroll_attendance_summary_{$date}";
        $data = Cache::remember($cacheKey, 180, function () use ($date) {
            return $this->fetchAndSummarize($date);
        });

        return response()->json([
            'status' => 'success',
            'date' => $date,
            'total' => count($data),
            'data' => $data,
        ]);
    }

    protected function fetchAndSummarize(string $date): array
    {
        $rawDump = $this->fetchRawStream($date);
        if (empty($rawDump)) {
            return [];
        }

        // 1. Ambil daftar NIK semua pengguna di sistem HR One
        $activeNiks = \App\Models\User::query()
            ->whereNotNull('username')
            ->where('username', '!=', '')
            ->pluck('username')
            ->filter(fn ($u) => preg_match('/^\d+$/', (string) $u))
            ->values()
            ->all();

        if (empty($activeNiks)) {
            return [];
        }

        // 2. Ambil mapping finger_id khusus pengguna HR One dari DB hrd (instan & ringan)
        $fingerToNik = DB::connection('hrd')->table('employees')
            ->whereIn('number_of_employees', $activeNiks)
            ->whereNotNull('finger_id')
            ->where('finger_id', '!=', '')
            ->pluck('number_of_employees', 'finger_id')
            ->toArray();

        if (empty($fingerToNik)) {
            return [];
        }

        // 3. Parsing scan logs: INSERT INTO MSSQL_RAW VALUES ('<finger_id>',TO_DATE('<datetime>','DD/MM/YYYY HH24:MI:SS')
        $pattern = "/INSERT INTO MSSQL_RAW VALUES \('(\d+)',TO_DATE\('([^']+)',/i";
        if (! preg_match_all($pattern, $rawDump, $matches, PREG_SET_ORDER)) {
            return [];
        }

        // 3. Kelompokkan scan per karyawan
        $scansPerNik = [];
        foreach ($matches as $row) {
            $finger = (string) $row[1];
            $nik = $fingerToNik[$finger] ?? null;
            if (! $nik) {
                continue;
            }

            $rawTime = trim((string) $row[2]);
            $dt = Carbon::createFromFormat('d/m/Y H:i:s', $rawTime);
            if (! $dt) {
                continue;
            }

            $scansPerNik[$nik][] = $dt;
        }

        // 4. Buat ringkasan per karyawan (time_in, time_out, scans)
        $summary = [];
        foreach ($scansPerNik as $nik => $dts) {
            sort($dts);
            $first = $dts[0];
            $last = end($dts);

            $summary[] = [
                'number_of_employees' => (string) $nik,
                'time_in' => $first->format('Y-m-d H:i:s'),
                'time_out' => count($dts) > 1 ? $last->format('Y-m-d H:i:s') : null,
                'scans' => count($dts),
                'leave_type' => null,
            ];
        }

        return $summary;
    }

    protected function fetchRawStream(string $date): string
    {
        $url = 'http://10.10.100.97/JPayroll/Jobs/Download_Raw_Data.php?id=DownloadLog&StartDate='.$date;

        $buffer = '';
        $lastChunk = microtime(true);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) use (&$buffer, &$lastChunk) {
            $buffer .= $chunk;
            $lastChunk = microtime(true);
            return strlen($chunk);
        });
        curl_setopt($ch, CURLOPT_NOPROGRESS, false);
        curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, function ($ch) use (&$lastChunk, &$buffer) {
            // Selesai jika sudah dapat > 1MB dan stream diam > 1.5 detik
            if (strlen($buffer) > 1000000 && (microtime(true) - $lastChunk) > 1.5) {
                return 1;
            }
            return 0;
        });
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        curl_exec($ch);
        curl_close($ch);

        return $buffer;
    }
}
