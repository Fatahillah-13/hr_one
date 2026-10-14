<?php

return [
    /*
    | Slug aplikasi modul Master Karyawan di tabel `apps` HR One.
    | Hak akses modul mengikuti divisi yang dipasangkan ke aplikasi ini
    | (Settings > Apps), sama seperti aplikasi lain di launcher.
    */
    'employees_app_slug' => 'hrd-master-karyawan',

    // Sistem HRD lama: untuk fitur yang belum dipindah (tambah/edit, upload, dsb).
    'legacy_url' => rtrim(env('HRD_LEGACY_URL', 'http://10.10.100.193:8080'), '/'),

    // Service Go "Export Employees" (port 1000) yang dipakai tombol download Excel lama.
    'export_url' => rtrim(env('HRD_EXPORT_URL', 'http://10.10.100.193:1000'), '/'),
];
