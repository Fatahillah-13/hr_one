<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class PasswordSyncService
{
    /**
     * Daftar target database aplikasi lokal dan mapping pencocokan kolomnya.
     */
    protected static array $targets = [
        [
            'name' => 'HR System',
            'database' => 'hrd',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'name' => 'username', // HRD mencatat username/NIK di kolom 'name'
                'email' => 'email',
            ],
        ],
        [
            'name' => 'HR System (Uji)',
            'database' => 'hrd_uji',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'name' => 'username',
                'email' => 'email',
            ],
        ],
        [
            'name' => 'Room Scheduler',
            'database' => 'bookingroom',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'username' => 'username',
            ],
        ],
        [
            'name' => 'Room Scheduler (Uji)',
            'database' => 'bookingroom_uji',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'username' => 'username',
            ],
        ],
        [
            'name' => 'PICS System',
            'database' => 'pics_system',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'email' => 'email',
                'name' => 'name',
            ],
        ],
        [
            'name' => 'PICS System (Uji)',
            'database' => 'pics_system_uji',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'email' => 'email',
                'name' => 'name',
            ],
        ],
        [
            'name' => 'Inventaris ATK',
            'database' => 'inventaris_atk',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'email' => 'email',
                'name' => 'name',
            ],
        ],
        [
            'name' => 'Inventaris ATK (Uji)',
            'database' => 'inventaris_atk_uji',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'email' => 'email',
                'name' => 'name',
            ],
        ],
        [
            'name' => 'HRD Public',
            'database' => 'hrdpublic',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'name' => 'username',
                'email' => 'email',
            ],
        ],
        [
            'name' => 'Attendance DB',
            'database' => 'attendance_db',
            'table' => 'users',
            'password_col' => 'password',
            'match' => [
                'name' => 'username',
                'email' => 'email',
            ],
        ],
    ];

    /**
     * Sinkronkan hash password user HR One ke seluruh database aplikasi satelit.
     */
    public static function sync(User $user, ?string $passwordHash = null): array
    {
        $hash = $passwordHash ?: $user->password;
        if (empty($hash)) {
            return [];
        }

        $results = [];

        foreach (self::$targets as $target) {
            $targetName = $target['name'];
            $dbName = $target['database'];
            $tableName = $target['table'];
            $pwCol = $target['password_col'];

            try {
                // Buat query dinamis berdasarkan kriteria pencocokan
                $query = DB::table("{$dbName}.{$tableName}");

                $conditions = [];
                foreach ($target['match'] as $targetCol => $userAttr) {
                    $val = trim((string) ($user->{$userAttr} ?? ''));
                    if ($val !== '') {
                        $conditions[$targetCol] = $val;
                    }
                }

                if (empty($conditions)) {
                    continue;
                }

                $query->where(function ($q) use ($conditions) {
                    $first = true;
                    foreach ($conditions as $col => $val) {
                        if ($first) {
                            $q->where($col, $val);
                            $first = false;
                        } else {
                            $q->orWhere($col, $val);
                        }
                    }
                });

                $matchedCount = $query->count();
                if ($matchedCount > 0) {
                    $updated = $query->update([
                        $pwCol => $hash,
                        'updated_at' => now(),
                    ]);

                    $results[$targetName] = [
                        'status' => 'updated',
                        'matched' => $matchedCount,
                        'affected' => $updated,
                    ];
                } else {
                    $results[$targetName] = [
                        'status' => 'not_found',
                        'matched' => 0,
                    ];
                }
            } catch (Throwable $e) {
                Log::warning("Password sync failed for target {$targetName} ({$dbName}): " . $e->getMessage());
                $results[$targetName] = [
                    'status' => 'error',
                    'message' => $e->getMessage(),
                ];
            }
        }

        Log::info("PasswordSyncService executed for user ID {$user->id} ({$user->username}):", $results);

        return $results;
    }
}
