import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { DataTable } from '@/components/index/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible, PageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnFiltersState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Database, FileText, Plus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { columns, type TExpedienteRow } from './columns';
import type { ExpedienteFilterValue } from './filters';
import { ExpedienteFilters } from './filters';

const STATUS_TABS: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todos' },
    { value: 'received', label: 'Recibido' },
    { value: 'pending_reviewer', label: 'Por revisor' },
    { value: 'pending_inspector', label: 'Por inspector' },
    { value: 'in_inspection', label: 'En inspección' },
    { value: 'pending_response', label: 'Por respuesta' },
    { value: 'pending_decision', label: 'Por decisión' },
    { value: 'completed', label: 'Completado' },
    { value: 'rejected', label: 'Rechazado' },
];

interface IndexProps extends PageProps {
    rows: TExpedienteRow[];
    meta: {
        current_page?: number;
        currentPage?: number;
        per_page?: number;
        perPage?: number;
        total: number;
        last_page?: number;
        lastPage?: number;
    };
    stats?: { total?: number; received?: number };
    hasCreateRoute?: boolean;
    flash?: { success?: string; error?: string; warning?: string; info?: string };
    auth?: { can?: Record<string, boolean> };
    procedureTypes?: Array<{ id: number; name: string }>;
}

type QueryState = {
    page: number;
    per_page: number;
    search: string;
    sort: string;
    dir: 'asc' | 'desc';
    filters: ExpedienteFilterValue;
};

function getInitialQuery(): QueryState {
    const params = new URLSearchParams(window.location.search);

    const filters: Partial<ExpedienteFilterValue> = {};
    params.forEach((value, key) => {
        const match = key.match(/^filters\[(.+?)\](?:\[(.*?)\])?$/);
        if (!match) return;
        const filterKey = match[1];
        const subKey = match[2];
        if (subKey !== undefined) return;

        if (filterKey === 'procedure_type_id') filters.procedure_type_id = Number(value);
        else if (filterKey === 'solicitante_tipo_documento') filters.solicitante_tipo_documento = value;
        else if (filterKey === 'solicitante_numero_documento_like') filters.solicitante_numero_documento_like = value;
        else if (filterKey === 'status') filters.status = value;
    });

    const dirParam = params.get('dir');
    const dir: 'asc' | 'desc' = dirParam === 'desc' ? 'desc' : 'asc';

    return {
        page: parseInt(params.get('page') || '1'),
        per_page: parseInt(params.get('per_page') || '10'),
        search: params.get('q') || '',
        sort: params.get('sort') || '',
        dir,
        filters: filters as ExpedienteFilterValue,
    };
}

