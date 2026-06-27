<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Quote Ready</title>
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

                    <!-- Banner -->
                    <tr>
                        <td style="background-color:#eff6ff; border-bottom:1px solid #bfdbfe; padding:20px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right:12px; vertical-align:middle;">
                                        <span style="font-size:28px;">📦</span>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <p style="margin:0; font-size:16px; font-weight:700; color:#1d4ed8;">Your international shipping quote is ready!</p>
                                        <p style="margin:4px 0 0; font-size:13px; color:#2563eb;">Complete payment to move your order forward.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 24px; font-size:14px; color:#52525b; line-height:1.6;">
                                Hi <strong>{{ $order->shipping_name }}</strong>, we've calculated the shipping cost for your international order. Your order total has been updated and is ready for payment.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px; border-bottom:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Order Number</p>
                                        <p style="margin:0; font-size:18px; font-weight:700;">{{ $order->order_number }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 20px; border-bottom:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Courier</p>
                                        <p style="margin:0; font-size:14px; font-weight:600;">{{ $order->shipping_courier ?? 'To be confirmed' }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 20px;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Shipping to</p>
                                        <p style="margin:0; font-size:14px; color:#3f3f46;">{{ $order->shipping_country }}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Totals -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Subtotal</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">${{ number_format($order->subtotal / $usdRate, 2) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">International Shipping</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">${{ number_format($order->shipping_cost / $usdRate, 2) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Total Due</td>
                                    <td align="right" style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">${{ number_format($order->total / $usdRate, 2) }}</td>
                                </tr>
                            </table>
                            <p style="margin:-12px 0 24px; font-size:11px; color:#a1a1aa; text-align:right;">
                                ≈ Rp {{ number_format($order->total, 0, ',', '.') }} — you'll be charged this amount in IDR at checkout (Midtrans only settles in Indonesian Rupiah).
                            </p>

                            <!-- CTA -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 4px;">
                                        <a href="{{ $trackingUrl }}" style="display:inline-block; background-color:#1d4ed8; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px 32px; border-radius:8px;">
                                            Pay Now →
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
                                This email was sent because our team has calculated the international shipping cost for your order at SDP Marketplace.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
