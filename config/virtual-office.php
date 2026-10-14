<?php

return [
    /*
    | Slug aplikasi Virtual Office di tabel `apps` HR One.
    | Kartu di Beranda dan hak akses halaman mengikuti divisi yang dicentang di Settings → Home.
    */
    'app_slug' => 'virtual-office',

    /*
    | Admin Editor Denah. User ber-role Admin di HR One otomatis boleh.
    | Tambahan (opsional): email, username, atau id user dipisah koma:
    |     VO_ADMINS=udin,benny@perusahaan.com
    */
    'admins' => array_values(array_filter(array_map('trim', explode(',', (string) env('VO_ADMINS', ''))))),

    /*
    | Data karyawan dari database HRD (koneksi `hrd`, tabel `employees`).
    | User HR One dicocokkan ke karyawan lewat:  users.{user_column} = employees.{employee_column}
    | Default: username HR One = NIK karyawan (number_of_employees).
    */
    'employee' => [
        'enabled' => env('VO_EMPLOYEE_LINK', true),
        'user_column' => env('VO_EMPLOYEE_USER_COLUMN', 'username'),
        'employee_column' => env('VO_EMPLOYEE_COLUMN', 'number_of_employees'),
        // Foto karyawan (dipakai kalau karyawan belum membuat avatar sendiri). Placeholder: {nik} {id} {finger_id}
        'photo_url' => env('VO_EMPLOYEE_PHOTO_URL', 'http://10.10.40.238:9090/photo?number_of_employee={nik}'),
        'cache_minutes' => 10,
    ],

    /*
    | Status otomatis dari absensi. Matikan sampai nama tabel & kolom di bawah sudah sesuai.
    | Jalankan `php artisan vo:sync-attendance --dry-run` untuk mengecek hasilnya tanpa menyimpan.
    */
    'attendance' => [
        'enabled' => env('VO_ATTENDANCE_ENABLED', false),

        // Sumber data: 'api' (web API JPayroll) atau 'database' (tabel log mesin absensi).
        'source' => env('VO_ATT_SOURCE', 'api'),

        /*
        | Sumber 'api': satu GET per sinkronisasi, berisi absensi SEMUA karyawan untuk satu tanggal.
        | Contoh: GET http://10.10.40.238:9090/api/attendance?date=2026-10-04
        | Respons JSON berupa daftar baris (langsung, atau di dalam key `list`, mis. "data").
        | Dua bentuk baris didukung:
        |   a) ringkasan per karyawan: {"nik": "...", "time_in": "07:31", "time_out": "16:05", "leave": "Cuti"}
        |   b) log scan mentah: satu baris per scan {"nik": "...", "scan_time": "2026-10-04 07:31:00"}
        |      → kosongkan `out` dan isi `in` dengan kolom waktu scan.
        | Karyawan dicocokkan lewat `key` = users.{employee.user_column} (username = NIK).
        */
        'api' => [
            'url' => env('VO_ATT_API_URL'),
            'date_param' => env('VO_ATT_API_DATE_PARAM', 'date'),   // nama parameter tanggal (Y-m-d); kosongkan kalau tidak ada
            'token' => env('VO_ATT_API_TOKEN'),                      // dikirim sebagai Authorization: Bearer ...
            'headers' => array_filter(['X-API-KEY' => env('VO_ATT_API_KEY_HEADER')]),
            'list' => env('VO_ATT_API_LIST', 'data'),                // letak daftar di JSON (dot path); kosong = JSON langsung berupa daftar
            'key' => env('VO_ATT_API_FIELD_NIK', 'number_of_employees'),
            'in' => env('VO_ATT_API_FIELD_IN', 'time_in'),
            'out' => env('VO_ATT_API_FIELD_OUT', 'time_out'),
            'leave' => env('VO_ATT_API_FIELD_LEAVE', 'leave_type'),  // kosong/null = tidak cuti
            'timeout' => 10,
        ],

        // ---- sumber 'database' ----
        'connection' => env('VO_ATT_CONNECTION', 'hrd'),

        // Log scan mesin absensi
        'log_table' => env('VO_ATT_LOG_TABLE', 'attendance_logs'),
        'log_key' => env('VO_ATT_LOG_KEY', 'finger_id'),          // kolom di tabel log yang menunjuk karyawan
        'employee_key' => env('VO_ATT_EMPLOYEE_KEY', 'finger_id'), // kolom pasangannya di hrd.employees
        'log_time' => env('VO_ATT_LOG_TIME', 'scan_time'),         // kolom datetime waktu scan

        // Scan terakhir setelah jam ini (dan minimal 2 scan) = sudah pulang
        'home_after' => env('VO_ATT_HOME_AFTER', '16:00'),

        // Cuti / izin (opsional). Kosongkan VO_ATT_LEAVE_TABLE kalau belum ada.
        'leave_table' => env('VO_ATT_LEAVE_TABLE'),
        'leave_employee' => env('VO_ATT_LEAVE_EMPLOYEE', 'employee_id'), // berisi hrd.employees.id
        'leave_start' => env('VO_ATT_LEAVE_START', 'start_date'),
        'leave_end' => env('VO_ATT_LEAVE_END', 'end_date'),
        'leave_type' => env('VO_ATT_LEAVE_TYPE', 'type'),
        // Teks yang tampil di lantai per jenis cuti/izin. Jenis lain memakai '*'.
        // Sengaja tidak menampilkan "sakit" supaya info kesehatan tidak terbuka ke semua orang.
        'leave_labels' => [
            'cuti' => 'Cuti',
            '*' => 'Tidak masuk hari ini',
        ],
    ],
];
