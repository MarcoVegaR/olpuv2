<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\ProcedureTypeServiceInterface;
use App\Models\ProcedureType;
use Illuminate\Database\Eloquent\Model;

class ProcedureTypeService extends BaseService implements ProcedureTypeServiceInterface
{
    /**
     * Mapea un Model a array para 'rows'.
     * El generador reemplazará 'id' => $model->getAttribute('id'),
            'code' => $model->getAttribute('code'),
            'name' => $model->getAttribute('name'),
            'description' => $model->getAttribute('description'),
            'is_active' => (bool) ($model->getAttribute('is_active') ?? true),
            'sort_order' => $model->getAttribute('sort_order'),
            'created_at' => $model->getAttribute('created_at'),
            'updated_at' => $model->getAttribute('updated_at') con el shape correcto según --fields.
     *
     * @return array<string, mixed>
     */
    protected function toRow(Model $model): array
    {
        return [
            'id' => $model->getAttribute('id'),
            'code' => $model->getAttribute('code'),
            'name' => $model->getAttribute('name'),
            'description' => $model->getAttribute('description'),
            'workflow_requires_review_assignment' => (bool) ($model->getAttribute('workflow_requires_review_assignment') ?? false),
            'workflow_requires_inspector_assignment' => (bool) ($model->getAttribute('workflow_requires_inspector_assignment') ?? false),
            'workflow_requires_inspection' => (bool) ($model->getAttribute('workflow_requires_inspection') ?? false),
            'workflow_requires_technical_response' => (bool) ($model->getAttribute('workflow_requires_technical_response') ?? false),
            'workflow_requires_decision' => (bool) ($model->getAttribute('workflow_requires_decision') ?? false),
            'inspection_mode' => (string) ($model->getAttribute('inspection_mode') ?? 'none'),
            'has_validity' => (bool) ($model->getAttribute('has_validity') ?? false),
            'validity_years' => $model->getAttribute('validity_years'),
            'validity_months' => $model->getAttribute('validity_months'),
            'is_active' => (bool) ($model->getAttribute('is_active') ?? true),
            'sort_order' => $model->getAttribute('sort_order'),
            'created_at' => $model->getAttribute('created_at'),
            'updated_at' => $model->getAttribute('updated_at'),
        ];
    }

    public function toItem(Model $model): array
    {
        if (! $model instanceof ProcedureType) {
            return parent::toItem($model);
        }

        $procedureType = $model;

        $base = $this->toRow($procedureType);

        $requirements = $procedureType->requirements
            ->map(function (Model $requirement): array {
                return [
                    'id' => (int) $requirement->getAttribute('id'),
                    'code' => (string) $requirement->getAttribute('code'),
                    'name' => (string) $requirement->getAttribute('name'),
                    'description' => $requirement->getAttribute('description'),
                    'pivot' => [
                        'sort_order' => (int) ($requirement->pivot->sort_order ?? 0),
                        'is_required' => (bool) ($requirement->pivot->is_required ?? true),
                        'is_active' => (bool) ($requirement->pivot->is_active ?? true),
                    ],
                ];
            })
            ->values()
            ->toArray();

        $base['requirements'] = $requirements;
        $base['requirements_count'] = count($requirements);

        return $base;
    }

    /**
     * @param  array<int, array<string, mixed>>  $requirements
     */
    public function syncRequirements(ProcedureType $procedureType, array $requirements): void
    {
        $this->transaction(function () use ($procedureType, $requirements): void {
            $sync = [];
            foreach ($requirements as $row) {
                $requirementId = (int) ($row['requirement_id'] ?? 0);
                if ($requirementId <= 0) {
                    continue;
                }

                $sync[$requirementId] = [
                    'sort_order' => (int) ($row['sort_order'] ?? 0),
                    'is_required' => (bool) ($row['is_required'] ?? false),
                    'is_active' => (bool) ($row['is_active'] ?? true),
                ];
            }

            $procedureType->requirements()->sync($sync);
        });
    }

    /**
     * Columnas por defecto de exportación (cabeceras).
     * El generador reemplazará 'id' => '#',
            'code' => 'Código',
            'name' => 'Nombre',
            'description' => 'Description',
            'is_active' => 'Estado',
            'sort_order' => 'Orden',
            'created_at' => 'Creado'.
     *
     * @return array<string, string|int>
     */
    protected function defaultExportColumns(): array
    {
        return [
            'id' => '#',
            'code' => 'Código',
            'name' => 'Nombre',
            'description' => 'Description',
            'inspection_mode' => 'Inspección',
            'has_validity' => 'Vigencia',
            'validity_years' => 'Años de vigencia',
            'validity_months' => 'Meses de vigencia',
            'is_active' => 'Estado',
            'sort_order' => 'Orden',
            'created_at' => 'Creado',
        ];
    }

    /**
     * FQCN del modelo del repositorio (para filename de export, entre otros).
     */
    protected function repoModelClass(): string
    {
        return \App\Models\ProcedureType::class;
    }

    /**
     * Extra data for index view (stats, etc.).
     *
     * @return array<string, mixed>
     */
    public function getIndexExtras(): array
    {
        // Basic stats used by the Index page cards.
        $model = \App\Models\ProcedureType::query();
        $total = (int) $model->count();
        $active = (int) (clone $model)->where('is_active', true)->count();

        return [
            'stats' => [
                'total' => $total,
                'active' => $active,
            ],
        ];
    }
}
