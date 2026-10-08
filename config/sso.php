<?php

return [
    // nama data yang dikirim Keycloak (claim)
    'claim'  => env('SSO_CLAIM', 'email'),
    // nama kolom di tabel users aplikasi ini
    'column' => env('SSO_COLUMN', 'email'),
];
