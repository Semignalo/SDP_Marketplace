<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ShippingQuoteReady extends Mailable
{
    use Queueable, SerializesModels;

    public string $trackingUrl;
    public float $usdRate;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items');
        $this->usdRate = (float) (Setting::where('key', 'usd_idr_rate')->value('value') ?: 16000);

        $base = rtrim(config('app.frontend_url'), '/');

        if (! $order->user_id && $order->guest_token) {
            $this->trackingUrl = $base
                . '/lacak/' . $order->order_number
                . '?token=' . $order->guest_token;
        } else {
            $this->trackingUrl = $base . '/akun/pesanan/' . $order->order_number;
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Shipping Quote Ready — ' . $this->order->order_number . ' — SDP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shipping-quote-ready',
        );
    }
}
