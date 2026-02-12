<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\Services\ExpedienteServiceInterface;
use App\DTO\ShowQuery;
use App\Exceptions\DomainActionException;
use App\Http\Requests\ExpedienteIndexRequest;
use App\Http\Requests\ExpedienteShowRequest;
use App\Http\Requests\ExpedienteStoreRequest;
use App\Models\Expediente;
use App\Models\ExpedienteEvent;
use App\Models\ExpedienteInspectionFile;
use App\Models\ExpedienteRequirement;
use App\Models\ExpedienteRequirementFile;
use App\Models\ProcedureType;
use App\Models\User;
use App\Services\ExpedienteWorkflowService;
use BaconQrCode\Renderer\GDLibRenderer;
use BaconQrCode\Writer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ExpedienteController extends BaseIndexController
{
    private ExpedienteServiceInterface $serviceConcrete;

    private ExpedienteWorkflowService $workflow;

    public function __construct(ExpedienteServiceInterface $service, ExpedienteWorkflowService $workflow)
    {
        parent::__construct($service);
        $this->serviceConcrete = $service;
        $this->workflow = $workflow;
    }

    protected function policyModel(): string
    {
        return Expediente::class;
    }

    protected function view(): string
    {
        return 'procedures/expedientes/index';
    }

    protected function indexRequestClass(): string
    {
        return ExpedienteIndexRequest::class;
    }

    protected function indexRouteName(): string
    {
        return 'expedientes.index';
    }

    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'json'];
    }

    /** @return array<string> */
    protected function with(): array
    {
        return ['procedureType', 'solicitante', 'reviewer', 'inspector'];
    }

    public function index(Request $request): \Inertia\Response
    {
        // ── Role-based visibility scoping ──
        $user = $request->user();
        if ($user && ! $user->can('expedientes.assign.reviewer') && ! $user->can('expedientes.create')) {
            $filters = (array) $request->input('filters', []);
            if ($user->can('expedientes.inspection.submit')) {
                $filters['inspector_id'] = $user->getKey();
            } elseif ($user->can('expedientes.response.submit')) {
                $filters['reviewer_id'] = $user->getKey();
            }
            $request->merge(['filters' => $filters]);
        }

        $response = parent::index($request);
        $response->with('hasCreateRoute', Route::has('expedientes.create'));
        $response->with('stats', [
            'total' => Expediente::query()->count(),
            'received' => Expediente::query()->where('status', 'received')->count(),
        ]);

        $response->with('procedureTypes', ProcedureType::query()
            ->where('is_active', true)
            ->orderByRaw('COALESCE(sort_order, 999999) asc')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (ProcedureType $t) => [
                'id' => (int) $t->getKey(),
                'name' => (string) $t->getAttribute('name'),
            ])
            ->values()
        );

        return $response;
    }

    public function create(): \Inertia\Response
    {
        $this->authorize('create', Expediente::class);

        $procedureTypes = ProcedureType::query()
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

        $procedureTypesData = $procedureTypes->map(function (ProcedureType $t): array {
            return [
                'id' => (int) $t->getAttribute('id'),
                'code' => (string) $t->getAttribute('code'),
                'name' => (string) $t->getAttribute('name'),
                'description' => $t->getAttribute('description'),
                'requirements' => $t->requirements->map(function ($r): array {
                    $pivot = $r->getAttribute('pivot');

                    return [
                        'id' => (int) $r->getAttribute('id'),
                        'code' => (string) $r->getAttribute('code'),
                        'name' => (string) $r->getAttribute('name'),
                        'description' => $r->getAttribute('description'),
                        'is_required' => (bool) data_get($pivot, 'is_required', true),
                        'sort_order' => (int) data_get($pivot, 'sort_order', 0),
                    ];
                })->values(),
            ];
        })->values();

        return Inertia::render('procedures/expedientes/create', [
            'procedureTypes' => $procedureTypesData,
        ]);
    }

    public function store(ExpedienteStoreRequest $request): RedirectResponse
    {
        $this->authorize('create', Expediente::class);

        $validated = $request->validated();
        $confirm = (bool) $request->boolean('confirm');

        try {
            $expediente = $this->serviceConcrete->createReception($validated, $request->user(), $confirm);
        } catch (DomainActionException $e) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'physical_received_requirement_ids' => $e->getMessage(),
            ]);
        }

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Expediente creado correctamente.');
    }

    public function update(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('update', $expediente);

        $validated = $request->validate([
            'solicitante_id' => ['required', 'integer', 'exists:solicitantes,id'],
            'numero_receptoria' => ['nullable', 'string', 'max:100'],
            'codigo_catastral' => ['nullable', 'string', 'max:100'],
            'observaciones' => ['nullable', 'string', 'max:5000'],
        ]);

        $expediente->update($validated);

        ExpedienteEvent::query()->create([
            'expediente_id' => $expediente->getKey(),
            'type' => 'expediente_updated',
            'description' => 'Datos del expediente actualizados',
            'actor_id' => $request->user()?->getKey(),
            'actor_name' => $request->user()?->getAttribute('name'),
        ]);

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Expediente actualizado correctamente.');
    }

    public function show(Request $request, Expediente $expediente): \Inertia\Response
    {
        $this->authorize('view', $expediente);

        $showRequest = ExpedienteShowRequest::createFrom($request);
        $showRequest->setContainer(app());
        $showRequest->setRedirector(app('redirect'));
        $showRequest->validateResolved();

        $query = $showRequest->toShowQuery();

        if (! $query->hasRelations()) {
            $query = ShowQuery::fromArray([
                'with' => [
                    'procedureType',
                    'solicitante',
                    'requirements',
                    'requirements.requirement',
                    'requirements.currentFile',
                    'events',
                    'latestInspection.files',
                    'latestResponse',
                    'decisionFiles',
                    'reviewer',
                    'inspector',
                    'decisionUser',
                ],
            ]);
        }
        $data = $this->serviceConcrete->showById($expediente->getKey(), $query);
        $data['hasEditRoute'] = $request->user()?->can('update', $expediente) ?? false;

        $data['statusLabels'] = ExpedienteWorkflowService::statusLabels();
        $data['returnablePhases'] = $this->workflow->returnablePhases($expediente);

        $data['assignableReviewers'] = $this->getAssignableUsers('expedientes.response.submit');
        $data['assignableInspectors'] = $this->getAssignableUsers('expedientes.inspection.submit');

        // Phase validation warnings for the current status
        $status = (string) $expediente->getAttribute('status');
        $actionForStatus = match ($status) {
            'draft' => 'confirm',
            'in_inspection' => 'submitInspection',
            'pending_decision' => 'issueDecision',
            default => null,
        };
        $data['phaseWarnings'] = $actionForStatus
            ? $this->workflow->validatePreConditions($expediente, $actionForStatus)
            : [];

        return Inertia::render('procedures/expedientes/show', $data);
    }

    public function planilla(Request $request, Expediente $expediente): Response
    {
        $this->authorize('view', $expediente);

        $expediente->load([
            'procedureType',
            'solicitante',
            'requirements.requirement',
            'reviewer',
            'inspector',
        ]);

        $url = url('/public/verify/'.$expediente->getAttribute('qr_token'));
        $renderer = new GDLibRenderer(200, 4, 'png', 9);
        $writer = new Writer($renderer);
        $qrBase64 = base64_encode($writer->writeString($url));

        $statusLabels = ExpedienteWorkflowService::statusLabels();

        return response()->view('expedientes.planilla', [
            'expediente' => $expediente,
            'qrBase64' => $qrBase64,
            'statusLabels' => $statusLabels,
        ]);
    }

    public function downloadQr(Request $request, Expediente $expediente): Response
    {
        $this->authorize('qrDownload', $expediente);

        $url = url('/public/verify/'.$expediente->getAttribute('qr_token'));

        $renderer = new GDLibRenderer(512, 8, 'png', 9);
        $writer = new Writer($renderer);
        $png = $writer->writeString($url);

        $filename = 'QR-'.$expediente->getAttribute('tracking').'.png';

        return response($png, 200, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function setActive(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('setActive', $expediente);

        $validated = $request->validate([
            'active' => ['required', 'boolean'],
        ]);

        $desired = (bool) $validated['active'];
        $this->serviceConcrete->setActive($expediente, $desired);

        $actionText = $desired ? 'activado' : 'desactivado';

        return redirect()->route('expedientes.index')
            ->with('success', "El expediente ha sido {$actionText} correctamente.");
    }

    public function setPhysicalReceived(Request $request, Expediente $expediente, ExpedienteRequirement $expediente_requirement): RedirectResponse
    {
        $this->authorize('receive', $expediente);

        if ((int) $expediente_requirement->getAttribute('expediente_id') !== (int) $expediente->getKey()) {
            abort(404);
        }

        $validated = $request->validate([
            'received' => ['required', 'boolean'],
        ]);

        $received = (bool) $validated['received'];
        $this->serviceConcrete->setPhysicalReceived($expediente_requirement, $received, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Checklist actualizado correctamente.');
    }

    public function uploadRequirementFile(Request $request, Expediente $expediente, ExpedienteRequirement $expediente_requirement): RedirectResponse
    {
        if ((int) $expediente_requirement->getAttribute('expediente_id') !== (int) $expediente->getKey()) {
            abort(404);
        }

        $expediente_requirement->loadMissing('currentFile');
        $hasCurrent = $expediente_requirement->currentFile !== null;

        $this->authorize($hasCurrent ? 'filesReplace' : 'filesUpload', $expediente);

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $request->file('file');

        $this->serviceConcrete->uploadRequirementFile($expediente_requirement, $file, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Archivo cargado correctamente.');
    }

    public function downloadRequirementFile(Request $request, Expediente $expediente, ExpedienteRequirementFile $expediente_requirement_file): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('filesView', $expediente);

        $expedienteRequirement = $expediente_requirement_file->expedienteRequirement;
        if (! $expedienteRequirement || (int) $expedienteRequirement->getAttribute('expediente_id') !== (int) $expediente->getKey()) {
            abort(404);
        }

        $disk = (string) $expediente_requirement_file->getAttribute('disk');
        $path = (string) $expediente_requirement_file->getAttribute('path');
        $name = (string) $expediente_requirement_file->getAttribute('original_name');

        if ($request->boolean('inline')) {
            return Storage::disk($disk)->response($path, $name, [
                'Content-Disposition' => 'inline; filename="'.$name.'"',
            ]);
        }

        return Storage::disk($disk)->download($path, $name);
    }

    public function downloadInspectionFile(Request $request, Expediente $expediente, ExpedienteInspectionFile $file): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('filesView', $expediente);

        $inspection = $file->inspection;
        if (! $inspection || (int) $inspection->getAttribute('expediente_id') !== (int) $expediente->getKey()) {
            abort(404);
        }

        $disk = (string) $file->getAttribute('disk');
        $path = (string) $file->getAttribute('path');
        $name = (string) $file->getAttribute('original_name');

        if ($request->boolean('inline')) {
            return Storage::disk($disk)->response($path, $name, [
                'Content-Disposition' => 'inline; filename="'.$name.'"',
            ]);
        }

        return Storage::disk($disk)->download($path, $name);
    }

    public function deleteRequirementFile(Request $request, Expediente $expediente, ExpedienteRequirementFile $expediente_requirement_file): RedirectResponse
    {
        $this->authorize('filesDelete', $expediente);

        $expedienteRequirement = $expediente_requirement_file->expedienteRequirement;
        if (! $expedienteRequirement || (int) $expedienteRequirement->getAttribute('expediente_id') !== (int) $expediente->getKey()) {
            abort(404);
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $this->serviceConcrete->deleteRequirementFile($expediente_requirement_file, $request->user(), $validated['reason'] ?? null);

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Archivo eliminado correctamente.');
    }

    // ──────────────────────────────────────────────
    // Workflow actions
    // ──────────────────────────────────────────────

    public function assignReviewer(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('assignReviewer', $expediente);

        $validated = $request->validate([
            'reviewer_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $reviewer = User::query()->findOrFail($validated['reviewer_id']);
        $this->workflow->assignReviewer($expediente, $reviewer, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Revisor asignado correctamente.');
    }

    public function assignInspector(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('assignInspector', $expediente);

        $validated = $request->validate([
            'inspector_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $inspector = User::query()->findOrFail($validated['inspector_id']);
        $this->workflow->assignInspector($expediente, $inspector, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Inspector asignado correctamente.');
    }

    public function startInspection(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('submitInspection', $expediente);

        $this->workflow->startInspection($expediente, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Inspección iniciada.');
    }

    public function submitInspection(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('submitInspection', $expediente);

        $validated = $request->validate([
            'observations' => ['required', 'string', 'max:5000'],
            'result' => ['required', 'string', 'in:favorable,unfavorable,with_observations'],
            'inspected_at' => ['required', 'date'],
            'photos' => ['nullable', 'array', 'max:20'],
            'photos.*' => ['file', 'image', 'mimetypes:image/jpeg,image/png,image/webp', 'max:10240'],
            'reports' => ['nullable', 'array', 'max:5'],
            'reports.*' => ['file', 'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'max:10240'],
        ]);

        /** @var array<\Illuminate\Http\UploadedFile> $photos */
        $photos = $request->file('photos') ?? [];
        /** @var array<\Illuminate\Http\UploadedFile> $reports */
        $reports = $request->file('reports') ?? [];

        $this->workflow->submitInspection($expediente, $validated, $photos, $reports, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Inspección registrada correctamente.');
    }

    public function submitResponse(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('submitResponse', $expediente);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:10000'],
        ]);

        $this->workflow->submitResponse($expediente, $validated['content'], $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Respuesta técnica enviada.');
    }

    public function issueDecision(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('issueDecision', $expediente);

        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:approved,rejected,partial,suspended'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'files' => ['nullable', 'array', 'max:5'],
            'files.*' => ['file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        /** @var array<\Illuminate\Http\UploadedFile> $files */
        $files = $request->file('files') ?? [];

        $this->workflow->issueDecision($expediente, $validated, $files, $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Decisión emitida correctamente.');
    }

    public function returnToPhase(Request $request, Expediente $expediente): RedirectResponse
    {
        $this->authorize('returnToPhase', $expediente);

        $validated = $request->validate([
            'target_status' => ['required', 'string'],
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->workflow->returnToPhase($expediente, $validated['target_status'], $validated['reason'], $request->user());

        return redirect()->route('expedientes.show', $expediente->getKey())
            ->with('success', 'Expediente devuelto correctamente.');
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /** @return array<int, array{id: int, name: string}> */
    private function getAssignableUsers(string $permission): array
    {
        return User::query()
            ->permission($permission)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => [
                'id' => (int) $u->getKey(),
                'name' => (string) $u->getAttribute('name'),
            ])
            ->values()
            ->toArray();
    }
}
