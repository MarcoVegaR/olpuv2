<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verificación de Trámite — Dirección de Planeamiento Urbano</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: #f0f4f8; line-height: 1.6; }
        .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; }
        .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08); max-width: 520px; width: 100%; overflow: hidden; }
        .card-header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #fff; padding: 28px 28px 24px; text-align: center; }
        .card-header .icon { width: 48px; height: 48px; background: rgba(255,255,255,.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .card-header .icon svg { width: 28px; height: 28px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .card-header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .card-header p { font-size: 13px; opacity: .85; }
        .card-body { padding: 24px 28px 28px; }
        .status-banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; font-weight: 600; font-size: 15px; }
        .status-ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-progress { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
        .status-warn { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .status-icon { width: 22px; height: 22px; flex-shrink: 0; }
        .info-grid { display: grid; gap: 0; }
        .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #f1f5f9; gap: 12px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-size: 14px; flex-shrink: 0; }
        .info-value { font-weight: 600; font-size: 14px; text-align: right; word-break: break-all; }
        .info-value.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: #475569; }
        .footer-link { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center; }
        .footer-link a { color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 500; }
        .footer-link a:hover { text-decoration: underline; }
        .security-note { margin-top: 16px; text-align: center; font-size: 12px; color: #94a3b8; max-width: 520px; }
        .verified-by { margin-top: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        .decision-box { margin-top: 16px; padding: 14px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .decision-box .decision-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; font-weight: 600; margin-bottom: 6px; }
        .decision-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 700; }
        .decision-approved { background: #dcfce7; color: #166534; }
        .decision-rejected { background: #fee2e2; color: #991b1b; }
        .decision-partial { background: #fef3c7; color: #92400e; }
        .decision-suspended { background: #fef3c7; color: #92400e; }
        .decision-meta { margin-top: 8px; font-size: 13px; color: #64748b; }
        /* Progress stepper */
        .stepper { margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
        .stepper-title { text-align: center; font-size: 15px; font-weight: 700; margin-bottom: 14px; color: #1a1a2e; }
        .stepper-track { display: flex; align-items: center; justify-content: space-between; }
        .stepper-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .stepper-dot { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; transition: all .2s; }
        .stepper-dot.done { background: #10b981; color: #fff; box-shadow: 0 2px 6px rgba(16,185,129,.3); }
        .stepper-dot.current { background: #3b82f6; color: #fff; box-shadow: 0 0 0 4px rgba(59,130,246,.2); }
        .stepper-dot.rejected { background: #ef4444; color: #fff; box-shadow: 0 0 0 4px rgba(239,68,68,.2); }
        .stepper-dot.pending { background: #f3f4f6; color: #9ca3af; }
        .stepper-dot svg { width: 18px; height: 18px; }
        .stepper-label { font-size: 11px; font-weight: 500; color: #64748b; text-align: center; max-width: 70px; }
        .stepper-label.done { color: #059669; }
        .stepper-label.current { color: #3b82f6; font-weight: 700; }
        .stepper-bar { flex: 1; height: 4px; border-radius: 2px; margin: 0 2px; }
        .stepper-bar.done { background: #10b981; }
        .stepper-bar.pending { background: #e5e7eb; }
        @media (max-width: 480px) {
            .stepper-label { display: none; }
            .stepper-dot { width: 30px; height: 30px; font-size: 11px; }
        }
    </style>
</head>
<body>
<div class="page">
    <div class="card">
        <div class="card-header">
            <div class="icon">
                <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>
            </div>
            <h1>Verificación de Trámite</h1>
            <p>Dirección de Planeamiento Urbano</p>
        </div>

        <div class="card-body">
            @php
                $isActive = (bool) ($expediente->is_active ?? true);
                $status = (string) ($expediente->status ?? '');
                $terminalStatuses = ['completed', 'rejected', 'partial', 'suspended'];
                $isTerminal = in_array($status, $terminalStatuses, true);

                if (! $isActive) {
                    $label = 'Revocado / Inactivo';
                    $klass = 'status-warn';
                    $iconSvg = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
                } elseif ($isTerminal) {
                    $label = 'Completado';
                    $klass = 'status-ok';
                    $iconSvg = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
                } else {
                    $label = 'En proceso';
                    $klass = 'status-progress';
                    $iconSvg = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
                }
            @endphp

            <div class="status-banner {{ $klass }}">
                {!! $iconSvg !!}
                Estado: {{ $label }}
            </div>

            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">Trámite</span>
                    <span class="info-value">{{ $expediente->procedureType?->name ?? '—' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Solicitante</span>
                    <span class="info-value">{{ $expediente->solicitante?->nombre_razon_social ?? '—' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Documento</span>
                    <span class="info-value">{{ ($expediente->solicitante?->tipo_documento ?? '—') . '-' . ($expediente->solicitante?->numero_documento ?? '') }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha de recepción</span>
                    <span class="info-value">{{ optional($expediente->received_at ?? $expediente->created_at)->format('d/m/Y H:i') }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Nro. de Seguimiento</span>
                    <span class="info-value mono">{{ $expediente->tracking }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Verificado por</span>
                    <span class="info-value">{{ $mode === 'qr' ? 'Código QR' : 'Número de seguimiento' }}</span>
                </div>
                @if($isTerminal && $expediente->completed_at)
                <div class="info-row">
                    <span class="info-label">Fecha de conclusión</span>
                    <span class="info-value">{{ optional($expediente->completed_at)->format('d/m/Y H:i') }}</span>
                </div>
                @endif
            </div>

            @if($isTerminal && $expediente->decision)
            @php
                $decisionLabels = [
                    'approved' => 'Aprobado',
                    'rejected' => 'Rechazado',
                    'partial' => 'Aprobado parcialmente',
                    'suspended' => 'Suspendido',
                ];
                $decisionLabel = $decisionLabels[$expediente->decision] ?? $expediente->decision;
                $decisionClass = match($expediente->decision) {
                    'approved' => 'decision-approved',
                    'rejected' => 'decision-rejected',
                    'partial' => 'decision-partial',
                    'suspended' => 'decision-suspended',
                    default => 'decision-partial',
                };
            @endphp
            <div class="decision-box">
                <div class="decision-title">Decisión</div>
                <span class="decision-badge {{ $decisionClass }}">{{ $decisionLabel }}</span>
                @if($expediente->valid_from || $expediente->valid_until)
                <div class="decision-meta">
                    Vigencia: {{ optional($expediente->valid_from)->format('d/m/Y') ?? '—' }} — {{ optional($expediente->valid_until)->format('d/m/Y') ?? '—' }}
                </div>
                @endif
            </div>
            @endif

            {{-- Progress stepper --}}
            @php
                $phases = [
                    ['key' => 'received', 'label' => 'Recibido'],
                    ['key' => 'pending_reviewer', 'label' => 'Revisor'],
                    ['key' => 'pending_inspector', 'label' => 'Inspector'],
                    ['key' => 'in_inspection', 'label' => 'Inspección'],
                    ['key' => 'pending_response', 'label' => 'Respuesta'],
                    ['key' => 'pending_decision', 'label' => 'Decisión'],
                    ['key' => 'completed', 'label' => 'Completado'],
                ];
                $phaseKeys = array_column($phases, 'key');
                $currentIdx = array_search($status, $phaseKeys, true);
                if ($status === 'completed' || $status === 'rejected') {
                    $currentIdx = count($phases) - 1;
                } elseif ($currentIdx === false) {
                    $currentIdx = 0;
                }
                $isRejectedStatus = $status === 'rejected';
            @endphp
            <div class="stepper">
                <div class="stepper-title">Progreso del trámite</div>
                <div class="stepper-track">
                    @foreach($phases as $idx => $phase)
                        @if($idx > 0)
                            <div class="stepper-bar {{ $idx < $currentIdx ? 'done' : 'pending' }}"></div>
                        @endif
                        @php
                            $isDone = $idx < $currentIdx;
                            $isCurrent = $idx === $currentIdx;
                            $dotClass = $isDone ? 'done' : ($isCurrent && $isRejectedStatus && $idx === count($phases) - 1 ? 'rejected' : ($isCurrent ? 'current' : 'pending'));
                            $labelClass = $isDone ? 'done' : ($isCurrent ? 'current' : '');
                        @endphp
                        <div class="stepper-step">
                            <div class="stepper-dot {{ $dotClass }}">
                                @if($isDone)
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                @elseif($isCurrent && $isRejectedStatus && $idx === count($phases) - 1)
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                @else
                                    {{ $idx + 1 }}
                                @endif
                            </div>
                            <span class="stepper-label {{ $labelClass }}">{{ $phase['label'] }}</span>
                        </div>
                    @endforeach
                </div>
            </div>

            <div class="footer-link">
                <a href="{{ url('/public/tracking') }}">Consultar otro trámite →</a>
            </div>
        </div>
    </div>

    <p class="security-note">
        Este resultado fue obtenido del sistema oficial. Verifique que el dominio del enlace sea el oficial antes de confiar en esta información.
    </p>
</div>
</body>
</html>
