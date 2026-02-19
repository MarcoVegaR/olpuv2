<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Planilla — {{ $expediente->tracking }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; padding: 14px 20px; }
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 12px; }
        .header-left { flex: 1; }
        .header-left .inst { font-size: 14px; font-weight: 700; line-height: 1.2; }
        .header-left .dept { font-size: 11px; color: #444; }
        .header-right { text-align: right; }
        .header-right img { width: 80px; height: 80px; }
        .header-right .qr-label { font-size: 9px; color: #666; margin-top: 2px; }
        /* Title */
        .title { font-size: 15px; font-weight: 700; text-align: center; margin: 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .subtitle { font-size: 10px; text-align: center; color: #666; margin-bottom: 12px; }
        /* Grid */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .card { border: 1px solid #ccc; border-radius: 6px; padding: 8px 10px; }
        .card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 4px; letter-spacing: 0.3px; }
        .row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
        .label { color: #555; }
        .value { font-weight: 600; text-align: right; word-break: break-word; }
        /* Status badge */
        .badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; border: 1px solid #ccc; }
        .badge-ok { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
        .badge-warn { background: #fef3c7; border-color: #fcd34d; color: #92400e; }
        .badge-neutral { background: #f3f4f6; border-color: #d1d5db; color: #374151; }
        /* Table */
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; vertical-align: top; }
        th { background: #f3f4f6; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2px; }
        .muted { color: #666; }
        /* Observations */
        .obs-box { border: 1px solid #ccc; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; min-height: 30px; }
        /* Signatures */
        .signature { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .sign-line { border-top: 1px solid #333; padding-top: 6px; text-align: center; font-size: 10px; }
        /* Footer */
        .footer { margin-top: 14px; border-top: 1px solid #ddd; padding-top: 6px; font-size: 9px; color: #888; display: flex; justify-content: space-between; }
        @media print {
            .no-print { display: none !important; }
            body { margin: 0; }
            @page { margin: 12mm; }
        }
    </style>
</head>
<body>
<div class="container">
    {{-- ── Header ── --}}
    <div class="header">
        <div class="header-left">
            <div class="inst">Dirección de Planeamiento Urbano</div>
            <div class="dept">Alcaldía del Municipio</div>
        </div>
        @if(!empty($qrBase64))
        {{-- QR removed from planilla de recepción --}}
        @endif
    </div>

    <div class="title">Planilla de recepción de recaudos</div>
    <div class="subtitle">Generada automáticamente — {{ now()->format('d/m/Y H:i') }}</div>

    {{-- ── Info grids ── --}}
    <div class="grid">
        <div class="card">
            <div class="card-title">Expediente</div>
            <div class="row"><span class="label">Tracking</span><span class="value" style="font-family: monospace;">{{ $expediente->tracking }}</span></div>
            <div class="row"><span class="label">N° Receptoría</span><span class="value">{{ $expediente->numero_receptoria ?? '—' }}</span></div>
            <div class="row"><span class="label">Código catastral</span><span class="value">{{ $expediente->codigo_catastral ?? '—' }}</span></div>
            <div class="row"><span class="label">Fecha recepción</span><span class="value">{{ optional($expediente->received_at ?? $expediente->created_at)->format('d/m/Y H:i') }}</span></div>
            <div class="row">
                <span class="label">Estado</span>
                <span class="value">
                    @php
                        $status = (string) $expediente->status;
                        $sl = $statusLabels[$status] ?? $status;
                        $terminal = in_array($status, ['completed', 'partial'], true);
                        $rejected = in_array($status, ['rejected', 'suspended'], true);
                    @endphp
                    <span class="badge {{ $terminal ? 'badge-ok' : ($rejected ? 'badge-warn' : 'badge-neutral') }}">{{ $sl }}</span>
                </span>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Trámite y solicitante</div>
            <div class="row"><span class="label">Trámite</span><span class="value">{{ $expediente->procedureType?->name ?? '—' }}</span></div>
            <div class="row"><span class="label">Solicitante</span><span class="value">{{ $expediente->solicitante?->nombre_razon_social ?? '—' }}</span></div>
            <div class="row"><span class="label">Documento</span><span class="value">{{ ($expediente->solicitante?->tipo_documento ?? '—') . '-' . ($expediente->solicitante?->numero_documento ?? '') }}</span></div>
            <div class="row"><span class="label">Teléfono</span><span class="value">{{ $expediente->solicitante?->telefono ?? '—' }}</span></div>
            @if($expediente->presentado_por_nombre)
            <div style="margin-top: 4px; border-top: 1px dashed #ddd; padding-top: 4px;">
                <div class="row"><span class="label">Presentado por</span><span class="value">{{ $expediente->presentado_por_nombre }}</span></div>
                @if($expediente->presentado_por_documento)
                <div class="row"><span class="label">Doc. presentador</span><span class="value">{{ $expediente->presentado_por_documento }}</span></div>
                @endif
                @if($expediente->presentado_por_telefono)
                <div class="row"><span class="label">Tel. presentador</span><span class="value">{{ $expediente->presentado_por_telefono }}</span></div>
                @endif
            </div>
            @endif
        </div>
    </div>

    {{-- Workflow assignments removed from planilla de recepción --}}

    {{-- ── Observations ── --}}
    <div class="obs-box">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 3px;">Observaciones</div>
        <div class="muted">{{ $expediente->observaciones ?? '—' }}</div>
    </div>

    {{-- ── Requirements checklist ── --}}
    <div style="font-size: 12px; font-weight: 700; margin-bottom: 4px;">Checklist de recaudos consignados</div>
    <table>
        <thead>
            <tr>
                <th style="width: 24px;">#</th>
                <th>Recaudo</th>
                <th style="width: 90px; text-align: center;">Consignado</th>
                <th style="width: 80px; text-align: center;">Requerido</th>
            </tr>
        </thead>
        <tbody>
        @foreach($expediente->requirements as $i => $er)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>
                    <div style="font-weight: 600;">{{ $er->requirement?->name ?? '—' }}</div>
                    @if($er->requirement?->code)
                    <div class="muted" style="font-family: monospace; font-size: 9px;">{{ $er->requirement->code }}</div>
                    @endif
                </td>
                <td style="text-align: center; font-size: 14px;">{!! $er->physical_received ? '&#x2611;' : '&#x2610;' !!}</td>
                <td style="text-align: center;">{{ $er->is_required ? 'Sí' : 'No' }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    {{-- ── Signatures ── --}}
    <div class="signature">
        <div class="sign-line">Firma del solicitante / presentador</div>
        <div class="sign-line">Firma y sello del receptor</div>
    </div>

    {{-- ── Footer ── --}}
    <div class="footer">
        <span>Tracking: {{ $expediente->tracking }}</span>
        <span>Verificar en: {{ url('/public/verify/' . $expediente->qr_token) }}</span>
    </div>

    <div class="no-print" style="margin-top: 16px; text-align: center;">
        <button onclick="window.print()" style="padding: 8px 20px; cursor: pointer; font-size: 13px; border-radius: 6px; border: 1px solid #ccc;">Imprimir</button>
    </div>
</div>
</body>
</html>
