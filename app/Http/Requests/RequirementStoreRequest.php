<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class RequirementStoreRequest extends BaseStoreRequest
{
    /**
     * Authorize the request using policies.
     */
    public function authorize(): bool
    {
        return (bool) ($this->user()?->can('create', \App\Models\Requirement::class));
    }

    /**
     * Validation rules for creating a new record.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Generated from --fields
            // Example defaults — generator will replace with actual rules from --fields
            // 'code' => ['bail','required','string','max:50', Rule::unique('requirements','code')],
            // 'name' => ['bail','required','string','max:120'],
            // 'is_active' => ['nullable','boolean'],
            // 'sort_order' => ['nullable','integer'],
            'code' => ['bail', 'required', 'string', 'max:50', Rule::unique('requirements', 'code')],
            'name' => ['bail', 'required', 'string', 'max:255'],
            'description' => ['bail', 'nullable', 'string'],
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
        if (array_key_exists('sort_order', $data)) {
            $data['sort_order'] = is_null($data['sort_order']) ? null : (int) $data['sort_order'];
        }

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool) $data['is_active'];
        }
    }

    /**
     * Post-validation hooks.
     * Useful to derive values without polluting rules (e.g., uuid).
     */
    protected function passedValidation(): void
    {
        // Example: ensure uuid is set when --uuid-route is enabled

    }
}
