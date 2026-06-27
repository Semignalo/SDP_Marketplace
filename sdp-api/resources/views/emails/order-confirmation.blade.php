<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
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

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 8px; font-size:22px; font-weight:700;">Thanks for your order!</h1>
                            <p style="margin:0 0 24px; font-size:14px; color:#52525b; line-height:1.6;">
                                Hi {{ $order->shipping_name }}, we've received your order. Here's a summary.
                            </p>

                            @if ($order->status === 'awaiting_quote')
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0; font-size:13px; font-weight:700; color:#92400e;">We're calculating your international shipping</p>
                                        <p style="margin:6px 0 0; font-size:13px; color:#92400e; line-height:1.6;">
                                            Since this order ships outside Indonesia, our team will manually calculate the shipping cost and email you a quote. You'll be able to pay as soon as it's ready — no action needed for now.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            @endif

                            <!-- Order number -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Order Number</p>
                                        <p style="margin:0; font-size:18px; font-weight:700;">{{ $order->order_number }}</p>
                                    </td>
                                </tr>
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
                                        @if ($isInternational) ${{ number_format($item->subtotal / $usdRate, 2) }} @else Rp {{ number_format($item->subtotal, 0, ',', '.') }} @endif
                                    </td>
                                </tr>
                                @endforeach
                            </table>

                            <!-- Totals -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Subtotal</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">
                                        @if ($isInternational) ${{ number_format($order->subtotal / $usdRate, 2) }} @else Rp {{ number_format($order->subtotal, 0, ',', '.') }} @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">
                                        @if ($order->status === 'awaiting_quote') Shipping @else Shipping ({{ $order->shipping_courier }}) @endif
                                    </td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">
                                        @if ($order->status === 'awaiting_quote')
                                            To be quoted
                                        @elseif ((float) $order->shipping_cost === 0.0)
                                            FREE
                                        @elseif ($isInternational)
                                            ${{ number_format($order->shipping_cost / $usdRate, 2) }}
                                        @else
                                            Rp {{ number_format($order->shipping_cost, 0, ',', '.') }}
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Total</td>
                                    <td align="right" style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">
                                        @if ($isInternational) ${{ number_format($order->total / $usdRate, 2) }} @else Rp {{ number_format($order->total, 0, ',', '.') }} @endif
                                    </td>
                                </tr>
                            </table>
                            @if ($isInternational)
                            <p style="margin:-12px 0 24px; font-size:11px; color:#a1a1aa; text-align:right;">
                                Estimated in USD. You'll be charged in IDR at checkout (Midtrans only settles in Indonesian Rupiah).
                            </p>
                            @endif

                            <!-- Shipping address -->
                            <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Shipping to</p>
                            <p style="margin:0 0 24px; font-size:14px; color:#3f3f46; line-height:1.6;">
                                {{ $order->shipping_name }} ({{ $order->shipping_phone }})<br>
                                {{ $order->shipping_address }}
                            </p>

                            <!-- CTA -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 4px;">
                                        <a href="{{ $trackingUrl }}" style="display:inline-block; background-color:#1a1a1a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px 32px; border-radius:8px;">
                                            @if ($order->status === 'awaiting_quote') Track Order @else Track &amp; Pay for Order @endif
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
                                This email was sent because an order was placed under your email address at SDP Marketplace.
                                Keep the tracking link above to check your order status without logging in.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
