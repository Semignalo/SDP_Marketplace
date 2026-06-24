<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kuotasi Ongkir Siap</title>
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
                                        <p style="margin:0; font-size:16px; font-weight:700; color:#1d4ed8;">Ongkir internasional kamu siap!</p>
                                        <p style="margin:4px 0 0; font-size:13px; color:#2563eb;">Selesaikan pembayaran untuk lanjut diproses.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 24px; font-size:14px; color:#52525b; line-height:1.6;">
                                Halo <strong>{{ $order->shipping_name }}</strong>, ongkos kirim untuk pesanan internasionalmu sudah kami hitung. Total pesanan sudah diperbarui dan siap dibayar.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px; border-bottom:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Nomor Pesanan</p>
                                        <p style="margin:0; font-size:18px; font-weight:700;">{{ $order->order_number }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 20px; border-bottom:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Kurir</p>
                                        <p style="margin:0; font-size:14px; font-weight:600;">{{ $order->shipping_courier ?? 'Akan dikonfirmasi' }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 20px;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Dikirim ke</p>
                                        <p style="margin:0; font-size:14px; color:#3f3f46;">{{ $order->shipping_country }}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Totals -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Subtotal</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">Rp {{ number_format($order->subtotal, 0, ',', '.') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:4px 0; font-size:13px; color:#52525b;">Ongkir Internasional</td>
                                    <td align="right" style="padding:4px 0; font-size:13px;">Rp {{ number_format($order->shipping_cost, 0, ',', '.') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Total yang Harus Dibayar</td>
                                    <td align="right" style="padding:12px 0 0; font-size:15px; font-weight:700; border-top:1px solid #e4e4e7;">Rp {{ number_format($order->total, 0, ',', '.') }}</td>
                                </tr>
                            </table>

                            <!-- CTA -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 4px;">
                                        <a href="{{ $trackingUrl }}" style="display:inline-block; background-color:#1d4ed8; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px 32px; border-radius:8px;">
                                            Bayar Sekarang →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:16px 0 0; font-size:12px; color:#a1a1aa; line-height:1.6; text-align:center;">
                                Atau salin link ini:<br>
                                <a href="{{ $trackingUrl }}" style="color:#52525b; word-break:break-all;">{{ $trackingUrl }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 32px; background-color:#fafafa; border-top:1px solid #e4e4e7;">
                            <p style="margin:0; font-size:12px; color:#a1a1aa; line-height:1.6;">
                                Email ini dikirim karena tim kami sudah menghitung ongkir internasional untuk pesananmu di SDP Marketplace.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
