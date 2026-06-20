<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\CourierTracking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderShipped extends Mailable
{
    use Queueable, SerializesModels;

    public string $trackingUrl;
    public ?string $courierTrackingUrl;

    public function __construct(public Order $order)
    {
        $base = rtrim(config('app.frontend_url'), '/');

        if (! $order->user_id && $order->guest_token) {
            $this->trackingUrl = $base
                . '/lacak/' . $order->order_number
                . '?token=' . $order->guest_token;
        } else {
            $this->trackingUrl = $base . '/akun/pesanan/' . $order->order_number;
        }

        $this->courierTrackingUrl = CourierTracking::url($order->shipping_courier);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pesanan Dikirim — ' . $this->order->order_number . ' — SDP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-shipped',
        );
    }
}
