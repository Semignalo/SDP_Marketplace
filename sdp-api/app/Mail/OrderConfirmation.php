<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public string $trackingUrl;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items');

        $base = rtrim(config('app.frontend_url'), '/');
        $this->trackingUrl = $base
            . '/lacak/' . $order->order_number
            . '?token=' . $order->guest_token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Konfirmasi Pesanan ' . $this->order->order_number . ' — SDP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmation',
        );
    }
}
