<?php

namespace Tests\Feature;

use App\Services\ImageUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ImageUploadServiceTest extends TestCase
{
    public function test_cloudinary_upload_works_outside_local_environment(): void
    {
        config()->set('services.cloudinary.cloud_name', 'demo');
        config()->set('services.cloudinary.api_key', 'key');
        config()->set('services.cloudinary.api_secret', 'secret');

        Http::fake([
            'api.cloudinary.com/*' => Http::response(['secure_url' => 'https://res.cloudinary.com/demo/image/upload/x.jpg'], 200),
        ]);

        // Environment test = bukan 'local' → jalur yang dipakai di production.
        $this->assertFalse(app()->environment('local'));

        $url = app(ImageUploadService::class)->upload(UploadedFile::fake()->createWithContent('photo.jpg', 'fake-image-bytes'));

        $this->assertSame('https://res.cloudinary.com/demo/image/upload/x.jpg', $url);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/v1_1/demo/image/upload'));
    }
}
