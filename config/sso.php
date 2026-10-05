<?php

// return [
//     'issuer' => env('SSO_ISSUER', env('APP_URL', 'http://localhost')),
//     'code_ttl' => (int) env('SSO_CODE_TTL', 60),
//     'jwt_ttl' => (int) env('SSO_JWT_TTL', 300),
//     'private_key' => env('SSO_PRIVATE_KEY'),
//     'private_key_path' => env('SSO_PRIVATE_KEY_PATH'),
//     'public_key' => env('SSO_PUBLIC_KEY'),
//     'public_key_path' => env('SSO_PUBLIC_KEY_PATH'),
// ];

return [
    // nama data yang dikirim Keycloak (claim)
    'claim'  => env('SSO_CLAIM', 'email'),
    // nama kolom di tabel users aplikasi ini
    'column' => env('SSO_COLUMN', 'email'),
];
