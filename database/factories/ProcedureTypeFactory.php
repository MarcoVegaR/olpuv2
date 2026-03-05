<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProcedureType>
 */
class ProcedureTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->regexify('[A-Z]{3}-[0-9]{3}'),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'workflow_requires_review_assignment' => false,
            'workflow_requires_inspector_assignment' => false,
            'workflow_requires_inspection' => fake()->boolean(80),
            'workflow_requires_technical_response' => false,
            'workflow_requires_decision' => false,
            'inspection_mode' => 'none',
            'has_validity' => false,
            'validity_years' => null,
            'validity_months' => null,
            'reception_requires_all_recaudos' => false,
            'reception_requires_file_uploads' => false,
            'inspection_requires_photos' => false,
            'inspection_requires_report' => false,
            'decision_requires_document' => false,
            'is_active' => true,
            'sort_order' => null,
        ];
    }
}
