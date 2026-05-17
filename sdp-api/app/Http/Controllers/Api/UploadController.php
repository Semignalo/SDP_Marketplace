<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    public function __construct(private ImageUploadService $uploader) {}

    public function image(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $url = $this->uploader->upload($request->file('image'));

        return response()->json([
            'url'     => $url,
            'driver'  => $this->uploader->isCloudinaryConfigured() ? 'cloudinary' : 'local',
        ]);
    }
}
