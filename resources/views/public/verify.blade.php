<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verificación pública</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 14px; color: #111; background: #f7f7f7; }
        .container { max-width: 820px; margin: 0 auto; padding: 18px; }
        .card { background: #fff; border: 1px solid #e4e4e4; border-radius: 12px; padding: 16px; }
        .title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
        .muted { color: #666; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
        .row { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; }
        .label { color: #555; }
        .value { font-weight: 600; text-align: right; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; border: 1px solid #ddd; }
        .badge-ok { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
        .badge-warn { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
        a { color: #0ea5e9; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
<div class="container">
    <div class="card">
        <div class="title">Verificación pública</div>
        <div class="muted">
            Este resultado fue obtenido desde el sistema. Si el enlace o dominio no coincide con el oficial, no confíes en la información.
        </div>

        <div style="margin-top: 12px;">
            @php
                $isActive = (bool) ($expediente->is_active ?? true);
                $status = (string) ($expediente->status ?? '');
                $statusLabels = [
                    'draft' => 'Borrador',
                    'received' => 'Recibido',
                    'pending_reviewer' => 'En revisión',
                    'pending_inspector' => 'Por inspección',
                    'in_inspection' => 'En inspección',
                    'pending_response' => 'En respuesta técnica',
                    'pending_decision' => 'Por decisión',
                    'completed' => 'Completado',
                    'rejected' => 'Rechazado',
                    'partial' => 'Aprobado parcialmente',
                    'suspended' => 'Suspendido',
                ];
                $completedStatuses = ['completed', 'partial'];
                $rejectedStatuses = ['rejected', 'suspended'];

                if (! $isActive) {
                    $label = 'Revocado / Inactivo';
                    $klass = 'badge-warn';
                } elseif (in_array($status, $completedStatuses, true)) {
                    $label = $statusLabels[$status] ?? $status;
                    $klass = 'badge-ok';
                } elseif (in_array($status, $rejectedStatuses, true)) {
                    $label = $statusLabels[$status] ?? $status;
                    $klass = 'badge-warn';
                } else {
                    $label = $statusLabels[$status] ?? 'En proceso';
                    $klass = 'badge-ok';
                }
            @endphp
            <span class="badge {{ $klass }}">{{ $label }}</span>
        </div>

        <div class="grid">
            <div>
                <div class="row"><span class="label">Tracking</span><span class="value">{{ $expediente->tracking }}</span></div>
                <div class="row"><span class="label">Fecha</span><span class="value">{{ optional($expediente->received_at ?? $expediente->created_at)->format('d/m/Y H:i') }}</span></div>
                <div class="row"><span class="label">Modo</span><span class="value">{{ $mode === 'qr' ? 'QR' : 'Tracking' }}</span></div>
            </div>
            <div>
                <div class="row"><span class="label">Trámite</span><span class="value">{{ $expediente->procedureType?->name ?? '—' }}</span></div>
                <div class="row"><span class="label">Solicitante</span><span class="value">{{ $expediente->solicitante?->nombre_razon_social ?? '—' }}</span></div>
                <div class="row"><span class="label">Documento</span><span class="value">{{ ($expediente->solicitante?->tipo_documento ?? '—') . '-' . ($expediente->solicitante?->numero_documento ?? '') }}</span></div>
            </div>
        </div>

        <div style="margin-top: 12px;" class="muted">
            Para consultar por tracking: <a href="{{ url('/public/tracking/' . $expediente->tracking) }}">{{ url('/public/tracking/' . $expediente->tracking) }}</a>
        </div>
    </div>
</div>
</body>
</html>
