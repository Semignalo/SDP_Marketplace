<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public string $trackingUrl;
    public bool $isInternational;
    public float $usdRate;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items.vendor');
        $this->isInternational = $order->shipping_country && strcasecmp(trim($order->shipping_country), 'Indonesia') !== 0;
        $this->usdRate = (float) (Setting::where('key', 'usd_idr_rate')->value('value') ?: 16000);

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
            subject: 'Payment Confirmed — ' . $this->order->order_number . ' — SDP',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-confirmation',
        );
    }

    public function attachments(): array
    {
        $settings = \App\Models\Setting::whereIn('key', ['site_name', 'site_tagline'])->pluck('value', 'key');

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $this->order,
            'isInternational' => $this->isInternational,
            'usdRate' => $this->usdRate,
            'siteName' => $settings['site_name'] ?? 'SDP Marketplace',
            'siteTagline' => $settings['site_tagline'] ?? 'Multi-Brand Marketplace',
        ]);

        return [
            Attachment::fromData(fn () => $pdf->output(), "Invoice-{$this->order->order_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
