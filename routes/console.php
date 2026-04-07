<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('sso:generate-keys {--force : Overwrite existing SSO key files}', function () {
    $targetDirectory = storage_path('app/sso');
    $privateKeyPath = $targetDirectory.DIRECTORY_SEPARATOR.'private.pem';
    $publicKeyPath = $targetDirectory.DIRECTORY_SEPARATOR.'public.pem';

    if (! $this->option('force') && (File::exists($privateKeyPath) || File::exists($publicKeyPath))) {
        $this->error('SSO key files already exist. Use --force to overwrite them.');

        return \Symfony\Component\Console\Command\Command::FAILURE;
    }

    File::ensureDirectoryExists($targetDirectory);

    $config = [
        'private_key_bits' => 2048,
        'private_key_type' => OPENSSL_KEYTYPE_RSA,
    ];

    $candidateConfigs = array_filter([
        env('SSO_OPENSSL_CONFIG_PATH'),
        'C:/xampp/php/extras/openssl/openssl.cnf',
        'C:/xampp/apache/conf/openssl.cnf',
    ]);

    $resource = openssl_pkey_new($config);

    if ($resource === false) {
        foreach ($candidateConfigs as $candidateConfig) {
            if (! File::exists($candidateConfig)) {
                continue;
            }

            $resource = openssl_pkey_new($config + ['config' => $candidateConfig]);

            if ($resource !== false) {
                $config['config'] = $candidateConfig;
                break;
            }
        }
    }

    if ($resource === false) {
        $this->error('Unable to generate SSO keys with OpenSSL in this environment.');

        while ($error = openssl_error_string()) {
            $this->line($error);
        }

        return \Symfony\Component\Console\Command\Command::FAILURE;
    }

    if (! openssl_pkey_export($resource, $privateKey, null, $config)) {
        $this->error('Unable to export the generated SSO private key.');

        return \Symfony\Component\Console\Command\Command::FAILURE;
    }

    $details = openssl_pkey_get_details($resource);

    if (! is_array($details) || empty($details['key'])) {
        $this->error('Unable to export the generated SSO public key.');

        return \Symfony\Component\Console\Command\Command::FAILURE;
    }

    File::put($privateKeyPath, $privateKey);
    File::put($publicKeyPath, $details['key']);

    $this->info('SSO key files generated successfully.');
    $this->line("Private key: {$privateKeyPath}");
    $this->line("Public key: {$publicKeyPath}");

    return \Symfony\Component\Console\Command\Command::SUCCESS;
})->purpose('Generate RSA keys for HR One SSO signing');
