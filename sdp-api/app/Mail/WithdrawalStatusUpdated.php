<?php

namespace App\Mail;

use App\Models\CommissionWithdrawal;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WithdrawalStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public string $dashboardUrl;

    public function __construct(public CommissionWithdrawal $withdrawal)
    {
        $base = rtrim(config('app.frontend_url'), '/');
        $this->dashboardUrl = $base . '/akun/komisi';
    }

    public function envelope(): Envelope
    {
        $label = $this->withdrawal->status === 'approved' ? 'Disetujui' : 'Ditolak';

        return new Envelope(
            subject: 'Penarikan Komisi ' . $label . ' — SDP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.withdrawal-status',
        );
    }
}
