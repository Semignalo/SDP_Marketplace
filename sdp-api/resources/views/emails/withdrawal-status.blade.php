<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Penarikan Komisi</title>
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

                    @if ($withdrawal->status === 'approved')
                    <!-- Approved banner -->
                    <tr>
                        <td style="background-color:#f0fdf4; border-bottom:1px solid #bbf7d0; padding:20px 32px;">
                            <p style="margin:0; font-size:16px; font-weight:700; color:#15803d;">✅ Penarikan komisi disetujui</p>
                            <p style="margin:4px 0 0; font-size:13px; color:#16a34a;">Dana akan ditransfer manual ke rekening yang kamu daftarkan.</p>
                        </td>
                    </tr>
                    @else
                    <!-- Rejected banner -->
                    <tr>
                        <td style="background-color:#fef2f2; border-bottom:1px solid #fecaca; padding:20px 32px;">
                            <p style="margin:0; font-size:16px; font-weight:700; color:#b91c1c;">❌ Penarikan komisi ditolak</p>
                            <p style="margin:4px 0 0; font-size:13px; color:#dc2626;">Lihat catatan admin di bawah untuk detail.</p>
                        </td>
                    </tr>
                    @endif

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid #e4e4e7; border-radius:8px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px; border-bottom:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Jumlah Penarikan</p>
                                        <p style="margin:0; font-size:18px; font-weight:700;">Rp {{ number_format($withdrawal->amount, 0, ',', '.') }}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 20px;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Rekening Tujuan</p>
                                        <p style="margin:0; font-size:14px; font-weight:600;">{{ $withdrawal->bank_name }} — {{ $withdrawal->bank_account_number }}</p>
                                        <p style="margin:2px 0 0; font-size:13px; color:#52525b;">a.n. {{ $withdrawal->bank_account_name }}</p>
                                    </td>
                                </tr>
                                @if ($withdrawal->admin_notes)
                                <tr>
                                    <td style="padding:12px 20px; border-top:1px solid #e4e4e7;">
                                        <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#a1a1aa;">Catatan Admin</p>
                                        <p style="margin:0; font-size:14px; color:#3f3f46;">{{ $withdrawal->admin_notes }}</p>
                                    </td>
                                </tr>
                                @endif
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 4px;">
                                        <a href="{{ $dashboardUrl }}" style="display:inline-block; background-color:#1a1a1a; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px 32px; border-radius:8px;">
                                            Lihat Riwayat Penarikan →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:24px 32px; background-color:#fafafa; border-top:1px solid #e4e4e7;">
                            <p style="margin:0; font-size:12px; color:#a1a1aa; line-height:1.6;">
                                Email ini dikirim karena ada perubahan status permintaan penarikan komisi di SDP Marketplace.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
