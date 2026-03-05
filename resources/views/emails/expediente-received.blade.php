<x-mail::message>
# Trámite Recibido

Estimado/a **{{ $solicitanteNombre }}**,

Su trámite ha sido recibido exitosamente en la **Dirección de Planeamiento Urbano**.

## Detalles del Trámite

- **Tipo de trámite:** {{ $procedureTypeName }}
- **Número de seguimiento:** {{ $expediente->tracking }}
- **Fecha de recepción:** {{ $expediente->received_at?->format('d/m/Y H:i') }}

## Recaudos Consignados

A continuación se detallan los recaudos que fueron consignados al momento de la recepción:

@foreach($requirements as $req)
- {{ $req['physical_received'] ? '✓' : '✗' }} {{ $req['name'] }}{{ $req['is_required'] ? ' (Requerido)' : ' (Opcional)' }}
@endforeach

## Seguimiento de su Trámite

Puede consultar el estado de su trámite en cualquier momento utilizando el siguiente enlace:

<x-mail::button :url="$trackingUrl">
Consultar Estado del Trámite
</x-mail::button>

O ingresando su número de seguimiento **{{ $expediente->tracking }}** en nuestra página de consulta pública.

---

**Importante:** Conserve este número de seguimiento para futuras consultas.

Atentamente,<br>
{{ config('app.name') }}
</x-mail::message>
