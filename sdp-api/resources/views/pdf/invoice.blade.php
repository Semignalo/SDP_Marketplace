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

        /* Header */
        .brand-name { font-size: 22px; font-weight: 700; }
        .brand-tagline { font-size: 10px; color: #6b6b6b; margin-top: 3px; }
        .invoice-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #6b6b6b; text-transform: uppercase; }
        .invoice-number { font-size: 16px; font-weight: 700; margin-top: 4px; }
        .invoice-meta { font-size: 10px; color: #6b6b6b; margin-top: 4px; }

        /* Info boxes */
        .info-label { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #a3a3a3; text-transform: uppercase; margin-bottom: 5px; }
        .info-value-lg { font-size: 13px; font-weight: 600; }
        .info-value { font-size: 11px; color: #444444; margin-top: 3px; line-height: 1.6; }
        .status-paid { font-size: 12px; font-weight: 700; color: #1a7a3c; }

        /* Items table */
        table.items { width: 100%; border-collapse: collapse; margin-top: 24px; }
        table.items th {
            font-size: 9px; text-transform: uppercase; letter-spacing: 1px;
            color: #6b6b6b; text-align: left; padding: 9px 10px;
            border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a;
            background-color: #f5f5f5;
        }
        table.items td { font-size: 11px; padding: 10px; border-bottom: 1px solid #d0d0d0; }
        table.items tbody tr:last-child td { border-bottom: 2px solid #1a1a1a; }

        /* Totals */
        table.totals { width: 280px; margin-left: auto; margin-top: 6px; border-collapse: collapse; }
        table.totals td { padding: 6px 0; font-size: 11px; }
        table.totals tr.grand td {
            font-size: 14px; font-weight: 700;
            border-top: 2px solid #1a1a1a; padding-top: 10px;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
    </style>
</head>
<body>

    {{-- HEADER --}}
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <div class="brand-name">{{ $siteName }}</div>
                <div class="brand-tagline">{{ $siteTagline }}</div>
            </td>
            <td class="text-right">
                <div class="invoice-label">Invoice</div>
                <div class="invoice-number">#{{ $order->order_number }}</div>
                <div class="invoice-meta">Date: {{ $order->created_at?->format('d M Y, H:i') }}</div>
            </td>
        </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; margin-bottom: 20px;">
        <tr>
            <td><hr style="border: none; border-top: 2px solid #1a1a1a;"></td>
        </tr>
    </table>

    {{-- BILL TO + PAYMENT STATUS --}}
    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td width="60%" style="padding-right: 12px; vertical-align: top;">
                <table width="100%" cellpadding="14" cellspacing="0" style="border: 1px solid #cccccc;">
                    <tr>
                        <td>
                            <div class="info-label">Bill To</div>
                            <div class="info-value-lg">{{ $order->shipping_name }}</div>
                            <div class="info-value">
                                {{ $order->shipping_phone }}<br>
                                {{ $order->shipping_address }}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td width="40%" style="vertical-align: top;">
                <table width="100%" cellpadding="14" cellspacing="0" style="border: 1px solid #cccccc;">
                    <tr>
                        <td>
                            <div class="info-label">Payment Status</div>
                            <div class="status-paid">&#10003; Paid</div>
                            @if ($order->shipping_courier)
                            <div class="info-label" style="margin-top: 12px;">Courier</div>
                            <div class="info-value">{{ $order->shipping_courier }}</div>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- ITEMS TABLE --}}
    <table class="items">
        <thead>
            <tr>
                <th>Product</th>
                <th>Brand</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($order->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td>{{ $item->vendor->name ?? '—' }}</td>
                <td class="text-right">{{ $isInternational ? '$' . number_format($item->price / $usdRate, 2) : 'Rp ' . number_format($item->price, 0, ',', '.') }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ $isInternational ? '$' . number_format($item->subtotal / $usdRate, 2) : 'Rp ' . number_format($item->subtotal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- TOTALS --}}
    <table class="totals">
        <tr>
            <td>Subtotal</td>
            <td class="text-right">{{ $isInternational ? '$' . number_format(($order->subtotal + $order->tier_discount) / $usdRate, 2) : 'Rp ' . number_format($order->subtotal + $order->tier_discount, 0, ',', '.') }}</td>
        </tr>
        @if ($order->tier_discount > 0)
        <tr>
            <td>{{ $order->tier_name }} Tier Discount</td>
            <td class="text-right">&#8722;{{ $isInternational ? '$' . number_format($order->tier_discount / $usdRate, 2) : 'Rp ' . number_format($order->tier_discount, 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr>
            <td>Shipping</td>
            <td class="text-right">{{ $isInternational ? '$' . number_format($order->shipping_cost / $usdRate, 2) : 'Rp ' . number_format($order->shipping_cost, 0, ',', '.') }}</td>
        </tr>
        <tr class="grand">
            <td>Total</td>
            <td class="text-right">{{ $isInternational ? '$' . number_format($order->total / $usdRate, 2) : 'Rp ' . number_format($order->total, 0, ',', '.') }}</td>
        </tr>
    </table>

    @if ($isInternational)
    <p style="text-align: right; font-size: 9px; color: #a3a3a3; margin-top: 6px;">
        Rp {{ number_format($order->total, 0, ',', '.') }} was charged via Midtrans (IDR settlement).
    </p>
    @endif

    {{-- FOOTER --}}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px; border-top: 1px solid #d0d0d0;">
        <tr>
            <td style="padding-top: 16px; text-align: center; font-size: 10px; color: #a3a3a3;">
                Thank you for shopping at {{ $siteName }}! This invoice was generated automatically on {{ now()->format('d M Y') }}.
            </td>
        </tr>
    </table>

</body>
</html>
