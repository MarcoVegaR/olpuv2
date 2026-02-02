<?php

namespace Database\Seeders;

use App\Models\ProcedureType;
use App\Models\Requirement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TramitesCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $legacyProcedure = ProcedureType::query()->where('code', 'CC-001')->first();
        if ($legacyProcedure) {
            if (! ProcedureType::query()->where('code', 'PR-022')->exists()) {
                $legacyProcedure->code = 'PR-022';
                $legacyProcedure->save();
            } else {
                $legacyProcedure->requirements()->detach();
                $legacyProcedure->delete();
            }
        }

        $legacyRequirement = Requirement::query()->where('code', 'CI')->first();
        if ($legacyRequirement) {
            $legacyRequirement->procedureTypes()->detach();
            $legacyRequirement->delete();
        }

        $path = base_path('notes/fases/fase-1-catalogo-tramites.md');
        if (! is_file($path)) {
            return;
        }

        $text = (string) file_get_contents($path);
        if ($text === '') {
            return;
        }

        $block = $text;
        if (preg_match('/## 10\\. Trámites y recaudos \(lista inicial\)(.*?)(?:\\n---\\n\\n## 11\\.|\\z)/s', $text, $m)) {
            $block = (string) $m[1];
        }

        $lines = preg_split('/\\r?\\n/', $block) ?: [];
        $catalog = [];
        $current = null;

        foreach ($lines as $line) {
            if (preg_match('/^###\\s+(.+?)\\s*$/', $line, $h)) {
                if (is_array($current)) {
                    $catalog[] = $current;
                }
                $current = [
                    'name' => trim($h[1]),
                    'meta' => null,
                    'requirements' => [],
                ];

                continue;
            }

            if (! is_array($current)) {
                continue;
            }

            if ($current['meta'] === null && str_contains($line, 'recaudos requeridos')) {
                $current['meta'] = trim($line);

                continue;
            }

            $trimmed = ltrim($line);
            if (str_starts_with($trimmed, '- ')) {
                $req = trim(substr($trimmed, 2));
                if ($req !== '') {
                    $current['requirements'][] = preg_replace('/\\s+/', ' ', $req);
                }
            }
        }

        if (is_array($current)) {
            $catalog[] = $current;
        }

        $catalog = array_values(array_filter($catalog, fn ($it) => ! empty($it['name'])
            && ! empty($it['requirements'])
        ));

        $requirementsByCode = [];
        $typeOrder = 10;
        $requirementOrder = 10;

        foreach ($catalog as $procedureIndex => $it) {
            $name = (string) $it['name'];
            $meta = (string) ($it['meta'] ?? '');

            $code = 'PR-'.str_pad((string) ($procedureIndex + 1), 3, '0', STR_PAD_LEFT);
            $inspectionMode = $this->parseInspectionMode($meta);
            [$hasValidity, $validityYears, $validityMonths] = $this->parseValidity($meta);

            $procedureType = ProcedureType::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'description' => $meta !== '' ? $meta : null,
                    'inspection_mode' => $inspectionMode,
                    'has_validity' => $hasValidity,
                    'validity_years' => $validityYears,
                    'validity_months' => $validityMonths,
                    'workflow_requires_review_assignment' => true,
                    'workflow_requires_inspector_assignment' => $inspectionMode !== 'none',
                    'workflow_requires_inspection' => $inspectionMode === 'required',
                    'workflow_requires_technical_response' => true,
                    'workflow_requires_decision' => true,
                    'is_active' => true,
                    'sort_order' => $typeOrder,
                ]
            );

            $typeOrder += 10;

            $sync = [];
            $reqOrder = 10;
            foreach ($it['requirements'] as $reqText) {
                $reqText = (string) $reqText;
                $reqCode = 'REQ-'.strtoupper(substr(md5($reqText), 0, 8));

                if (! isset($requirementsByCode[$reqCode])) {
                    $requirementsByCode[$reqCode] = Requirement::updateOrCreate(
                        ['code' => $reqCode],
                        [
                            'name' => $reqText,
                            'description' => null,
                            'is_active' => true,
                            'sort_order' => $requirementOrder,
                        ]
                    );

                    $requirementOrder += 10;
                }

                $requirement = $requirementsByCode[$reqCode];
                $sync[$requirement->getKey()] = [
                    'sort_order' => $reqOrder,
                    'is_required' => true,
                    'is_active' => true,
                ];
                $reqOrder += 10;
            }

            $procedureType->requirements()->sync($sync);
        }
    }

    private function parseInspectionMode(string $meta): string
    {
        if (! preg_match('/Inspección:\\s*([^|]+)/u', $meta, $m)) {
            return 'none';
        }

        $raw = trim((string) $m[1]);
        $rawLower = Str::lower($raw);

        if (str_contains($rawLower, 'opcional')) {
            return 'optional';
        }

        if (str_contains($rawLower, 'sí') || str_contains($rawLower, 'si')) {
            return 'required';
        }

        if (str_contains($rawLower, 'no')) {
            return 'none';
        }

        return 'none';
    }

    /**
     * @return array{0:bool,1:int|null,2:int|null}
     */
    private function parseValidity(string $meta): array
    {
        if (! preg_match('/Vigencia:\\s*([^|]+)/u', $meta, $m)) {
            return [false, null, null];
        }

        $raw = trim((string) $m[1]);
        $rawLower = Str::lower($raw);

        $years = null;
        $months = null;

        if (preg_match('/(\\d+)\\s*año/u', $rawLower, $y)) {
            $years = (int) $y[1];
        }

        if (preg_match('/(\\d+)\\s*mes/u', $rawLower, $mo)) {
            $months = (int) $mo[1];
        }

        if (str_contains($rawLower, ' o ')) {
            return [true, null, null];
        }

        return [true, $years, $months];
    }
}
