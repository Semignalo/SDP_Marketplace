<?php

namespace App\Services;

class ImageOptimizer
{
    // Sisi terpanjang. 1600px cukup untuk galeri produk di layar retina.
    public const MAX_DIMENSION = 1600;

    public const QUALITY = 82;

    // Batas keras jumlah piksel yang mau di-decode.
    private const MAX_PIXELS = 60_000_000;

    // Batas atas memory_limit yang boleh dinaikkan sementara untuk satu proses.
    private const MAX_MEMORY = 384 * 1024 * 1024;

    /**
     * Konversi gambar (JPG/PNG/WebP) ke WebP yang sudah di-resize.
     *
     * Mengembalikan binary WebP, atau null kalau gambar tidak bisa diproses atau
     * hasilnya tidak lebih kecil dari aslinya — pemanggil harus pakai file asli.
     */
    public function toWebp(string $path): ?string
    {
        if (! function_exists('imagewebp') || ! is_file($path)) {
            return null;
        }

        $info = @getimagesize($path);
        if (! $info || $info[0] * $info[1] > self::MAX_PIXELS || ! $this->ensureMemory($info[0], $info[1])) {
            return null;
        }

        $src = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG  => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            default        => false,
        };
        if (! $src) {
            return null;
        }

        // Resize dulu, baru putar EXIF — memutar salinan kecil, bukan gambar penuh.
        $img = $this->resize($src);
        unset($src);

        if ($info[2] === IMAGETYPE_JPEG) {
            $img = $this->applyExifOrientation($img, $path);
        }

        ob_start();
        $ok = imagewebp($img, null, self::QUALITY);
        $data = ob_get_clean();

        return ($ok && $data !== false && $data !== '' && strlen($data) < filesize($path))
            ? $data
            : null;
    }

    private function resize(\GdImage $src): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $scale = min(1, self::MAX_DIMENSION / max($w, $h));
        $newW = max(1, (int) round($w * $scale));
        $newH = max(1, (int) round($h * $scale));

        // Selalu lewat canvas truecolor baru: PNG palette tidak bisa disimpan ke WebP,
        // dan canvas ini menjaga transparansi kalau ada.
        $dst = imagecreatetruecolor($newW, $newH);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagefill($dst, 0, 0, imagecolorallocatealpha($dst, 0, 0, 0, 127));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);

        return $dst;
    }

    // Foto HP disimpan menyamping + tag EXIF orientation; GD tidak memutar otomatis.
    private function applyExifOrientation(\GdImage $img, string $path): \GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $img;
        }

        $orientation = @exif_read_data($path)['Orientation'] ?? 1;
        $angle = match ($orientation) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($angle === 0) {
            return $img;
        }

        return imagerotate($img, $angle, 0) ?: $img;
    }

    // GD menyimpan 4 byte/piksel. PHP-FPM default 128M — decode foto besar bisa fatal error
    // (bukan exception, jadi tidak bisa di-catch). Naikkan limit sementara kalau perlu; kalau
    // tetap tidak cukup, pemanggil fallback ke file asli.
    private function ensureMemory(int $width, int $height): bool
    {
        $limit = $this->memoryLimitBytes();
        if ($limit < 0) {
            return true;
        }

        $needed = (int) ($width * $height * 4.5) + 16 * 1024 * 1024 + memory_get_usage(true);
        if ($needed <= $limit) {
            return true;
        }

        return $needed <= self::MAX_MEMORY && ini_set('memory_limit', (string) $needed) !== false;
    }

    private function memoryLimitBytes(): int
    {
        $value = trim((string) ini_get('memory_limit'));
        if ($value === '' || $value === '-1') {
            return -1;
        }

        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }
}
