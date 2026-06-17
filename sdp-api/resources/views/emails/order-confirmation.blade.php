<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Pesanan</title>
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
                            <h1 style="margin:0 0 8px; font-size:22px; font-weight:700;">Terima kasih atas pesananmu!</h1>
                            <p style="margin:0 0 24px; font-size:14px; color:#52525b; line-height:1.6;">
                                Halo {{ $order->shipping_name }}, pesananmu sudah kami terima. Berikut ringkasannya.
                            </p>

                            <!-- Order number -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Nomor Pesanan</p>
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
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Ongkir ({{ $order->shipping_courier }})</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">
                                        @if ((float) $order->shipping_cost === 0.0) GRATIS @else Rp {{ number_format($order->shipping_cost, 0, ',', '.') }} @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Total</td>
                                    <td align="right" style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Rp {{ number_format($order->total, 0, ',', '.') }}</td>
                                </tr>
                            </table>

                            <!-- Shipping address -->
                            <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Dikirim ke</p>
                            <p style="margin:0 0 24px; font-size:14px; color:#3f3f46; line-height:1.6;">
                                {{ $order->shipping_name }} ({{ $order->shipping_phone }})<br>
                                {{ $order->shipping_address }}
                            </p>

                            <!-- CTA -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 4px;">
                                        <a href="{{ $trackingUrl }}" style="display:inline-block; background-color:#1a1a1a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px 32px; border-radius:8px;">
                                            Lacak &amp; Bayar Pesanan
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:16px 0 0; font-size:12px; color:#a1a1aa; line-height:1.6; text-align:center;">
                                Atau salin link ini ke browser:<br>
                                <a href="{{ $trackingUrl }}" style="color:#52525b; word-break:break-all;">{{ $trackingUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 32px; background-color:#fafafa; border-top:1px solid #e4e4e7;">
                            <p style="margin:0; font-size:12px; color:#a1a1aa; line-height:1.6;">
                                Email ini dikirim karena ada pesanan atas nama emailmu di SDP Marketplace.
                                Simpan link tracking di atas untuk memantau status pesanan tanpa perlu login.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
