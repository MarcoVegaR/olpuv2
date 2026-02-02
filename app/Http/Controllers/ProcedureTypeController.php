<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\Services\ProcedureTypeServiceInterface;
use App\Http\Requests\ProcedureTypeIndexRequest;
use App\Http\Requests\ProcedureTypeStoreRequest;
use App\Http\Requests\ProcedureTypeUpdateRequest;
use App\Models\ProcedureType;
use App\Models\Requirement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class ProcedureTypeController extends BaseIndexController
{
    use \App\Http\Controllers\Concerns\HandlesForm;

    private ProcedureTypeServiceInterface $serviceConcrete;

    public function __construct(ProcedureTypeServiceInterface $service)
    {
        parent::__construct($service);
        $this->serviceConcrete = $service;
    }

    protected function policyModel(): string
    {
        return \App\Models\ProcedureType::class;
    }

    protected function view(): string
    {
        return 'catalogs/procedure-type/index';
    }

    /**
     * Display a listing of the resource with extras injected.
     */
    public function index(Request $request): \Inertia\Response
    {
        $response = parent::index($request);

        // Inject stats (and other extras) from service
        $extras = $this->serviceConcrete->getIndexExtras();
        if (isset($extras['stats'])) {
            $response->with('stats', $extras['stats']);
        }

        // Expose whether the edit route exists so the UI can hide Edit buttons if missing
        $response->with('hasEditRoute', Route::has('catalogs.procedure-type.edit'));

        return $response;
    }

    protected function indexRequestClass(): string
    {
        return ProcedureTypeIndexRequest::class;
    }

    protected function indexRouteName(): string
    {
        return 'catalogs.procedure-type.index';
    }

    /**
     * Get route parameters for the model (override HandlesForm default to use snake param).
     *
     * @return array<string, mixed>
     */
    protected function getRouteParameters(Model $model): array
    {
        return ['procedure_type' => $model->getKey()];
    }

    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'json'];
    }

    protected function formView(string $mode): string
    {
        return 'catalogs/procedure-type/form';
    }

    /**
     * @return array<string, mixed>
     */
    protected function formOptions(): array
    {
        $requirementsCatalog = Requirement::query()
            ->orderByRaw('COALESCE(sort_order, 999999) asc')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'description', 'is_active'])
            ->map(fn (Requirement $r) => [
                'id' => (int) $r->getAttribute('id'),
                'code' => (string) $r->getAttribute('code'),
                'name' => (string) $r->getAttribute('name'),
                'description' => $r->getAttribute('description'),
                'is_active' => (bool) ($r->getAttribute('is_active') ?? true),
            ])
            ->values()
            ->toArray();

        return [
            'requirementsCatalog' => $requirementsCatalog,
        ];
    }

    protected function storeRequestClass(): string
    {
        return ProcedureTypeStoreRequest::class;
    }

    protected function updateRequestClass(): string
    {
        return ProcedureTypeUpdateRequest::class;
    }

    /**
     * Override export permission to match catalogs prefix (e.g., catalogs.tipo-documento.export).
     */
    protected function exportPermission(): string
    {
        return 'catalogs.procedure-type.export';
    }

    /**
     * @return array<string, mixed>
     */
    protected function getEmptyModel(): array
    {
        return [
            'code' => null,
            'name' => null,
            'description' => null,
            'workflow_requires_review_assignment' => false,
            'workflow_requires_inspector_assignment' => false,
            'workflow_requires_inspection' => false,
            'workflow_requires_technical_response' => false,
            'workflow_requires_decision' => false,
            'inspection_mode' => 'none',
            'has_validity' => false,
            'validity_years' => null,
            'validity_months' => null,
            'is_active' => null,
            'sort_order' => null,
        ];
    }

    public function show(Request $request, ProcedureType $procedure_type): \Inertia\Response
    {
        $this->authorize('view', $procedure_type);

        $procedure_type->load('requirements');

        $requirementsCatalog = Requirement::query()
            ->orderByRaw('COALESCE(sort_order, 999999) asc')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'description', 'is_active'])
            ->map(fn (Requirement $r) => [
                'id' => (int) $r->getAttribute('id'),
                'code' => (string) $r->getAttribute('code'),
                'name' => (string) $r->getAttribute('name'),
                'description' => $r->getAttribute('description'),
                'is_active' => (bool) ($r->getAttribute('is_active') ?? true),
            ])
            ->values()
            ->toArray();

        $data = [
            'item' => $this->service->toItem($procedure_type),
            'hasEditRoute' => true,
            'requirementsCatalog' => $requirementsCatalog,
        ];

        return Inertia::render('catalogs/procedure-type/show', $data);
    }

    public function syncRequirements(Request $request, ProcedureType $procedure_type): RedirectResponse
    {
        $this->authorize('update', $procedure_type);

        $validated = $request->validate([
            'requirements' => ['required', 'array'],
            'requirements.*.requirement_id' => ['required', 'integer', 'exists:requirements,id'],
            'requirements.*.sort_order' => ['required', 'integer', 'min:0'],
            'requirements.*.is_required' => ['required', 'boolean'],
            'requirements.*.is_active' => ['required', 'boolean'],
        ]);

        $this->serviceConcrete->syncRequirements($procedure_type, $validated['requirements']);

        return redirect()->route('catalogs.procedure-type.show', $procedure_type->getKey())
            ->with('success', 'Requisitos actualizados correctamente.');
    }

    public function setActive(Request $request, ProcedureType $procedure_type): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('setActive', $procedure_type);
        $desired = (bool) $request->boolean('active');
        $procedure_type->setAttribute('is_active', $desired);
        $procedure_type->save();
        $actionText = $desired ? 'activado' : 'desactivado';

        return redirect()->route('catalogs.procedure-type.index')
            ->with('success', 'El registro ha sido '.$actionText.' correctamente.');
    }

    public function destroy(ProcedureType $procedure_type): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $procedure_type);
        $this->service->delete($procedure_type);

        return redirect()->route('catalogs.procedure-type.index')
            ->with('success', 'Registro eliminado correctamente.');
    }
}
