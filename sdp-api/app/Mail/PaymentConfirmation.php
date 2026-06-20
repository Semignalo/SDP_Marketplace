<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public string $trackingUrl;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items');

        $base = rtrim(config('app.frontend_url'), '/');

        // Guest order — tracking pakai token
        if (! $order->user_id && $order->guest_token) {
            $this->trackingUrl = $base
                . '/lacak/' . $order->order_number
                . '?token=' . $order->guest_token;
        } else {
            // Logged-in user — langsung ke halaman pesanan
            $this->trackingUrl = $base . '/akun/pesanan/' . $order->order_number;
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pembayaran Dikonfirmasi — ' . $this->order->order_number . ' — SDP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmation',
        );
    }
}
