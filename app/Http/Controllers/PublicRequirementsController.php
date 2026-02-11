<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ProcedureType;
use App\Models\Requirement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PublicRequirementsController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $types = ProcedureType::query()
            ->where('is_active', true)
            ->with([
                'requirements' => function ($q) {
                    $q->wherePivot('is_active', true)
                        ->where('requirements.is_active', true)
                        ->orderBy('procedure_type_requirements.sort_order');
                },
            ])
            ->orderByRaw('COALESCE(sort_order, 999999) asc')
            ->orderBy('name')
            ->get();

        $data = $types->map(function (ProcedureType $type): array {
            $requirements = $type->requirements
                ->map(function (Requirement $r): array {
                    $pivot = $r->getAttribute('pivot');

                    return [
                        'id' => (int) $r->getAttribute('id'),
                        'code' => (string) $r->getAttribute('code'),
                        'name' => (string) $r->getAttribute('name'),
                        'description' => $r->getAttribute('description'),
                        'is_required' => (bool) data_get($pivot, 'is_required', true),
                        'sort_order' => (int) data_get($pivot, 'sort_order', 0),
                    ];
                })
                ->values()
                ->toArray();

            return [
                'id' => (int) $type->getAttribute('id'),
                'code' => (string) $type->getAttribute('code'),
                'name' => (string) $type->getAttribute('name'),
                'description' => $type->getAttribute('description'),
                'requirements' => $requirements,
            ];
        })->values();

        return Inertia::render('public/requirements', [
            'procedureTypes' => $data,
        ]);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $normalized = strtoupper(trim($code));

        $type = ProcedureType::query()
            ->where('code', $normalized)
            ->where('is_active', true)
            ->with([
                'requirements' => function ($q) {
                    $q->wherePivot('is_active', true)
                        ->where('requirements.is_active', true)
                        ->orderBy('procedure_type_requirements.sort_order');
                },
            ])
            ->first();

        if (! $type) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $requirements = $type->requirements
            ->map(function (Requirement $r): array {
                $pivot = $r->getAttribute('pivot');

                return [
                    'id' => (int) $r->getAttribute('id'),
                    'code' => (string) $r->getAttribute('code'),
                    'name' => (string) $r->getAttribute('name'),
                    'description' => $r->getAttribute('description'),
                    'is_required' => (bool) data_get($pivot, 'is_required', true),
                    'sort_order' => (int) data_get($pivot, 'sort_order', 0),
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'id' => (int) $type->getAttribute('id'),
                'code' => (string) $type->getAttribute('code'),
                'name' => (string) $type->getAttribute('name'),
                'description' => $type->getAttribute('description'),
                'requirements' => $requirements,
            ],
        ]);
    }
}
