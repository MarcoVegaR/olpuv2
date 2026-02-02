<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\Services\RequirementServiceInterface;
use App\Http\Requests\RequirementIndexRequest;
use App\Http\Requests\RequirementStoreRequest;
use App\Http\Requests\RequirementUpdateRequest;
use App\Models\Requirement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class RequirementController extends BaseIndexController
{
    use \App\Http\Controllers\Concerns\HandlesForm;

    private RequirementServiceInterface $serviceConcrete;

    public function __construct(RequirementServiceInterface $service)
    {
        parent::__construct($service);
        $this->serviceConcrete = $service;
    }

    protected function policyModel(): string
    {
        return \App\Models\Requirement::class;
    }

    protected function view(): string
    {
        return 'catalogs/requirement/index';
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
        $response->with('hasEditRoute', Route::has('catalogs.requirement.edit'));

        return $response;
    }

    protected function indexRequestClass(): string
    {
        return RequirementIndexRequest::class;
    }

    protected function indexRouteName(): string
    {
        return 'catalogs.requirement.index';
    }

    /**
     * Get route parameters for the model (override HandlesForm default to use snake param).
     *
     * @return array<string, mixed>
     */
    protected function getRouteParameters(Model $model): array
    {
        return ['requirement' => $model->getKey()];
    }

    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'json'];
    }

    protected function formView(string $mode): string
    {
        return 'catalogs/requirement/form';
    }

    protected function storeRequestClass(): string
    {
        return RequirementStoreRequest::class;
    }

    protected function updateRequestClass(): string
    {
        return RequirementUpdateRequest::class;
    }

    /**
     * Override export permission to match catalogs prefix (e.g., catalogs.tipo-documento.export).
     */
    protected function exportPermission(): string
    {
        return 'catalogs.requirement.export';
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
            'is_active' => null,
            'sort_order' => null,
        ];
    }

    public function show(Request $request, Requirement $requirement): \Inertia\Response
    {
        $this->authorize('view', $requirement);

        $data = [
            'item' => $this->service->toItem($requirement),
            'hasEditRoute' => true,
        ];

        return Inertia::render('catalogs/requirement/show', $data);
    }

    public function setActive(Request $request, Requirement $requirement): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('setActive', $requirement);
        $desired = (bool) $request->boolean('active');
        $requirement->setAttribute('is_active', $desired);
        $requirement->save();
        $actionText = $desired ? 'activado' : 'desactivado';

        return redirect()->route('catalogs.requirement.index')
            ->with('success', 'El registro ha sido '.$actionText.' correctamente.');
    }

    public function destroy(Requirement $requirement): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $requirement);
        $this->service->delete($requirement);

        return redirect()->route('catalogs.requirement.index')
            ->with('success', 'Registro eliminado correctamente.');
    }
}
