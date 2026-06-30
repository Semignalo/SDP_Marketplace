<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: A4;
            margin: 22mm 18mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, sans-serif; color: #1a1a1a; font-size: 12px; }

        .header { width: 100%; }
        .header td { vertical-align: top; }
        .brand-name { font-size: 22px; font-weight: 700; }
        .brand-tagline { font-size: 10px; color: #6b6b6b; margin-top: 3px; }
        .invoice-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #6b6b6b; }
        .invoice-number { font-size: 16px; font-weight: 700; margin-top: 4px; }
        .invoice-meta { font-size: 10px; color: #6b6b6b; margin-top: 4px; }

        .divider { border-top: 2px solid #1a1a1a; margin: 18px 0 20px; }

        .info-box { border: 1px solid #e0e0e0; border-radius: 4px; padding: 14px 16px; }
        .info-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 5px; }
        .info-value-lg { font-size: 13px; font-weight: 600; }
        .info-value { font-size: 11px; color: #444444; margin-top: 3px; line-height: 1.5; }

        table.items { width: 100%; border-collapse: collapse; margin-top: 24px; }
        table.items th { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #6b6b6b; text-align: left; padding: 9px 10px; border-bottom: 2px solid #1a1a1a; background-color: #fafafa; }
        table.items td { font-size: 11px; padding: 10px; border-bottom: 1px solid #ededed; }
        table.items tbody tr:last-child td { border-bottom: 2px solid #1a1a1a; }
        .text-right { text-align: right; }

        .sign-wrap { width: 100%; margin-top: 60px; }
        .sign-box { width: 45%; }
        .sign-label { font-size: 10px; color: #6b6b6b; }
        .sign-line { margin-top: 50px; border-top: 1px solid #1a1a1a; padding-top: 6px; font-size: 10px; color: #6b6b6b; }

        .footer-note { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 10px; color: #a3a3a3; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <div class="brand-name">{{ $siteName }}</div>
                <div class="brand-tagline">{{ $siteTagline }}</div>
            </td>
            <td class="text-right">
                <div class="invoice-label">SURAT JALAN</div>
                <div class="invoice-number">#{{ $order->order_number }}</div>
                <div class="invoice-meta">Date: {{ $order->created_at?->format('d M Y, H:i') }}</div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <table class="header">
        <tr>
            <td style="width: 62%; padding-right: 12px;">
                <div class="info-box">
                    <div class="info-label">Ship To</div>
                    <div class="info-value-lg">{{ $order->shipping_name }}</div>
                    <div class="info-value">
                        {{ $order->shipping_phone }}<br>
                        {{ $order->shipping_address }}
                    </div>
                </div>
            </td>
            <td style="width: 38%;">
                <div class="info-box">
                    <div class="info-label">Shipping Info</div>
                    <div class="info-value">
                        Courier: {{ $order->shipping_courier ?: '—' }}<br>
                        Tracking No: {{ $order->tracking_number ?: '—' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>Product</th>
                <th>Brand</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Qty</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td>{{ $item->vendor->name ?? '—' }}</td>
                <td class="text-right">Rp {{ number_format($item->price, 0, ',', '.') }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="sign-wrap">
        <tr>
            <td class="sign-box">
                <div class="sign-label">Dikirim oleh</div>
                <div class="sign-line">{{ $siteName }}</div>
            </td>
            <td class="sign-box" style="text-align: right;">
                <div class="sign-label">Diterima oleh</div>
                <div class="sign-line">&nbsp;</div>
            </td>
        </tr>
    </table>

    <div class="footer-note">
        Surat jalan ini dibuat otomatis pada {{ now()->format('d M Y') }} untuk keperluan internal pengiriman.
    </div>
</body>
</html>
