<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cloudinary' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
        'api_key'    => env('CLOUDINARY_API_KEY'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
        'folder'     => env('CLOUDINARY_FOLDER', 'sdp/products'),
    ],

    'rajaongkir' => [
        'api_key' => env('RAJAONGKIR_API_KEY', ''),
    ],

    /*
     * GeoLite2 dipakai untuk mendeteksi negara pengunjung (localized storefront).
     * Databasenya file lokal, bukan API — tidak ada IP pengunjung yang dikirim keluar
     * dan tidak ada rate limit. File-nya TIDAK ikut di-commit (lihat .gitignore),
     * jadi harus diunduh terpisah di tiap server. Kalau file tidak ada, deteksi
     * dilewati dengan aman dan storefront jatuh ke region default.
     */
    'maxmind' => [
        'database_path' => env('MAXMIND_DB_PATH', storage_path('app/geoip/GeoLite2-Country.mmdb')),
        // Peringatkan di `geoip:status` kalau database sudah lebih tua dari ini.
        'stale_after_days' => (int) env('MAXMIND_STALE_AFTER_DAYS', 60),
    ],

    // Endpoint read-only buat asisten personal (OpenClaw). Kosong = endpoint mati.
    'assistant' => [
        'token' => env('ASSISTANT_API_TOKEN', ''),
        'low_stock_threshold' => (int) env('ASSISTANT_LOW_STOCK_THRESHOLD', 5),
    ],

];
