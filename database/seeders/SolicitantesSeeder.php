<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Solicitante;
use Illuminate\Database\Seeder;

class SolicitantesSeeder extends Seeder
{
    public function run(): void
    {
        $solicitantes = [
            // Personas naturales venezolanas
            [
                'tipo_documento' => 'V',
                'numero_documento' => '12345678',
                'nombre_razon_social' => 'Juan Carlos Pérez González',
                'telefono' => '0424-1234567',
                'email' => 'juanperez@email.com',
                'direccion' => 'Av. Bolívar, Edificio Centro, Piso 3, Oficina 3-A',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'V',
                'numero_documento' => '15678901',
                'nombre_razon_social' => 'María Elena Rodríguez López',
                'telefono' => '0414-9876543',
                'email' => 'maria.rodriguez@email.com',
                'direccion' => 'Calle Principal, Casa 45, Sector Centro',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'V',
                'numero_documento' => '18234567',
                'nombre_razon_social' => 'Pedro José Hernández Martínez',
                'telefono' => '0412-5551234',
                'email' => 'pedro.hernandez@email.com',
                'direccion' => 'Urbanización El Paraíso, Calle 5, Casa 12',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'V',
                'numero_documento' => '20456789',
                'nombre_razon_social' => 'Ana María García Fernández',
                'telefono' => '0416-3334455',
                'email' => 'ana.garcia@email.com',
                'direccion' => 'Residencias Las Palmas, Torre B, Apto 5-2',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'V',
                'numero_documento' => '9876543',
                'nombre_razon_social' => 'Carlos Alberto Mendoza Rojas',
                'telefono' => '0424-7778899',
                'email' => 'carlos.mendoza@email.com',
                'direccion' => 'Av. Principal, Quinta Los Pinos',
                'is_active' => false,
            ],

            // Personas extranjeras
            [
                'tipo_documento' => 'E',
                'numero_documento' => '82456123',
                'nombre_razon_social' => 'Roberto Alejandro Silva Moreno',
                'telefono' => '0412-1112233',
                'email' => 'roberto.silva@email.com',
                'direccion' => 'Centro Comercial El Dorado, Local 25',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'E',
                'numero_documento' => '84567890',
                'nombre_razon_social' => 'Lucía Fernanda Torres Ruiz',
                'telefono' => '0414-4445566',
                'email' => 'lucia.torres@email.com',
                'direccion' => 'Calle 10, Edificio Aurora, Piso 2',
                'is_active' => true,
            ],

            // Pasaporte
            [
                'tipo_documento' => 'P',
                'numero_documento' => 'AB1234567',
                'nombre_razon_social' => 'Michael Johnson Smith',
                'telefono' => '0424-8889900',
                'email' => 'michael.johnson@email.com',
                'direccion' => 'Hotel Continental, Habitación 305',
                'is_active' => true,
            ],

            // Personas jurídicas
            [
                'tipo_documento' => 'J',
                'numero_documento' => '123456789',
                'nombre_razon_social' => 'Constructora Los Andes C.A.',
                'telefono' => '0212-5551234',
                'email' => 'contacto@constructoralosandes.com',
                'direccion' => 'Av. Principal, Torre Empresarial, Piso 10',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'J',
                'numero_documento' => '234567890',
                'nombre_razon_social' => 'Inmobiliaria Horizonte S.A.',
                'telefono' => '0212-6667788',
                'email' => 'info@inmobiliariahorizonte.com',
                'direccion' => 'Centro Empresarial Plaza, Oficina 501',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'J',
                'numero_documento' => '345678901',
                'nombre_razon_social' => 'Desarrollos Urbanos del Norte C.A.',
                'telefono' => '0212-7778899',
                'email' => 'proyectos@desarrollosnorte.com',
                'direccion' => 'Edificio Corporativo Norte, Piso 15',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'J',
                'numero_documento' => '456789012',
                'nombre_razon_social' => 'Arquitectura y Diseño Moderno C.A.',
                'telefono' => '0212-8889900',
                'email' => 'proyectos@arquitecturamoderna.com',
                'direccion' => 'Av. Libertador, Centro Profesional, Oficina 302',
                'is_active' => false,
            ],

            // Entidades de gobierno
            [
                'tipo_documento' => 'G',
                'numero_documento' => '20000001',
                'nombre_razon_social' => 'Alcaldía del Municipio Libertador',
                'telefono' => '0212-1234567',
                'email' => 'contacto@alcaldialibertador.gob.ve',
                'direccion' => 'Palacio Municipal, Centro Histórico',
                'is_active' => true,
            ],
            [
                'tipo_documento' => 'G',
                'numero_documento' => '20000002',
                'nombre_razon_social' => 'Gobernación del Estado',
                'telefono' => '0212-2345678',
                'email' => 'contacto@gobernacion.gob.ve',
                'direccion' => 'Palacio de Gobierno, Av. Principal',
                'is_active' => true,
            ],
        ];

        foreach ($solicitantes as $data) {
            Solicitante::query()->updateOrCreate(
                [
                    'tipo_documento' => $data['tipo_documento'],
                    'numero_documento' => $data['numero_documento'],
                ],
                $data
            );
        }

        $this->command->info('Created '.count($solicitantes).' test solicitantes');
    }
}
