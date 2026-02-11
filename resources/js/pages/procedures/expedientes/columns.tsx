import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, MoreHorizontal, Power, QrCode } from 'lucide-react';
import React from 'react';

export type TExpedienteRow = {
    id: number;
    tracking: string;
    status: string;
    is_active?: boolean | null;
    numero_receptoria?: string | null;
    codigo_catastral?: string | null;
    procedure_type?: { id: number; code: string; name: string } | null;
    solicitante?: { id: number; tipo_documento: string; numero_documento: string; nombre_razon_social: string } | null;
    assigned_to?: string | null;
    received_at?: string | null;
    created_at?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    received: 'Recibido',
    pending_reviewer: 'Por revisor',
    pending_inspector: 'Por inspector',
    in_inspection: 'En inspección',
    pending_response: 'Por respuesta',
    pending_decision: 'Por decisión',
    completed: 'Completado',
    rejected: 'Rechazado',
    partial: 'Parcial',
    suspended: 'Suspendido',
};

function ActionsCell({ row }: { row: TExpedienteRow }) {
    const { auth } = usePage<{ auth?: { can?: Record<string, boolean> } }>().props;
    const canSetActive = !!auth?.can?.['expedientes.setActive'];
    const canQr = !!auth?.can?.['expedientes.qr.download'];

    const [openToggle, setOpenToggle] = React.useState(false);
    const isActive = !!row.is_active;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={`/procedures/expedientes/${row.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <a href={`/procedures/expedientes/${row.id}/planilla`} target="_blank" rel="noreferrer" className="cursor-pointer">
                            <Download className="mr-2 h-4 w-4" />
                            Planilla
                        </a>
                    </DropdownMenuItem>

                    {canQr && (
                        <DropdownMenuItem asChild>
                            <a href={`/procedures/expedientes/${row.id}/qr`} className="cursor-pointer">
                                <QrCode className="mr-2 h-4 w-4" />
                                Descargar QR
                            </a>
                        </DropdownMenuItem>
                    )}

                    {canSetActive && (
                        <DropdownMenuItem
                            onSelect={() => setTimeout(() => setOpenToggle(true), 100)}
                            className={
                                isActive
                                    ? 'text-amber-600 focus:text-amber-700 dark:text-amber-400 dark:focus:text-amber-300'
                                    : 'text-emerald-600 focus:text-emerald-700 dark:text-emerald-400 dark:focus:text-emerald-300'
                            }
                        >
                            <Power className="mr-2 h-4 w-4" />
                            {isActive ? 'Desactivar' : 'Activar'}
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmAlert
                open={openToggle}
                onOpenChange={setOpenToggle}
                title={isActive ? 'Desactivar' : 'Activar'}
                description={`¿Está seguro de ${isActive ? 'desactivar' : 'activar'} el expediente ${row.tracking}?`}
                confirmLabel={isActive ? 'Desactivar' : 'Activar'}
                onConfirm={async () => {
                    await new Promise<void>((resolve, reject) => {
                        router.patch(
                            `/procedures/expedientes/${row.id}/active`,
                            { active: !isActive },
                            {
                                preserveState: false,
                                preserveScroll: true,
                                onSuccess: () => resolve(),
                                onError: () => reject(new Error('set_active_failed')),
                            },
                        );
                    });
                }}
            />
        </>
    );
}

export const columns: ColumnDef<TExpedienteRow>[] = [
    { accessorKey: 'id', header: '#', enableSorting: true },
    {
        accessorKey: 'tracking',
        header: 'Tracking',
        enableSorting: true,
        cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue() ?? '')}</span>,
    },
    {
        id: 'procedure',
        header: 'Trámite',
        enableSorting: false,
        cell: ({ row }) => {
            const t = (row.original as TExpedienteRow).procedure_type;
            return <span className="text-sm">{t?.name ?? '—'}</span>;
        },
    },
    {
        id: 'solicitante',
        header: 'Solicitante',
        enableSorting: false,
        cell: ({ row }) => {
            const s = (row.original as TExpedienteRow).solicitante;
            return <span className="text-sm">{s?.nombre_razon_social ?? '—'}</span>;
        },
    },
    {
        id: 'assigned_to',
        header: 'Asignado',
        enableSorting: false,
        cell: ({ row }) => {
            const name = (row.original as TExpedienteRow).assigned_to;
            return <span className="text-sm">{name ?? '—'}</span>;
        },
    },
    {
        accessorKey: 'status',
        header: 'Estado',
        enableSorting: true,
        cell: ({ row, getValue }) => {
            const status = String(getValue() ?? '');
            const active = !!(row.original as TExpedienteRow).is_active;
            const label = STATUS_LABELS[status] ?? status;
            return (
                <div className="flex items-center gap-2">
                    <span className={'h-2 w-2 shrink-0 rounded-full ' + (active ? 'bg-emerald-500' : 'bg-red-400')} />
                    <Badge variant={active ? 'default' : 'destructive'} className="font-medium">
                        {label}
                    </Badge>
                </div>
            );
        },
    },
    { accessorKey: 'numero_receptoria', header: 'N° Receptoría', enableSorting: false },
    { accessorKey: 'created_at', header: 'Creado', enableSorting: true },
    {
        id: 'actions',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => <ActionsCell row={row.original as TExpedienteRow} />,
    },
];
