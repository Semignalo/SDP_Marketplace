<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:12px; overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#1a1a1a; padding:24px 32px;">
                            <span style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.5px;">SDP Marketplace</span>
                        </td>
                    </tr>

                    <!-- Success banner -->
                    <tr>
                        <td style="background-color:#f0fdf4; border-bottom:1px solid #bbf7d0; padding:20px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right:12px; vertical-align:middle;">
                                        <span style="font-size:28px;">✅</span>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <p style="margin:0; font-size:16px; font-weight:700; color:#15803d;">Payment confirmed!</p>
                                        <p style="margin:4px 0 0; font-size:13px; color:#16a34a;">Your order is being processed by the seller.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 24px; font-size:14px; color:#52525b; line-height:1.6;">
                                Hi <strong>{{ $order->shipping_name }}</strong>, we've received payment for the following order. The seller will pack and ship it shortly.
                            </p>

                            <!-- Order number + payment info -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px; border-bottom:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Order Number</p>
                                        <p style="margin:0; font-size:18px; font-weight:700;">{{ $order->order_number }}</p>
                                    </td>
                                </tr>
                                @if ($order->payment_type)
                                <tr>
                                    <td style="padding:12px 20px;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Payment Method</p>
                                        <p style="margin:0; font-size:14px; font-weight:600; text-transform:capitalize;">
                                            {{ str_replace('_', ' ', $order->payment_type) }}
                                            @if ($order->payment_channel)
                                                — {{ strtoupper($order->payment_channel) }}
                                            @endif
                                        </p>
                                    </td>
                                </tr>
                                @endif
                                @if ($order->payment_verified_at)
                                <tr>
                                    <td style="padding:12px 20px; border-top:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Confirmed At</p>
                                        <p style="margin:0; font-size:14px; color:#3f3f46;">
                                            {{ \Carbon\Carbon::parse($order->payment_verified_at)->setTimezone('Asia/Jakarta')->format('d M Y, H:i') }} WIB
                                        </p>
                                    </td>
                                </tr>
                                @endif
                            </table>

                            <!-- Items -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                                @foreach ($order->items as $item)
                                <tr>
                                    <td style="padding:8px 0; border-bottom:1px solid #f4f4f5; font-size:14px;">
                                        {{ $item->product_name }}
                                        <span style="color:#a1a1aa;"> × {{ $item->quantity }}</span>
                                    </td>
                                    <td align="right" style="padding:8px 0; border-bottom:1px solid #f4f4f5; font-size:14px; font-weight:600; white-space:nowrap;">
                                        Rp {{ number_format($item->subtotal, 0, ',', '.') }}
                                    </td>
                                </tr>
                                @endforeach
                            </table>

                            <!-- Totals -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Subtotal</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
                                </tr>
                                @if ((float) ($order->tier_discount ?? 0) > 0)
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#16a34a;">{{ $order->tier_name ?? '' }} tier discount</td>
                                    <td align="right" style="padding:4px 0; font-size:13px; color:#16a34a;">−Rp {{ number_format($order->tier_discount, 0, ',', '.') }}</td>
                                </tr>
                                @endif
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Shipping ({{ $order->shipping_courier }})</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">
                                        @if ((float) $order->shipping_cost === 0.0) FREE @else Rp {{ number_format($order->shipping_cost, 0, ',', '.') }} @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Total Paid</td>
                                    <td align="right" style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Rp {{ number_format($order->total, 0, ',', '.') }}</td>
                                </tr>
                            </table>

                            <!-- Shipping address -->
                            <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Shipping to</p>
                            <p style="margin:0 0 28px; font-size:14px; color:#3f3f46; line-height:1.6;">
                                {{ $order->shipping_name }} ({{ $order->shipping_phone }})<br>
                                {{ $order->shipping_address }}
                            </p>

                            <!-- CTA -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 4px;">
                                        <a href="{{ $trackingUrl }}" style="display:inline-block; background-color:#15803d; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px 32px; border-radius:8px;">
                                            Track Order →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:16px 0 0; font-size:12px; color:#a1a1aa; line-height:1.6; text-align:center;">
                                Or copy this link into your browser:<br>
                                <a href="{{ $trackingUrl }}" style="color:#52525b; word-break:break-all;">{{ $trackingUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 32px; background-color:#fafafa; border-top:1px solid #e4e4e7;">
                            <p style="margin:0; font-size:12px; color:#a1a1aa; line-height:1.6;">
                                This email was sent because a payment was confirmed for an order at SDP Marketplace.
                                Keep the tracking link above to follow your order's shipping status.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
