<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Services\ExpedienteWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PublicExpedienteVerificationController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $normalized = trim($token);

        $expediente = Expediente::query()
            ->where('qr_token', $normalized)
            ->with(['procedureType:id,code,name', 'solicitante:id,tipo_documento,numero_documento,nombre_razon_social'])
            ->first();

        if (! $expediente) {
            abort(404);
        }

        return response()->view('public.verify', [
            'expediente' => $expediente,
            'mode' => 'qr',
        ]);
    }

    public function tracking(Request $request, string $tracking): Response|JsonResponse
    {
        $normalized = strtoupper(trim($tracking));

        $expediente = Expediente::query()
            ->where('tracking', $normalized)
            ->with([
                'procedureType:id,code,name',
                'solicitante:id,tipo_documento,numero_documento,nombre_razon_social',
                'events' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                },
            ])
            ->first();

        if (! $expediente) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Not Found'], 404);
            }
            abort(404);
        }

        if ($request->wantsJson()) {
            $statusLabels = ExpedienteWorkflowService::statusLabels();
            $status = (string) $expediente->getAttribute('status');

            $terminalStatuses = ['completed', 'rejected', 'partial', 'suspended'];
            $publicStatus = in_array($status, $terminalStatuses, true) ? 'completed' : $status;
            $publicLabel = in_array($status, $terminalStatuses, true) ? 'Completado' : ($statusLabels[$status] ?? $status);

            return response()->json([
                'data' => [
                    'tracking' => (string) $expediente->getAttribute('tracking'),
                    'status' => $publicStatus,
                    'statusLabel' => $publicLabel,
                    'procedureType' => $expediente->procedureType?->getAttribute('name') ?? '—',
                    'solicitante' => $expediente->solicitante?->getAttribute('nombre_razon_social') ?? '—',
                    'documento' => ($expediente->solicitante?->getAttribute('tipo_documento') ?? '—').'-'.($expediente->solicitante?->getAttribute('numero_documento') ?? ''),
                    'receivedAt' => optional($expediente->getAttribute('received_at') ?? $expediente->getAttribute('created_at'))->format('d/m/Y H:i'),
                    'completedAt' => optional($expediente->getAttribute('completed_at'))?->format('d/m/Y H:i'),
                    'events' => $expediente->events
                        ->filter(fn ($event) => $event->getAttribute('type') !== 'decision_issued')
                        ->map(function ($event) {
                            return [
                                'id' => $event->getKey(),
                                'type' => (string) $event->getAttribute('type'),
                                'description' => (string) $event->getAttribute('description'),
                                'createdAt' => optional($event->getAttribute('created_at'))->format('d/m/Y H:i'),
                            ];
                        })->values(),
                ],
            ]);
        }

        return response()->view('public.verify', [
            'expediente' => $expediente,
            'mode' => 'tracking',
        ]);
    }
}
