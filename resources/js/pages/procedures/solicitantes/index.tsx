import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { DataTable } from '@/components/index/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible, PageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnFiltersState, RowSelectionState, SortingState, VisibilityState } from '@tanstack/react-table';
import { Database, Plus, Users2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { columns, type TSolicitanteRow } from './columns';
import type { SolicitanteFilterValue } from './filters';
import { SolicitanteFilters } from './filters';

interface IndexProps extends PageProps {
    rows: TSolicitanteRow[];
    meta: {
        current_page?: number;
        currentPage?: number;
        per_page?: number;
        perPage?: number;
        total: number;
        last_page?: number;
        lastPage?: number;
    };
    stats?: { total?: number; active?: number };
    hasCreateRoute?: boolean;
    flash?: { success?: string; error?: string; warning?: string; info?: string };
    auth?: { can?: Record<string, boolean> };
}

type QueryState = {
    page: number;
    per_page: number;
    search: string;
    sort: string;
    dir: 'asc' | 'desc';
    filters: SolicitanteFilterValue;
};

function getInitialQuery(): QueryState {
    const params = new URLSearchParams(window.location.search);

    const filters: Partial<SolicitanteFilterValue> = {};
    params.forEach((value, key) => {
        const match = key.match(/^filters\[(.+?)\](?:\[(.*?)\])?$/);
        if (!match) return;
        const filterKey = match[1];
        const subKey = match[2];
        if (subKey !== undefined) return;

        if (filterKey === 'is_active') {
            if (value === 'true') filters.is_active = true;
            else if (value === 'false') filters.is_active = false;
        }
    });

    const dirParam = params.get('dir');
    const dir: 'asc' | 'desc' = dirParam === 'desc' ? 'desc' : 'asc';

    return {
        page: parseInt(params.get('page') || '1'),
        per_page: parseInt(params.get('per_page') || '10'),
        search: params.get('q') || '',
        sort: params.get('sort') || '',
        dir,
        filters: filters as SolicitanteFilterValue,
    };
}

export default function SolicitantesIndex() {
    const { rows, meta, auth, flash, hasCreateRoute, stats } = usePage<IndexProps>().props;

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
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [filters, setFilters] = React.useState<SolicitanteFilterValue>(initialQuery.filters);
    const [density, setDensity] = React.useState<'comfortable' | 'compact'>(() => {
        if (typeof window === 'undefined') return 'comfortable';
        const saved = window.localStorage.getItem('solicitantes_table_density');
        return saved === 'compact' ? 'compact' : 'comfortable';
    });

    const didMountRef = React.useRef(false);

    const permissions = {
        canCreate: auth?.can?.['solicitantes.create'] || false,
        canEdit: auth?.can?.['solicitantes.update'] || false,
        canDelete: auth?.can?.['solicitantes.delete'] || false,
        canExport: auth?.can?.['solicitantes.export'] || false,
        canBulkDelete: auth?.can?.['solicitantes.delete'] || false,
        canSetActive: auth?.can?.['solicitantes.setActive'] || false,
        canBulkSetActive: auth?.can?.['solicitantes.setActive'] || false,
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
            (Object.entries(filters) as Array<[keyof SolicitanteFilterValue, unknown]>).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') {
                    sanitized[k as string] = v as FormDataConvertible;
                }
            });
            if (Object.keys(sanitized).length > 0) params.filters = sanitized;
        }

        router.get('/procedures/solicitantes', params, {
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
        { title: 'Solicitantes', href: '/procedures/solicitantes' },
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
            window.location.href = `/procedures/solicitantes/export?${usp.toString()}`;
        },
        [pageIndex, pageSize, globalFilter, sorting, filters],
    );

    const handleFiltersChange = React.useCallback((newFilters: SolicitanteFilterValue) => {
        setFilters(newFilters);
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
            <Head title="Solicitantes" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                <div className="py-8">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="min-w-0">
                                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    <Users2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                    Solicitantes
                                </h1>
                                <p className="text-muted-foreground text-sm">Gestión de personas naturales y jurídicas</p>
                            </div>
                            {permissions.canCreate && hasCreateRoute && (
                                <Link href="/procedures/solicitantes/create">
                                    <Button className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Nuevo
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {(stats?.total !== undefined || stats?.active !== undefined) && (
                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total solicitantes</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total ?? meta.total}</p>
                                        </div>
                                        <Database className="h-8 w-8 text-sky-500 opacity-50" />
                                    </div>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Solicitantes activos</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.active ?? 0}</p>
                                        </div>
                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Activo</Badge>
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
                                    toolbar={<SolicitanteFilters value={filters} onChange={handleFiltersChange} />}
                                    density={density}
                                    onDensityChange={(d) => {
                                        setDensity(d);
                                        if (typeof window !== 'undefined') window.localStorage.setItem('solicitantes_table_density', d);
                                    }}
                                    getRowId={(r) => String((r as TSolicitanteRow).id)}
                                />
                            </div>
                        </div>

                        <ConfirmAlert
                            open={openBulkDelete.show}
                            onOpenChange={(open) => !open && setOpenBulkDelete({ show: false, count: 0 })}
                            title="Eliminar seleccionados"
                            description={`¿Está seguro de eliminar ${openBulkDelete.count} solicitante(s)? Esta acción no se puede deshacer.`}
                            confirmLabel="Eliminar"
                            onConfirm={async () => {
                                const ids = getSelectedIds();
                                await new Promise<void>((resolve, reject) => {
                                    router.post(
                                        '/procedures/solicitantes/bulk',
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
                            description={`¿Activar ${openBulkActivate.count} solicitante(s)?`}
                            confirmLabel="Activar"
                            onConfirm={async () => {
                                const ids = getSelectedIds();
                                await new Promise<void>((resolve, reject) => {
                                    router.post(
                                        '/procedures/solicitantes/bulk',
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
                            description={`¿Desactivar ${openBulkDeactivate.count} solicitante(s)?`}
                            confirmLabel="Desactivar"
                            onConfirm={async () => {
                                const ids = getSelectedIds();
                                await new Promise<void>((resolve, reject) => {
                                    router.post(
                                        '/procedures/solicitantes/bulk',
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
