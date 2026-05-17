<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadService
{
    public function isCloudinaryConfigured(): bool
    {
        return filled(config('services.cloudinary.cloud_name'))
            && filled(config('services.cloudinary.api_key'))
            && filled(config('services.cloudinary.api_secret'));
    }

    public function upload(UploadedFile $file): string
    {
        return $this->isCloudinaryConfigured()
            ? $this->uploadToCloudinary($file)
            : $this->uploadToLocal($file);
    }

    private function uploadToCloudinary(UploadedFile $file): string
    {
        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey    = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');
        $folder    = config('services.cloudinary.folder', 'sdp/products');

        $timestamp = time();
        $params    = "folder={$folder}&timestamp={$timestamp}";
        $signature = hash('sha256', $params . $apiSecret);

        $http = app()->environment('local')
            ? Http::withoutVerifying()
            : Http::new();

        $response = $http->attach('file', $file->get(), $file->getClientOriginalName())
            ->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                'api_key'   => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder'    => $folder,
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Cloudinary upload failed: ' . $response->body());
        }

        return $response->json('secure_url');
    }

    private function uploadToLocal(UploadedFile $file): string
    {
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('products', $filename, 'public');

        return url(Storage::url($path));
    }
}
