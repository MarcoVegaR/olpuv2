<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Solicitante>
 */
class SolicitanteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tipoDocumento = fake()->randomElement(['V', 'E', 'J', 'G', 'P']);

        return [
            'tipo_documento' => $tipoDocumento,
            'numero_documento' => fake()->unique()->numerify(in_array($tipoDocumento, ['V', 'E', 'P']) ? '########' : '#########'),
            'nombre_razon_social' => in_array($tipoDocumento, ['J', 'G']) ? fake()->company() : fake()->name(),
            'telefono' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'direccion' => fake()->address(),
            'is_active' => true,
        ];
    }
}
