<?php

namespace App\Console\Commands;

use App\Models\ProductImage;
use App\Services\ImageOptimizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OptimizeProductImages extends Command
{
    protected $signature = 'app:optimize-product-images {--dry-run}';

    protected $description = 'Kompres gambar produk lama di storage lokal ke WebP ter-resize, lalu arahkan product_images.url ke file baru. File lama TIDAK dihapus.';

    // WebP yang sudah kecil tidak di-encode ulang (lossy → lossy menurunkan kualitas tanpa untung).
    private const SKIP_WEBP_BELOW = 500 * 1024;

    // Penghematan minimal supaya URL layak diganti.
    private const MIN_SAVING = 0.15;

    public function handle(ImageOptimizer $optimizer): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $disk = Storage::disk('public');

        // Satu file bisa dipakai beberapa baris product_images — proses per URL unik.
        $urls = ProductImage::query()->distinct()->orderBy('url')->pluck('url');

        $this->info(($dryRun ? '[DRY RUN] ' : '') . "Memeriksa {$urls->count()} URL gambar...");

        $rows = [];
        $before = 0;
        $after = 0;
        $changed = 0;

        foreach ($urls as $url) {
            $relative = $this->relativePath($url);

            if ($relative === null) {
                $this->line("  skip (bukan storage lokal): {$url}");
                continue;
            }

            if (! $disk->exists($relative)) {
                $this->warn("  skip (file tidak ada di disk): {$relative}");
                continue;
            }

            $path = $disk->path($relative);
            $size = filesize($path);
            $dims = @getimagesize($path);

            $isSmallWebp = $dims
                && $dims[2] === IMAGETYPE_WEBP
                && $size <= self::SKIP_WEBP_BELOW
                && max($dims[0], $dims[1]) <= ImageOptimizer::MAX_DIMENSION;

            if ($isSmallWebp) {
                continue;
            }

            $webp = $optimizer->toWebp($path);

            if ($webp === null || strlen($webp) > $size * (1 - self::MIN_SAVING)) {
                $this->line("  skip (tidak bisa/tidak layak dikompres): {$relative}");
                continue;
            }

            $newRelative = 'products/' . Str::uuid() . '.webp';
            $newUrl = str_replace($relative, $newRelative, $url);

            if (! $dryRun) {
                // Disk 'public' tidak throw kalau gagal tulis. Pastikan file baru benar-benar ada
                // sebelum DB diarahkan ke sana — kalau tidak, gambar produk jadi rusak.
                if (! $disk->put($newRelative, $webp) || $disk->size($newRelative) !== strlen($webp)) {
                    $this->error("  GAGAL menulis {$newRelative} — DB tidak diubah untuk {$relative}");
                    $disk->delete($newRelative);
                    continue;
                }

                ProductImage::where('url', $url)->update(['url' => $newUrl]);
            }

            $changed++;
            $before += $size;
            $after += strlen($webp);
            $rows[] = [basename($relative), $this->kb($size), $this->kb(strlen($webp)), sprintf('-%d%%', round((1 - strlen($webp) / $size) * 100))];
        }

        if ($rows) {
            $this->table(['File', 'Sebelum', 'Sesudah', 'Hemat'], $rows);
        }

        $this->info(sprintf(
            '%s%d gambar dikompres: %s → %s%s',
            $dryRun ? '[DRY RUN] akan ' : '',
            $changed,
            $this->kb($before),
            $this->kb($after),
            $dryRun ? '' : '. File lama masih ada di disk (belum dihapus).'
        ));

        return self::SUCCESS;
    }

    // "https://host/storage/products/x.jpg" → "products/x.jpg"; null kalau bukan storage lokal.
    private function relativePath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';

        return str_starts_with($path, '/storage/products/')
            ? substr($path, strlen('/storage/'))
            : null;
    }

    private function kb(int $bytes): string
    {
        return $bytes >= 1024 * 1024
            ? number_format($bytes / 1024 / 1024, 1) . ' MB'
            : number_format($bytes / 1024) . ' KB';
    }
}
