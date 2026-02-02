import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { ShowLayout } from '@/components/show-base/ShowLayout';
import { ShowSection } from '@/components/show-base/ShowSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle2, FileCheck, FileText, Pencil, Trash2, XCircle } from 'lucide-react';

interface ProcedureTypeUsage {
    id: number;
    code: string;
    name: string;
    pivot?: {
        sort_order?: number;
        is_required?: boolean;
        is_active?: boolean;
    };
}

interface RequirementShowItem {
    id: number | string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    sort_order?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    procedure_types?: ProcedureTypeUsage[];
}

interface ShowProps extends PageProps {
    item: RequirementShowItem;
    hasEditRoute?: boolean;
}

export default function ShowPage() {
    const { item, hasEditRoute } = usePage<ShowProps>().props;
    const typedItem = item;

    const usages = (typedItem.procedure_types ?? []).slice().sort((a, b) => (a.pivot?.sort_order ?? 0) - (b.pivot?.sort_order ?? 0));

    const formatDate = (date?: unknown) => {
        if (!date) return '—';
        const normalized = typeof date === 'string' || typeof date === 'number' ? String(date) : null;
        if (!normalized) return '—';
        try {
            return new Date(normalized).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return '—';
        }
    };

    const breadcrumbs = [
        { title: 'Catálogos', href: '/catalogs' },
        { title: 'Requisitos', href: '/catalogs/requirement' },
        { title: String(typedItem.name ?? typedItem.code ?? typedItem.id), href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Requisito: ${String(typedItem.name ?? typedItem.code ?? typedItem.id)}`} />

            <ShowLayout
                header={
                    <div className="flex items-center gap-4">
                        <Link href="/catalogs/requirement" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{String(typedItem.name ?? typedItem.code ?? typedItem.id)}</h1>
                        </div>
                    </div>
                }
                actions={
                    <div className="flex gap-2">
                        {hasEditRoute && (
                            <Button onClick={() => router.visit(`/catalogs/requirement/${typedItem.id}/edit`)}>
                                <Pencil className="h-4 w-4" />
                                Editar
                            </Button>
                        )}
                        <ConfirmAlert
                            trigger={
                                <Button variant="destructive" type="button">
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                </Button>
                            }
                            title="Eliminar registro"
                            description={`¿Está seguro de eliminar "${String(typedItem.name ?? typedItem.code ?? typedItem.id)}"? Esta acción no se puede deshacer.`}
                            confirmLabel="Eliminar"
                            onConfirm={async () => {
                                await new Promise<void>((resolve, reject) => {
                                    router.delete(`/catalogs/requirement/${typedItem.id}`, {
                                        preserveState: false,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            resolve();
                                            router.visit('/catalogs/requirement');
                                        },
                                        onError: () => reject(new Error('delete_failed')),
                                    });
                                });
                            }}
                        />
                    </div>
                }
                aside={
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">Estado</span>
                                <div className="flex items-center gap-2">
                                    <span className={'h-2 w-2 shrink-0 rounded-full ' + (typedItem.is_active ? 'bg-emerald-500' : 'bg-red-400')} />
                                    <Badge variant={typedItem.is_active ? 'default' : 'destructive'} className="font-medium">
                                        {typedItem.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                }
            >
                <ShowSection id="overview" title="Información Básica">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Información del Requisito</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                                    <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Código</dt>
                                    <dd className="mt-2 font-mono text-lg font-semibold">{String(typedItem.code ?? '—')}</dd>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                                    <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Orden</dt>
                                    <dd className="mt-2 text-lg font-semibold">{String(typedItem.sort_order ?? '—')}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Nombre del Requisito</dt>
                                    <dd className="mt-2 text-base">{String(typedItem.name ?? '—')}</dd>
                                </div>
                                {typedItem.description && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Descripción Adicional</dt>
                                        <dd className="mt-2 text-sm text-slate-600 dark:text-slate-400">{String(typedItem.description)}</dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>
                </ShowSection>

                <ShowSection id="usage" title="Usado en">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Tipos de Trámite que Usan este Requisito</CardTitle>
                                    <p className="text-muted-foreground text-sm">
                                        {usages.length} trámite{usages.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {usages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center">
                                    <FileText className="text-muted-foreground mb-3 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm">Este requisito no está asociado a ningún tipo de trámite.</p>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        Vincule este requisito desde la vista de edición del tipo de trámite.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {usages.map((p, idx) => (
                                        <div
                                            key={p.id}
                                            className="group flex flex-col gap-3 rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900"
                                        >
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="leading-tight font-medium" title={p.name}>
                                                        {p.name}
                                                    </p>
                                                    <p className="text-muted-foreground mt-0.5 font-mono text-xs">{p.code}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                                                        p.pivot?.is_required
                                                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                                                            : 'bg-slate-50 dark:bg-slate-800'
                                                    }`}
                                                >
                                                    {p.pivot?.is_required ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <XCircle className="text-muted-foreground h-4 w-4" />
                                                    )}
                                                    <span className="text-sm">Obligatorio</span>
                                                </div>
                                                <div
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                                                        (p.pivot?.is_active ?? true)
                                                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                                                            : 'bg-slate-50 dark:bg-slate-800'
                                                    }`}
                                                >
                                                    {(p.pivot?.is_active ?? true) ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <XCircle className="text-muted-foreground h-4 w-4" />
                                                    )}
                                                    <span className="text-sm">Activo</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </ShowSection>

                <ShowSection id="metadata" title="Metadatos">
                    <Card className="border-0 shadow-md">
                        <CardContent className="py-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                                    <Calendar className="h-5 w-5 text-emerald-500" />
                                    <div>
                                        <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Creado</div>
                                        <div className="mt-1 text-sm font-medium">{formatDate(typedItem.created_at ?? null)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                                    <Calendar className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Última actualización</div>
                                        <div className="mt-1 text-sm font-medium">{formatDate(typedItem.updated_at ?? null)}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </ShowSection>
            </ShowLayout>
        </AppLayout>
    );
}
