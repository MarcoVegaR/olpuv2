<?php

declare(strict_types=1);

return [
    'permissions' => [
        'expedientes.view',
        'expedientes.create',
        'expedientes.update',
        'expedientes.delete',
        'expedientes.restore',
        'expedientes.forceDelete',
        'expedientes.export',
        'expedientes.setActive',

        'expedientes.receive',
        'expedientes.overrideLocked',
        'expedientes.qr.download',

        'expedientes.files.view',
        'expedientes.files.upload',
        'expedientes.files.replace',
        'expedientes.files.delete',

        'expedientes.assign.reviewer',
        'expedientes.assign.inspector',
        'expedientes.inspection.submit',
        'expedientes.inspection.files',
        'expedientes.response.submit',
        'expedientes.decision.issue',
        'expedientes.decision.files',
        'expedientes.phase.return',
    ],
    'descriptions' => [
        'expedientes.view' => 'Ver expedientes',
        'expedientes.create' => 'Crear expediente',
        'expedientes.update' => 'Actualizar expediente',
        'expedientes.delete' => 'Eliminar expediente',
        'expedientes.restore' => 'Restaurar expediente',
        'expedientes.forceDelete' => 'Eliminar permanentemente expediente',
        'expedientes.export' => 'Exportar expedientes',
        'expedientes.setActive' => 'Activar/desactivar expedientes',

        'expedientes.receive' => 'Confirmar recepción del expediente',
        'expedientes.overrideLocked' => 'Modificar expediente bloqueado (post-recepción)',
        'expedientes.qr.download' => 'Descargar QR del expediente',

        'expedientes.files.view' => 'Ver recaudos digitales del expediente',
        'expedientes.files.upload' => 'Cargar recaudos digitales del expediente',
        'expedientes.files.replace' => 'Reemplazar recaudos digitales del expediente',
        'expedientes.files.delete' => 'Eliminar recaudos digitales del expediente',

        'expedientes.assign.reviewer' => 'Asignar revisor a expediente',
        'expedientes.assign.inspector' => 'Asignar inspector a expediente',
        'expedientes.inspection.submit' => 'Registrar inspección',
        'expedientes.inspection.files' => 'Cargar archivos de inspección',
        'expedientes.response.submit' => 'Enviar respuesta técnica',
        'expedientes.decision.issue' => 'Emitir decisión final',
        'expedientes.decision.files' => 'Adjuntar documento de decisión',
        'expedientes.phase.return' => 'Devolver expediente a fase previa',
    ],
];
