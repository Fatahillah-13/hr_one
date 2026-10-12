<?php

return [
    /*
    | IT Call: laporan masalah IT dari user HR One ke agent IT lewat WhatsApp.
    | Pesan dibuka di WhatsApp dan dikirim sendiri oleh pelapor (tanpa gateway, tanpa riwayat).
    */

    // Slug aplikasi IT Call di tabel apps (kartu di Beranda).
    'app_slug' => 'it-call',

    // Jam reset status semua agent ke "Ready" setiap hari (zona waktu APP_TIMEZONE).
    'reset_at' => env('IT_CALL_RESET_AT', '07:00'),
];
