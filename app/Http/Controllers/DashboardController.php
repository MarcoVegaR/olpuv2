<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteEvent;
use App\Models\User;
use App\Services\ExpedienteWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * @return \Inertia\Response
     */
    public function __invoke(Request $request)
    {
        /** @var User $user */
        $user = $request->user();
        $now = Carbon::now();
        $canSeeAll = $user->can('expedientes.assign.reviewer') || $user->can('expedientes.create');
        $isReviewer = $user->can('expedientes.response.submit');
        $isInspector = $user->can('expedientes.inspection.submit');

        // ── Scoped base query (same logic as index) ──
        $scopedQuery = Expediente::query()->where('is_active', true);
        if (! $canSeeAll) {
            if ($isInspector) {
                $scopedQuery->where('inspector_id', $user->getKey());
            } elseif ($isReviewer) {
                $scopedQuery->where('reviewer_id', $user->getKey());
            }
        }

        // ── KPI Cards ──
        $totalActive = (clone $scopedQuery)->count();
        $receivedThisMonth = (clone $scopedQuery)
            ->where('received_at', '>=', $now->copy()->startOfMonth())
            ->count();
        $receivedLastMonth = (clone $scopedQuery)
            ->whereBetween('received_at', [
                $now->copy()->subMonth()->startOfMonth(),
                $now->copy()->subMonth()->endOfMonth(),
            ])
            ->count();

        // Pending action for current user
        $pendingAction = $this->pendingActionCount($user, $canSeeAll, $isReviewer, $isInspector);

        // Completed this month (only for roles that see all)
        $completedThisMonth = $canSeeAll
            ? Expediente::query()->where('is_active', true)
                ->whereIn('status', ['completed', 'rejected', 'partial'])
                ->where('decision_at', '>=', $now->copy()->startOfMonth())
                ->count()
            : null;

        // Average resolution days (last 90 days)
        $avgResolutionDays = $canSeeAll
            ? (float) Expediente::query()->where('is_active', true)
                ->whereNotNull('decision_at')
                ->whereNotNull('received_at')
                ->where('decision_at', '>=', $now->copy()->subDays(90))
                ->selectRaw('AVG(EXTRACT(EPOCH FROM (decision_at - received_at)) / 86400) as avg_days')
                ->value('avg_days')
            : null;

        // Approval rate (last 90 days)
        $decided90 = $canSeeAll
            ? Expediente::query()->where('is_active', true)
                ->whereNotNull('decision_at')
                ->where('decision_at', '>=', $now->copy()->subDays(90))
                ->count()
            : 0;
        $approved90 = $canSeeAll
            ? Expediente::query()->where('is_active', true)
                ->where('decision', 'approved')
                ->where('decision_at', '>=', $now->copy()->subDays(90))
                ->count()
            : 0;
        $approvalRate = $decided90 > 0 ? round(($approved90 / $decided90) * 100) : null;

        // Delayed expedientes (>15 days in current phase without advancing)
        $delayedCount = (clone $scopedQuery)
            ->whereNotIn('status', ['completed', 'rejected', 'partial', 'suspended', 'draft'])
            ->where(function ($q) use ($now) {
                $q->where(function ($q2) use ($now) {
                    $q2->whereNotNull('received_at')
                        ->where('received_at', '<', $now->copy()->subDays(15));
                });
            })
            ->where(function ($q) use ($now) {
                // No recent event in last 15 days
                $q->whereDoesntHave('events', function ($eq) use ($now) {
                    $eq->where('created_at', '>=', $now->copy()->subDays(15));
                });
            })
            ->count();

        $kpis = [
            'totalActive' => $totalActive,
            'receivedThisMonth' => $receivedThisMonth,
            'receivedLastMonth' => $receivedLastMonth,
            'pendingAction' => $pendingAction,
            'completedThisMonth' => $completedThisMonth,
            'avgResolutionDays' => $avgResolutionDays !== null ? round($avgResolutionDays, 1) : null,
            'approvalRate' => $approvalRate,
            'delayedCount' => $delayedCount,
        ];

        // ── Status distribution (donut) ──
        $statusLabels = ExpedienteWorkflowService::statusLabels();
        $statusDistribution = (clone $scopedQuery)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->map(fn ($count, $status) => [
                'status' => (string) $status,
                'label' => $statusLabels[(string) $status] ?? (string) $status,
                'count' => (int) $count,
            ])
            ->values()
            ->all();

        // ── Monthly trend (last 6 months) ──
        $monthlyTrend = [];
        for ($m = 5; $m >= 0; $m--) {
            $monthStart = $now->copy()->subMonths($m)->startOfMonth();
            $monthEnd = $now->copy()->subMonths($m)->endOfMonth();
            $label = $monthStart->translatedFormat('M Y');

            $received = Expediente::query()->where('is_active', true)
                ->whereBetween('received_at', [$monthStart, $monthEnd])
                ->count();
            $completed = Expediente::query()->where('is_active', true)
                ->whereNotNull('decision_at')
                ->whereBetween('decision_at', [$monthStart, $monthEnd])
                ->count();

            $monthlyTrend[] = [
                'month' => $label,
                'received' => $received,
                'completed' => $completed,
            ];
        }

        // ── By procedure type (top 10) ──
        /** @var array<int, array{id: int, name: string, count: int}> $byProcedureType */
        $byProcedureType = DB::table('expedientes')
            ->where('expedientes.is_active', true)
            ->join('procedure_types', 'expedientes.procedure_type_id', '=', 'procedure_types.id')
            ->select('procedure_types.id', 'procedure_types.name', DB::raw('COUNT(*) as count'))
            ->groupBy('procedure_types.id', 'procedure_types.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn (\stdClass $row) => [
                'id' => (int) $row->id,
                'name' => (string) $row->name,
                'count' => (int) $row->count,
            ])
            ->all();

        // ── Aging / SLA breakdown ──
        $agingData = $this->computeAging($scopedQuery, $now, $statusLabels);

        // ── Performance (reviewer / inspector) — directora/admin only ──
        $performance = $canSeeAll ? $this->computePerformance($now) : null;

        // ── Recent activity (last 15 events) ──
        $recentActivity = $this->recentActivity($user, $canSeeAll, $isReviewer, $isInspector);

        // ── Work queue (expedientes needing action from current user) ──
        $workQueue = $this->workQueue($user, $canSeeAll, $isReviewer, $isInspector, $statusLabels);

        return Inertia::render('dashboard', [
            'kpis' => $kpis,
            'statusDistribution' => $statusDistribution,
            'monthlyTrend' => $monthlyTrend,
            'byProcedureType' => $byProcedureType,
            'agingData' => $agingData,
            'performance' => $performance,
            'recentActivity' => $recentActivity,
            'workQueue' => $workQueue,
            'canSeeAll' => $canSeeAll,
        ]);
    }

    private function pendingActionCount(User $user, bool $canSeeAll, bool $isReviewer, bool $isInspector): int
    {
        if ($canSeeAll) {
            // For directora: pending_decision; for recepcionista: received (need to advance)
            if ($user->can('expedientes.decision.issue')) {
                return Expediente::query()->where('is_active', true)->where('status', 'pending_decision')->count();
            }

            return Expediente::query()->where('is_active', true)->where('status', 'received')->count();
        }

        if ($isReviewer) {
            return Expediente::query()->where('is_active', true)
                ->where('reviewer_id', $user->getKey())
                ->whereIn('status', ['pending_reviewer', 'pending_inspector', 'pending_response'])
                ->count();
        }

        if ($isInspector) {
            return Expediente::query()->where('is_active', true)
                ->where('inspector_id', $user->getKey())
                ->where('status', 'in_inspection')
                ->count();
        }

        return 0;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<Expediente>  $scopedQuery
     * @param  array<string, string>  $statusLabels
     * @return array<int, array<string, mixed>>
     */
    private function computeAging(mixed $scopedQuery, Carbon $now, array $statusLabels): array
    {
        $activeStatuses = ['received', 'pending_reviewer', 'pending_inspector', 'in_inspection', 'pending_response', 'pending_decision'];

        /** @var \Illuminate\Support\Collection<int, \stdClass> $rows */
        $rows = (clone $scopedQuery)
            ->whereIn('status', $activeStatuses)
            ->select('status', 'received_at', DB::raw('COUNT(*) as count'))
            ->groupBy('status', 'received_at')
            ->get();

        $buckets = [];
        foreach ($activeStatuses as $s) {
            $buckets[$s] = ['ok' => 0, 'warn' => 0, 'critical' => 0];
        }

        foreach ($rows as $row) {
            /** @var \stdClass $row */
            $status = (string) $row->status;
            $days = $row->received_at ? (int) $now->diffInDays(Carbon::parse($row->received_at)) : 0;
            $count = (int) $row->count;

            if ($days > 30) {
                $buckets[$status]['critical'] += $count;
            } elseif ($days > 15) {
                $buckets[$status]['warn'] += $count;
            } else {
                $buckets[$status]['ok'] += $count;
            }
        }

        $result = [];
        foreach ($buckets as $status => $counts) {
            if ($counts['ok'] + $counts['warn'] + $counts['critical'] === 0) {
                continue;
            }
            $result[] = [
                'status' => $status,
                'label' => $statusLabels[$status] ?? $status,
                'ok' => $counts['ok'],
                'warn' => $counts['warn'],
                'critical' => $counts['critical'],
            ];
        }

        return $result;
    }

    /**
     * @return array{reviewers: array<int, array<string, mixed>>, inspectors: array<int, array<string, mixed>>}
     */
    private function computePerformance(Carbon $now): array
    {
        $since = $now->copy()->subDays(90);

        // Reviewer performance: count of expedientes assigned, avg time reviewer_assigned_at → decision_at
        $reviewerStats = DB::table('expedientes')
            ->join('users', 'expedientes.reviewer_id', '=', 'users.id')
            ->whereNotNull('expedientes.reviewer_id')
            ->where('expedientes.is_active', true)
            ->where('expedientes.reviewer_assigned_at', '>=', $since)
            ->select(
                'users.id',
                'users.name',
                DB::raw('COUNT(*) as assigned'),
                DB::raw('SUM(CASE WHEN expedientes.status IN (\'completed\', \'rejected\', \'partial\') THEN 1 ELSE 0 END) as resolved'),
                DB::raw('AVG(CASE WHEN expedientes.decision_at IS NOT NULL THEN EXTRACT(EPOCH FROM (expedientes.decision_at - expedientes.reviewer_assigned_at)) / 86400 END) as avg_days')
            )
            ->groupBy('users.id', 'users.name')
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'name' => (string) $r->name,
                'assigned' => (int) $r->assigned,
                'resolved' => (int) $r->resolved,
                'avgDays' => $r->avg_days !== null ? round((float) $r->avg_days, 1) : null,
            ])
            ->all();

        // Inspector performance
        $inspectorStats = DB::table('expedientes')
            ->join('users', 'expedientes.inspector_id', '=', 'users.id')
            ->join('expediente_inspections', 'expediente_inspections.expediente_id', '=', 'expedientes.id')
            ->whereNotNull('expedientes.inspector_id')
            ->where('expedientes.is_active', true)
            ->where('expedientes.inspector_assigned_at', '>=', $since)
            ->select(
                'users.id',
                'users.name',
                DB::raw('COUNT(DISTINCT expedientes.id) as assigned'),
                DB::raw('COUNT(expediente_inspections.id) as inspections_done'),
                DB::raw('AVG(EXTRACT(EPOCH FROM (expediente_inspections.submitted_at - expedientes.inspector_assigned_at)) / 86400) as avg_days')
            )
            ->groupBy('users.id', 'users.name')
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'name' => (string) $r->name,
                'assigned' => (int) $r->assigned,
                'inspectionsDone' => (int) $r->inspections_done,
                'avgDays' => $r->avg_days !== null ? round((float) $r->avg_days, 1) : null,
            ])
            ->all();

        return ['reviewers' => $reviewerStats, 'inspectors' => $inspectorStats];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentActivity(User $user, bool $canSeeAll, bool $isReviewer, bool $isInspector): array
    {
        $query = ExpedienteEvent::query()
            ->with(['expediente:id,tracking,status'])
            ->orderByDesc('created_at')
            ->limit(15);

        if (! $canSeeAll) {
            $query->whereHas('expediente', function ($q) use ($user, $isReviewer, $isInspector) {
                if ($isInspector) {
                    $q->where('inspector_id', $user->getKey());
                } elseif ($isReviewer) {
                    $q->where('reviewer_id', $user->getKey());
                }
            });
        }

        return $query->get()->map(fn (ExpedienteEvent $e) => [
            'id' => (int) $e->getKey(),
            'type' => (string) $e->getAttribute('type'),
            'description' => (string) $e->getAttribute('description'),
            'actorName' => (string) $e->getAttribute('actor_name'),
            'tracking' => $e->expediente?->getAttribute('tracking'),
            'expedienteId' => $e->expediente?->getKey(),
            'createdAt' => $e->getAttribute('created_at')?->toIso8601String(),
        ])->all();
    }

    /**
     * @param  array<string, string>  $statusLabels
     * @return array<int, array<string, mixed>>
     */
    private function workQueue(User $user, bool $canSeeAll, bool $isReviewer, bool $isInspector, array $statusLabels): array
    {
        $query = Expediente::query()
            ->where('is_active', true)
            ->whereNotIn('status', ['completed', 'rejected', 'partial', 'suspended', 'draft'])
            ->with(['procedureType:id,name', 'solicitante:id,nombre_razon_social'])
            ->orderBy('received_at')
            ->limit(20);

        if ($canSeeAll) {
            if ($user->can('expedientes.decision.issue')) {
                $query->where('status', 'pending_decision');
            } else {
                $query->where('status', 'received');
            }
        } elseif ($isReviewer) {
            $query->where('reviewer_id', $user->getKey())
                ->whereIn('status', ['pending_reviewer', 'pending_inspector', 'pending_response']);
        } elseif ($isInspector) {
            $query->where('inspector_id', $user->getKey())
                ->where('status', 'in_inspection');
        }

        $now = Carbon::now();

        return $query->get()->map(function (Expediente $e) use ($statusLabels, $now) {
            $receivedAt = $e->getAttribute('received_at');
            $daysInPhase = $receivedAt ? (int) $now->diffInDays(Carbon::parse($receivedAt)) : 0;

            return [
                'id' => (int) $e->getKey(),
                'tracking' => (string) $e->getAttribute('tracking'),
                'status' => (string) $e->getAttribute('status'),
                'statusLabel' => $statusLabels[(string) $e->getAttribute('status')] ?? (string) $e->getAttribute('status'),
                'procedureType' => $e->procedureType?->getAttribute('name'),
                'solicitante' => $e->solicitante?->getAttribute('nombre_razon_social'),
                'receivedAt' => $receivedAt?->toIso8601String(),
                'daysInPhase' => $daysInPhase,
                'delayed' => $daysInPhase > 15,
            ];
        })->all();
    }
}
