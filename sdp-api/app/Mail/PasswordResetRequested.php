<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetRequested extends Mailable
{
    use Queueable, SerializesModels;

    public string $resetUrl;

    public function __construct(public User $user, string $token)
    {
        $base = rtrim(config('app.frontend_url'), '/');
        $this->resetUrl = $base . '/reset-password?email=' . urlencode($user->email) . '&token=' . $token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Password — SDP Marketplace',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset',
        );
    }
}
