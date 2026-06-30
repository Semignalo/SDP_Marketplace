<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class VerifyEmail extends BaseVerifyEmail
{
    /**
     * Link di email mengarah ke frontend (bukan domain API mentah), lalu frontend
     * yang memanggil API di belakang layar. Mencegah pola "klik link -> redirect
     * ke domain lain" yang sering salah dideteksi sebagai phishing oleh Safe Browsing.
     * Signature tetap dihitung terhadap route API asli, jadi tetap valid saat di-relay.
     */
    protected function verificationUrl($notifiable): string
    {
        $signedApiUrl = URL::temporarySignedRoute(
            'api.auth.email.verify',
            Carbon::now()->addMinutes(60),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        $query = parse_url($signedApiUrl, PHP_URL_QUERY);
        $frontend = rtrim(config('app.frontend_url'), '/');

        return $frontend . '/email-verify'
            . '?id=' . $notifiable->getKey()
            . '&hash=' . sha1($notifiable->getEmailForVerification())
            . '&' . $query;
    }
}
