<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\Services\SolicitanteServiceInterface;
use App\Http\Requests\SetSolicitanteActiveRequest;
use App\Http\Requests\SolicitanteIndexRequest;
use App\Http\Requests\SolicitanteShowRequest;
use App\Http\Requests\SolicitanteStoreRequest;
use App\Http\Requests\SolicitanteUpdateRequest;
use App\Models\Solicitante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SolicitanteController extends BaseIndexController
{
    use \App\Http\Controllers\Concerns\HandlesForm;

    private SolicitanteServiceInterface $serviceConcrete;

    public function __construct(SolicitanteServiceInterface $service)
    {
        parent::__construct($service);
        $this->serviceConcrete = $service;
    }

    protected function policyModel(): string
    {
        return Solicitante::class;
    }

    protected function view(): string
    {
        return 'procedures/solicitantes/index';
    }

    protected function indexRequestClass(): string
    {
        return SolicitanteIndexRequest::class;
    }

    protected function indexRouteName(): string
    {
        return 'solicitantes.index';
    }

    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'json'];
    }

    protected function formView(string $mode): string
    {
        return 'procedures/solicitantes/form';
    }

    protected function storeRequestClass(): string
    {
        return SolicitanteStoreRequest::class;
    }

    protected function updateRequestClass(): string
    {
        return SolicitanteUpdateRequest::class;
    }

    /** @return array<string, mixed> */
    protected function getEmptyModel(): array
    {
        return [
            'tipo_documento' => null,
            'numero_documento' => null,
            'nombre_razon_social' => null,
            'telefono' => null,
            'email' => null,
            'direccion' => null,
            'is_active' => true,
        ];
    }

    public function index(Request $request): \Inertia\Response
    {
        $response = parent::index($request);
        $response->with('hasCreateRoute', Route::has('solicitantes.create'));
        $response->with('stats', [
            'total' => Solicitante::query()->count(),
            'active' => Solicitante::query()->where('is_active', true)->count(),
        ]);

        return $response;
    }

    public function show(Request $request, Solicitante $solicitante): \Inertia\Response
    {
        $this->authorize('view', $solicitante);

        $showRequest = SolicitanteShowRequest::createFrom($request);
        $showRequest->setContainer(app());
        $showRequest->setRedirector(app('redirect'));
        $showRequest->validateResolved();

        $query = $showRequest->toShowQuery();
        $data = $this->serviceConcrete->showById($solicitante->getKey(), $query);
        $data['hasEditRoute'] = Route::has('solicitantes.edit');

        return Inertia::render('procedures/solicitantes/show', $data);
    }

    public function setActive(SetSolicitanteActiveRequest $request, Solicitante $solicitante): RedirectResponse
    {
        $this->authorize('setActive', $solicitante);

        $desired = (bool) $request->boolean('active');
        $this->serviceConcrete->setActive($solicitante, $desired);

        $actionText = $desired ? 'activado' : 'desactivado';

        return redirect()->route('solicitantes.index')
            ->with('success', "El solicitante ha sido {$actionText} correctamente.");
    }

    public function destroy(Request $request, Solicitante $solicitante): RedirectResponse
    {
        $this->authorize('delete', $solicitante);

        $this->serviceConcrete->delete($solicitante);

        return redirect()->route('solicitantes.index')
            ->with('success', 'Solicitante eliminado correctamente.');
    }

    public function search(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Solicitante::class);

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'tipo_documento' => ['nullable', 'string', 'max:2'],
            'numero_documento' => ['nullable', 'string', 'max:30'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $q = trim((string) ($validated['q'] ?? ''));
        $tipo = isset($validated['tipo_documento']) ? strtoupper(trim((string) $validated['tipo_documento'])) : null;
        $num = isset($validated['numero_documento']) ? trim((string) $validated['numero_documento']) : null;
        $limit = (int) ($validated['limit'] ?? 20);

        $needle = $q !== '' ? Str::lower(Str::ascii($q)) : '';

        $preLimit = min(200, max($limit * 5, $limit));

        $rows = Solicitante::query()
            ->where('is_active', true)
            ->when($tipo, fn ($b) => $b->where('tipo_documento', $tipo))
            ->when($num, fn ($b) => $b->whereRaw('LOWER(numero_documento) LIKE ?', ['%'.strtolower($num).'%']))
            ->when($q !== '', function ($b) use ($q) {
                $qq = strtolower($q);
                $b->where(function ($x) use ($qq) {
                    $x->whereRaw('LOWER(nombre_razon_social) LIKE ?', ['%'.$qq.'%'])
                        ->orWhereRaw('LOWER(numero_documento) LIKE ?', ['%'.$qq.'%']);
                });
            })
            ->orderBy('nombre_razon_social')
            ->limit($preLimit)
            ->get(['id', 'tipo_documento', 'numero_documento', 'nombre_razon_social', 'telefono', 'email', 'direccion']);

        if ($needle !== '') {
            $rows = $rows
                ->filter(function (Solicitante $s) use ($needle): bool {
                    $name = Str::lower(Str::ascii((string) $s->getAttribute('nombre_razon_social')));
                    $doc = Str::lower(Str::ascii((string) $s->getAttribute('numero_documento')));

                    return str_contains($name, $needle) || str_contains($doc, $needle);
                })
                ->take($limit);
        } else {
            $rows = $rows->take($limit);
        }

        return response()->json([
            'data' => $rows->map(fn (Solicitante $s) => [
                'id' => (int) $s->getKey(),
                'tipo_documento' => (string) $s->getAttribute('tipo_documento'),
                'numero_documento' => (string) $s->getAttribute('numero_documento'),
                'nombre_razon_social' => (string) $s->getAttribute('nombre_razon_social'),
                'telefono' => $s->getAttribute('telefono'),
                'email' => $s->getAttribute('email'),
                'direccion' => $s->getAttribute('direccion'),
            ])->values(),
        ]);
    }
}
