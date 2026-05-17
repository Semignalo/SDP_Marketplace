<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ResellerController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');

Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('/categories/{slug}', [CategoryController::class, 'show'])->name('categories.show');

Route::get('/vendors', [VendorController::class, 'index'])->name('vendors.index');
Route::get('/vendors/{slug}', [VendorController::class, 'show'])->name('vendors.show');

Route::get('/settings/public', [SettingController::class, 'publicIndex'])->name('settings.public');
Route::get('/checkout/options', [CheckoutController::class, 'options']);

// Midtrans webhook — public (no auth, signature verified inside controller)
Route::post('/payments/notification', [PaymentController::class, 'notification']);

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::get('/wishlist/ids', [WishlistController::class, 'ids']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [CheckoutController::class, 'store']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
    Route::post('/orders/{orderNumber}/snap-token', [PaymentController::class, 'snapToken']);
    Route::post('/orders/{orderNumber}/confirm-payment', [PaymentController::class, 'confirmPayment']);

    Route::get('/reseller/summary', [ResellerController::class, 'summary']);
    Route::get('/reseller/commissions', [ResellerController::class, 'commissions']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/upload/image', [UploadController::class, 'image']);
});

Route::middleware(['auth:sanctum', 'vendor_admin'])->prefix('vendor')->group(function () {
    Route::get('/summary', [\App\Http\Controllers\Api\Vendor\DashboardController::class, 'summary']);
    Route::get('/revenue-chart', [\App\Http\Controllers\Api\Vendor\DashboardController::class, 'revenueChart']);

    Route::get('/products', [\App\Http\Controllers\Api\Vendor\ProductController::class, 'index']);
    Route::post('/products', [\App\Http\Controllers\Api\Vendor\ProductController::class, 'store']);
    Route::get('/products/{product}', [\App\Http\Controllers\Api\Vendor\ProductController::class, 'show']);
    Route::put('/products/{product}', [\App\Http\Controllers\Api\Vendor\ProductController::class, 'update']);
    Route::delete('/products/{product}', [\App\Http\Controllers\Api\Vendor\ProductController::class, 'destroy']);

    Route::get('/orders', [\App\Http\Controllers\Api\Vendor\OrderController::class, 'index']);
    Route::get('/orders/{orderNumber}', [\App\Http\Controllers\Api\Vendor\OrderController::class, 'show']);
    Route::put('/orders/{orderNumber}/tracking', [\App\Http\Controllers\Api\Vendor\OrderController::class, 'updateTracking']);

    Route::get('/profile', [\App\Http\Controllers\Api\Vendor\ProfileController::class, 'show']);
    Route::put('/profile', [\App\Http\Controllers\Api\Vendor\ProfileController::class, 'update']);
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/summary', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'summary']);
    Route::get('/revenue-chart', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'revenueChart']);

    Route::get('/users', [\App\Http\Controllers\Api\Admin\UserController::class, 'index']);
    Route::put('/users/{user}', [\App\Http\Controllers\Api\Admin\UserController::class, 'update']);
    Route::delete('/users/{user}', [\App\Http\Controllers\Api\Admin\UserController::class, 'destroy']);

    Route::get('/vendors', [\App\Http\Controllers\Api\Admin\VendorController::class, 'index']);
    Route::post('/vendors', [\App\Http\Controllers\Api\Admin\VendorController::class, 'store']);
    Route::put('/vendors/{vendor}', [\App\Http\Controllers\Api\Admin\VendorController::class, 'update']);
    Route::delete('/vendors/{vendor}', [\App\Http\Controllers\Api\Admin\VendorController::class, 'destroy']);

    Route::get('/categories', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'index']);
    Route::post('/categories', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'store']);
    Route::put('/categories/{category}', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [\App\Http\Controllers\Api\Admin\CategoryController::class, 'destroy']);

    Route::get('/products', [\App\Http\Controllers\Api\Admin\ProductController::class, 'index']);
    Route::post('/products', [\App\Http\Controllers\Api\Admin\ProductController::class, 'store']);
    Route::put('/products/{product}', [\App\Http\Controllers\Api\Admin\ProductController::class, 'update']);
    Route::put('/products/{product}/status', [\App\Http\Controllers\Api\Admin\ProductController::class, 'updateStatus']);
    Route::delete('/products/{product}', [\App\Http\Controllers\Api\Admin\ProductController::class, 'destroy']);

    Route::get('/orders', [\App\Http\Controllers\Api\Admin\OrderController::class, 'index']);
    Route::get('/orders/{orderNumber}', [\App\Http\Controllers\Api\Admin\OrderController::class, 'show']);
    Route::put('/orders/{orderNumber}/status', [\App\Http\Controllers\Api\Admin\OrderController::class, 'updateStatus']);

    Route::get('/commissions', [\App\Http\Controllers\Api\Admin\CommissionController::class, 'index']);
    Route::put('/commissions/{commission}/status', [\App\Http\Controllers\Api\Admin\CommissionController::class, 'updateStatus']);
    Route::post('/commissions/bulk-mark-paid', [\App\Http\Controllers\Api\Admin\CommissionController::class, 'bulkMarkPaid']);

    Route::get('/settings', [\App\Http\Controllers\Api\Admin\SettingController::class, 'index']);
    Route::put('/settings', [\App\Http\Controllers\Api\Admin\SettingController::class, 'update']);
});
