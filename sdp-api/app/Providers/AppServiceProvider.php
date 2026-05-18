<?php

namespace App\Providers;

use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\ServiceProvider;
use Resend\Client as ResendClient;
use Resend\Contracts\Client as ResendClientContract;
use Resend\Transporters\HttpTransporter;
use Resend\ValueObjects\Transporter\BaseUri;
use Resend\ValueObjects\Transporter\Headers;
use Resend\ValueObjects\ApiKey;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->singleton(ResendClientContract::class, function () {
                $apiKey = ApiKey::from(config('resend.api_key') ?? config('services.resend.key'));
                $baseUri = BaseUri::from(getenv('RESEND_BASE_URL') ?: 'api.resend.com');
                $headers = Headers::withAuthorization($apiKey);

                $guzzle = new GuzzleClient(['verify' => false]);
                $transporter = new HttpTransporter($guzzle, $baseUri, $headers);

                return new ResendClient($transporter);
            });

            $this->app->alias(ResendClientContract::class, 'resend');
            $this->app->alias(ResendClientContract::class, ResendClient::class);
        }
    }

    public function boot(): void
    {
        //
    }
}