export default function ExpedientesIndex() {
    const { rows, meta, auth, flash, hasCreateRoute, stats, procedureTypes } = usePage<IndexProps>().props;

    const initialQuery = getInitialQuery();

    const currentPage = meta.current_page ?? meta.currentPage ?? 1;
    const perPage = meta.per_page ?? meta.perPage ?? 10;

    const [pageIndex, setPageIndex] = React.useState(Math.max(0, (initialQuery.page || currentPage || 1) - 1));
    const [pageSize, setPageSize] = React.useState(initialQuery.per_page || perPage);
    const [globalFilter, setGlobalFilter] = React.useState(initialQuery.search);
    const [sorting, setSorting] = React.useState<SortingState>(() => {
        if (!initialQuery.sort) return [];
        return [{ id: initialQuery.sort, desc: initialQuery.dir === 'desc' }];
    });
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ created_at: false });
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [filters, setFilters] = React.useState<ExpedienteFilterValue>(initialQuery.filters);
    const [statusTab, setStatusTab] = React.useState<string>(initialQuery.filters.status ?? '');
    const [density, setDensity] = React.useState<'comfortable' | 'compact'>(() => {
        if (typeof window === 'undefined') return 'comfortable';
        const saved = window.localStorage.getItem('expedientes_table_density');
        return saved === 'compact' ? 'compact' : 'comfortable';
    });

    const didMountRef = React.useRef(false);

    const permissions = {
        canCreate: auth?.can?.['expedientes.create'] || false,
        canExport: auth?.can?.['expedientes.export'] || false,
        canBulkDelete: auth?.can?.['expedientes.delete'] || false,
        canSetActive: auth?.can?.['expedientes.setActive'] || false,
        canBulkSetActive: auth?.can?.['expedientes.setActive'] || false,
    };

    const debouncedSearch = React.useMemo(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return (value: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setGlobalFilter(value);
                setPageIndex(0);
            }, 300);
        };
    }, []);

    const reloadData = React.useCallback(() => {
        const params: Record<string, FormDataConvertible> = {
            page: pageIndex + 1,
            per_page: pageSize,
        };

        if (globalFilter) params.q = globalFilter;
        if (sorting.length > 0) {
            const s = sorting[0];
            params.sort = s.id;
            params.dir = s.desc ? 'desc' : 'asc';
        }

        if (filters && Object.keys(filters).length > 0) {
            const sanitized: Record<string, FormDataConvertible> = {};
            (Object.entries(filters) as Array<[keyof ExpedienteFilterValue, unknown]>).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') {
                    sanitized[k as string] = v as FormDataConvertible;
                }
            });
            if (Object.keys(sanitized).length > 0) params.filters = sanitized;
        }

        router.get('/procedures/expedientes', params, {
            only: ['rows', 'meta'],
            preserveState: true,
            preserveScroll: true,
        });
    }, [pageIndex, pageSize, globalFilter, sorting, filters]);

    React.useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        reloadData();
    }, [reloadData]);

    React.useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning);
        if (flash?.info) toast.info(flash.info);
    }, [flash]);

    const breadcrumbs = [
        { title: 'Trámites', href: '/procedures/expedientes' },
        { title: 'Expedientes', href: '/procedures/expedientes' },
    ];

    const handleExport = React.useCallback(
        (format: string = 'csv') => {
            const usp = new URLSearchParams();
            usp.set('format', format);
            usp.set('page', String(pageIndex + 1));
            usp.set('per_page', String(pageSize));
            if (globalFilter) usp.set('q', globalFilter);
            if (sorting.length > 0) {
                const s = sorting[0];
                usp.set('sort', String(s.id));
                usp.set('dir', s.desc ? 'desc' : 'asc');
            }
            if (filters && Object.keys(filters).length > 0) {
                (Object.entries(filters) as Array<[string, unknown]>).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') {
                        usp.append(`filters[${k}]`, String(v));
                    }
                });
            }
            window.location.href = `/procedures/expedientes/export?${usp.toString()}`;
        },
        [pageIndex, pageSize, globalFilter, sorting, filters],
    );

    const handleFiltersChange = React.useCallback((newFilters: ExpedienteFilterValue) => {
        setFilters(newFilters);
        setPageIndex(0);
    }, []);

    const handleStatusTabChange = React.useCallback((tab: string) => {
        setStatusTab(tab);
        setFilters((prev) => {
            const next = { ...prev };
            if (tab) {
                next.status = tab;
            } else {
                delete next.status;
            }
            return next;
        });
        setPageIndex(0);
    }, []);

    const getSelectedIds = React.useCallback((): number[] => {
        const ids = Object.keys(rowSelection).map((key) => Number(key));
        return Array.from(new Set(ids.filter((v) => Number.isFinite(v) && Number.isInteger(v) && v > 0)));
    }, [rowSelection]);

    const [openBulkDelete, setOpenBulkDelete] = React.useState<{ show: boolean; count: number }>({ show: false, count: 0 });
    const [openBulkActivate, setOpenBulkActivate] = React.useState<{ show: boolean; count: number }>({ show: false, count: 0 });
    const [openBulkDeactivate, setOpenBulkDeactivate] = React.useState<{ show: boolean; count: number }>({ show: false, count: 0 });

    const handleBulkDelete = React.useCallback(() => {
        const selected = getSelectedIds();
        setOpenBulkDelete({ show: true, count: selected.length });
    }, [getSelectedIds]);

    const handleBulkActivate = React.useCallback(() => {
        const selected = getSelectedIds();
        setOpenBulkActivate({ show: true, count: selected.length });
    }, [getSelectedIds]);

    const handleBulkDeactivate = React.useCallback(() => {
        const selected = getSelectedIds();
        setOpenBulkDeactivate({ show: true, count: selected.length });
    }, [getSelectedIds]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expedientes" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                <div className="py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="min-w-0">
                                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                    Expedientes
                                </h1>
                                <p className="text-muted-foreground text-sm">Registro y gestión del expediente</p>
                            </div>
                            {permissions.canCreate && hasCreateRoute && (
                                <Link href="/procedures/expedientes/create">
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Recepcionar
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Status tabs */}
                        <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800/60">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => handleStatusTabChange(tab.value)}
                                    className={`rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                        statusTab === tab.value
                                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {(stats?.total !== undefined || stats?.received !== undefined) && (
                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total expedientes</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total ?? meta.total}</p>
                                        </div>
                                        <Database className="h-8 w-8 text-emerald-500 opacity-50" />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recibidos</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.received ?? 0}</p>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            Recibido
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                            <div className="p-6">
                                <DataTable
                                    columns={columns}
                                    data={rows}
                                    rowCount={meta.total}
                                    pageIndex={pageIndex}
                                    pageSize={pageSize}
                                    onPageChange={setPageIndex}
                                    onPageSizeChange={(size) => {
                                        setPageSize(size);
                                        setPageIndex(0);
                                    }}
                                    sorting={sorting}
                                    onSortingChange={setSorting}
                                    globalFilter={globalFilter}
                                    onGlobalFilterChange={debouncedSearch}
                                    columnFilters={columnFilters}
                                    onColumnFiltersChange={setColumnFilters}
                                    columnVisibility={columnVisibility}
                                    onColumnVisibilityChange={setColumnVisibility}
                                    rowSelection={rowSelection}
                                    onRowSelectionChange={setRowSelection}
                                    permissions={permissions}
                                    onDeleteSelectedClick={permissions.canBulkDelete ? handleBulkDelete : undefined}
                                    onActivateSelectedClick={permissions.canBulkSetActive ? handleBulkActivate : undefined}
                                    onDeactivateSelectedClick={permissions.canBulkSetActive ? handleBulkDeactivate : undefined}
                                    canExport={permissions.canExport}
                                    onExportClick={permissions.canExport ? (format) => handleExport(format) : undefined}
                                    enableRowSelection={true}
                                    enableGlobalFilter={true}
                                    toolbar={
                                        <ExpedienteFilters value={filters} onChange={handleFiltersChange} procedureTypes={procedureTypes ?? []} />
                                    }
                                    density={density}
                                    onDensityChange={(d) => {
                                        setDensity(d);
                                        if (typeof window !== 'undefined') window.localStorage.setItem('expedientes_table_density', d);
                                    }}
                                    getRowId={(r) => String((r as TExpedienteRow).id)}
                                />
                            </div>
                        </div>

                        <ConfirmAlert
                            open={openBulkDelete.show}
                            onOpenChange={(open) => !open && setOpenBulkDelete({ show: false, count: 0 })}
                            title="Eliminar seleccionados"
                            description={`¿Está seguro de eliminar ${openBulkDelete.count} expediente(s)? Esta acción no se puede deshacer.`}
                            confirmLabel="Eliminar"
                            onConfirm={async () => {
                                const ids = getSelectedIds();
                                await new Promise<void>((resolve, reject) => {
                                    router.post(
                                        '/procedures/expedientes/bulk',
                                        { action: 'delete', ids },
                                        {
                                            preserveState: false,
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setRowSelection({});
                                                resolve();
                                            },
                                            onError: () => reject(new Error('bulk_delete_failed')),
                                        },
                                    );
                                });
                                setOpenBulkDelete({ show: false, count: 0 });
                            }}
                        />

                        <ConfirmAlert
                            open={openBulkActivate.show}
                            onOpenChange={(open) => !open && setOpenBulkActivate({ show: false, count: 0 })}
                            title="Activar seleccionados"
                            description={`¿Activar ${openBulkActivate.count} expediente(s)?`}
                            confirmLabel="Activar"
                            onConfirm={async () => {
                                const ids = getSelectedIds();
                                await new Promise<void>((resolve, reject) => {
                                    router.post(
                                        '/procedures/expedientes/bulk',
                                        { action: 'setActive', ids, active: true },
                                        {
                                            preserveState: false,
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setRowSelection({});
                                                resolve();
                                            },
                                            onError: () => reject(new Error('bulk_activate_failed')),
                                        },
                                    );
                                });
                                setOpenBulkActivate({ show: false, count: 0 });
                            }}
                        />

                        <ConfirmAlert
                            open={openBulkDeactivate.show}
                            onOpenChange={(open) => !open && setOpenBulkDeactivate({ show: false, count: 0 })}
                            title="Desactivar seleccionados"
                            description={`¿Desactivar ${openBulkDeactivate.count} expediente(s)?`}
                            confirmLabel="Desactivar"
                            onConfirm={async () => {
                                const ids = getSelectedIds();
                                await new Promise<void>((resolve, reject) => {
                                    router.post(
                                        '/procedures/expedientes/bulk',
                                        { action: 'setActive', ids, active: false },
                                        {
                                            preserveState: false,
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setRowSelection({});
                                                resolve();
                                            },
                                            onError: () => reject(new Error('bulk_deactivate_failed')),
                                        },
                                    );
                                });
                                setOpenBulkDeactivate({ show: false, count: 0 });
                            }}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
