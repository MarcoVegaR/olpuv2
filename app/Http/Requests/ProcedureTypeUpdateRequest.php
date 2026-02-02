<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class ProcedureTypeUpdateRequest extends BaseUpdateRequest
{
    /**
     * Validation rules for updating an existing record.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $current = $this->route('procedure_type');
        $currentId = is_object($current) ? ($current->id ?? null) : $current;

        return [
            // Generated from --fields
            // Example defaults — generator will replace with actual rules from --fields
            // 'code' => ['bail','required','string','max:50', Rule::unique('procedure_types','code')->ignore($currentId)],
            // 'name' => ['bail','required','string','max:120'],
            // 'is_active' => ['nullable','boolean'],
            // 'sort_order' => ['nullable','integer'],
            '_version' => ['nullable', 'string'],
            'code' => ['bail', 'required', 'string', 'max:50', Rule::unique('procedure_types', 'code')->ignore($currentId)],
            'name' => ['bail', 'required', 'string', 'max:255'],
            'description' => ['bail', 'nullable', 'string'],
            'workflow_requires_review_assignment' => ['bail', 'required', 'boolean'],
            'workflow_requires_inspector_assignment' => ['bail', 'required', 'boolean'],
            'workflow_requires_inspection' => ['bail', 'required', 'boolean'],
            'workflow_requires_technical_response' => ['bail', 'required', 'boolean'],
            'workflow_requires_decision' => ['bail', 'required', 'boolean'],
            'inspection_mode' => ['bail', 'required', 'string', Rule::in(['none', 'optional', 'required'])],
            'has_validity' => ['bail', 'required', 'boolean'],
            'validity_years' => ['bail', 'nullable', 'integer', 'min:1'],
            'validity_months' => ['bail', 'nullable', 'integer', 'min:1'],
            'is_active' => ['bail', 'required', 'boolean'],
            'sort_order' => ['bail', 'nullable', 'integer'],
        ];
    }

    /**
     * Normalize input before validation using BaseStoreRequest hook.
     *
     * @param  array<string, mixed>  &$data
     */
    protected function additionalPreparation(array &$data): void
    {
        // Common normalizations (generator expands these depending on --fields)
        // Uppercase code, trim strings, cast numbers/booleans
        if (isset($data['code']) && is_string($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }
        if (isset($data['code']) && is_string($data['code'])) {
            $data['code'] = trim($data['code']);
        }
        if (isset($data['name']) && is_string($data['name'])) {
            $data['name'] = trim($data['name']);
        }
        if (isset($data['description']) && is_string($data['description'])) {
            $data['description'] = trim($data['description']);
        }
        if (array_key_exists('workflow_requires_review_assignment', $data)) {
            $data['workflow_requires_review_assignment'] = (bool) $data['workflow_requires_review_assignment'];
        }
        if (array_key_exists('workflow_requires_inspector_assignment', $data)) {
            $data['workflow_requires_inspector_assignment'] = (bool) $data['workflow_requires_inspector_assignment'];
        }
        if (array_key_exists('workflow_requires_inspection', $data)) {
            $data['workflow_requires_inspection'] = (bool) $data['workflow_requires_inspection'];
        }
        if (array_key_exists('workflow_requires_technical_response', $data)) {
            $data['workflow_requires_technical_response'] = (bool) $data['workflow_requires_technical_response'];
        }
        if (array_key_exists('workflow_requires_decision', $data)) {
            $data['workflow_requires_decision'] = (bool) $data['workflow_requires_decision'];
        }
        if (isset($data['inspection_mode']) && is_string($data['inspection_mode'])) {
            $data['inspection_mode'] = strtolower(trim($data['inspection_mode']));
        }
        if (array_key_exists('has_validity', $data)) {
            $data['has_validity'] = (bool) $data['has_validity'];
        }
        if (array_key_exists('validity_years', $data)) {
            if (is_string($data['validity_years']) && trim($data['validity_years']) === '') {
                $data['validity_years'] = null;
            }
            $data['validity_years'] = is_null($data['validity_years']) ? null : (int) $data['validity_years'];
        }
        if (array_key_exists('validity_months', $data)) {
            if (is_string($data['validity_months']) && trim($data['validity_months']) === '') {
                $data['validity_months'] = null;
            }
            $data['validity_months'] = is_null($data['validity_months']) ? null : (int) $data['validity_months'];
        }
        if (array_key_exists('sort_order', $data)) {
            if (is_string($data['sort_order']) && trim($data['sort_order']) === '') {
                $data['sort_order'] = null;
            }
            $data['sort_order'] = is_null($data['sort_order']) ? null : (int) $data['sort_order'];
        }

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool) $data['is_active'];
        }
    }
}
