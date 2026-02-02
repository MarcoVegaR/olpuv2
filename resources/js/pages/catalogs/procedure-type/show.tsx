import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { Field } from '@/components/form/Field';
import { ShowLayout } from '@/components/show-base/ShowLayout';
import { ShowSection } from '@/components/show-base/ShowSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { ArrowLeft, Calendar, CheckCircle2, ClipboardList, FileText, Pencil, Save, Settings2, Trash2, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ProcedureTypeShowItem {
    id: number | string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    sort_order?: number | null;
    is_active?: boolean | null;
    inspection_mode?: string | null;
    has_validity?: boolean | null;
    validity_years?: number | null;
    validity_months?: number | null;
    workflow_requires_review_assignment?: boolean | null;
    workflow_requires_inspector_assignment?: boolean | null;
    workflow_requires_inspection?: boolean | null;
    workflow_requires_technical_response?: boolean | null;
    workflow_requires_decision?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    requirements?: ProcedureTypeRequirementRow[];
}

interface RequirementCatalogItem {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
}

interface ProcedureTypeRequirementRow {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    pivot: {
        sort_order: number;
        is_required: boolean;
        is_active: boolean;
    };
}

interface RequirementDraftRow {
    requirement_id: number;
    code: string;
    name: string;
    description?: string | null;
    sort_order: number;
    is_required: boolean;
    is_active: boolean;
}

interface ShowProps extends PageProps {
    item: ProcedureTypeShowItem;
    hasEditRoute?: boolean;
    requirementsCatalog?: RequirementCatalogItem[];
}

type WorkflowFlagKey =
    | 'workflow_requires_review_assignment'
    | 'workflow_requires_inspector_assignment'
    | 'workflow_requires_inspection'
    | 'workflow_requires_technical_response'
    | 'workflow_requires_decision';

export default function ShowPage() {
    const { item, hasEditRoute, requirementsCatalog } = usePage<ShowProps>().props;
    const typedItem = item;

    const requirementsOptions = useMemo(() => {
        return (requirementsCatalog ?? []).map((r) => ({
            value: String(r.id),
            label: `${r.name} (${r.code})`,
            disabled: !r.is_active,
        }));
    }, [requirementsCatalog]);

    const initialDraft = useMemo((): RequirementDraftRow[] => {
        const rows = (typedItem.requirements ?? []) as ProcedureTypeRequirementRow[];
        return rows
            .map((r) => ({
                requirement_id: r.id,
                code: r.code,
                name: r.name,
                description: r.description ?? null,
                sort_order: Number(r.pivot?.sort_order ?? 0),
                is_required: Boolean(r.pivot?.is_required ?? true),
                is_active: Boolean(r.pivot?.is_active ?? true),
            }))
            .sort((a, b) => a.sort_order - b.sort_order);
    }, [typedItem.requirements]);

    const [selectedToAdd, setSelectedToAdd] = useState<string>('');
    const [draft, setDraft] = useState<RequirementDraftRow[]>(initialDraft);

    useEffect(() => {
        setDraft(initialDraft);
    }, [initialDraft]);

    const requirementsById = useMemo(() => {
        const map = new Map<number, RequirementCatalogItem>();
        for (const r of requirementsCatalog ?? []) {
            map.set(r.id, r);
        }
        return map;
    }, [requirementsCatalog]);

    const addRequirement = (requirementId: number) => {
        if (!Number.isInteger(requirementId) || requirementId <= 0) return;
        if (draft.some((d) => d.requirement_id === requirementId)) return;

        const found = requirementsById.get(requirementId);
        if (!found) return;

        const maxOrder = draft.reduce((acc, r) => Math.max(acc, r.sort_order), 0);
        const nextOrder = draft.length === 0 ? 0 : maxOrder + 10;

        setDraft([
            ...draft,
            {
                requirement_id: requirementId,
                code: found.code,
                name: found.name,
                description: found.description ?? null,
                sort_order: nextOrder,
                is_required: true,
                is_active: true,
            },
        ]);
    };

    const removeRequirement = (requirementId: number) => {
        setDraft(draft.filter((d) => d.requirement_id !== requirementId));
    };

    const updateRow = (requirementId: number, patch: Partial<RequirementDraftRow>) => {
        setDraft(draft.map((d) => (d.requirement_id === requirementId ? { ...d, ...patch } : d)));
    };

    const handleSaveRequirements = () => {
        const payload = draft
            .map((d) => ({
                requirement_id: d.requirement_id,
                sort_order: Number.isFinite(d.sort_order) ? d.sort_order : 0,
                is_required: !!d.is_required,
                is_active: !!d.is_active,
            }))
            .sort((a, b) => a.sort_order - b.sort_order);

        router.put(
            route('catalogs.procedure-type.requirements.sync', typedItem.id),
            { requirements: payload },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

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
        { title: 'Tipos de trámite', href: '/catalogs/procedure-type' },
        { title: String(typedItem.name ?? typedItem.code ?? typedItem.id), href: '' },
    ];

    const workflowFlags: Array<{ key: WorkflowFlagKey; label: string }> = [
        { key: 'workflow_requires_review_assignment', label: 'Asignación de revisor' },
        { key: 'workflow_requires_inspector_assignment', label: 'Asignación de inspector' },
        { key: 'workflow_requires_inspection', label: 'Inspección de campo' },
        { key: 'workflow_requires_technical_response', label: 'Respuesta técnica' },
        { key: 'workflow_requires_decision', label: 'Decisión final' },
    ];

    const inspectionLabel = (mode?: string | null) => {
        const v = String(mode ?? 'none');
        if (v === 'required') return 'Sí';
        if (v === 'optional') return 'Opcional';
        return 'No';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Tipo de trámite: ${String(typedItem.name ?? typedItem.code ?? typedItem.id)}`} />

            <ShowLayout
                header={
                    <div className="flex items-center gap-4">
                        <Link href="/catalogs/procedure-type" className="text-muted-foreground hover:text-foreground transition-colors">
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
                            <Button onClick={() => router.visit(`/catalogs/procedure-type/${typedItem.id}/edit`)}>
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
                                    router.delete(`/catalogs/procedure-type/${typedItem.id}`, {
                                        preserveState: false,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            resolve();
                                            router.visit('/catalogs/procedure-type');
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
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Información Básica</CardTitle>
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
                                    <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Nombre del Trámite</dt>
                                    <dd className="mt-2 text-base">{String(typedItem.name ?? '—')}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Descripción</dt>
                                    <dd className="mt-2 text-sm text-slate-600 dark:text-slate-400">{String(typedItem.description ?? '—')}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </ShowSection>

                <ShowSection id="workflow" title="Configuración del Proceso">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                    <Settings2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Configuración del Proceso</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl border bg-slate-50/50 p-4 text-center dark:bg-slate-800/30">
                                    <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Inspección</div>
                                    <div className="mt-2">
                                        <Badge
                                            variant={inspectionLabel(typedItem.inspection_mode ?? null) === 'Sí' ? 'default' : 'secondary'}
                                            className="text-sm"
                                        >
                                            {inspectionLabel(typedItem.inspection_mode ?? null)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="rounded-xl border bg-slate-50/50 p-4 text-center dark:bg-slate-800/30">
                                    <div className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Vigencia</div>
                                    <div className="mt-2">
                                        {typedItem.has_validity ? (
                                            <span className="text-lg font-semibold">
                                                {typedItem.validity_years
                                                    ? `${typedItem.validity_years} año${typedItem.validity_years > 1 ? 's' : ''}`
                                                    : ''}
                                                {typedItem.validity_years && typedItem.validity_months ? ' ' : ''}
                                                {typedItem.validity_months
                                                    ? `${typedItem.validity_months} mes${typedItem.validity_months > 1 ? 'es' : ''}`
                                                    : ''}
                                                {!typedItem.validity_years && !typedItem.validity_months ? 'Sí' : ''}
                                            </span>
                                        ) : (
                                            <Badge variant="secondary" className="text-sm">
                                                No aplica
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-xl border bg-slate-50/50 p-5 dark:bg-slate-800/30">
                                <div className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Etapas del Flujo de Trabajo</div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {workflowFlags.map((flag) => {
                                        const enabled = Boolean(typedItem[flag.key]);
                                        return (
                                            <div
                                                key={flag.key}
                                                className={`flex items-center gap-3 rounded-lg border p-3 ${
                                                    enabled
                                                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
                                                        : 'bg-white dark:bg-slate-900'
                                                }`}
                                            >
                                                {enabled ? (
                                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                                                ) : (
                                                    <XCircle className="text-muted-foreground h-5 w-5 shrink-0" />
                                                )}
                                                <span className="text-sm">{flag.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </ShowSection>

                <ShowSection id="requirements" title="Requisitos">
                    <Card className="border-0 shadow-md">
                        <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Requisitos Asociados</CardTitle>
                                        <p className="text-muted-foreground text-sm">
                                            {draft.length} requisito{draft.length !== 1 ? 's' : ''} vinculado{draft.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <Button type="button" variant="default" size="sm" onClick={handleSaveRequirements} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    Guardar cambios
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="mb-5">
                                <Field id="add-requirement" label="Agregar requisito">
                                    <Combobox
                                        id="add-requirement"
                                        options={requirementsOptions}
                                        value={selectedToAdd}
                                        onChange={(v) => {
                                            const val = String(v);
                                            setSelectedToAdd(val);
                                            const id = Number(val);
                                            if (Number.isInteger(id) && id > 0) {
                                                addRequirement(id);
                                                setSelectedToAdd('');
                                            }
                                        }}
                                        placeholder="Buscar y seleccionar un requisito…"
                                        searchPlaceholder="Escriba para buscar..."
                                        closeOnSelect={true}
                                    />
                                </Field>
                            </div>

                            {draft.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center">
                                    <ClipboardList className="text-muted-foreground mb-3 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm">No hay requisitos asociados a este trámite.</p>
                                    <p className="text-muted-foreground mt-1 text-xs">Use el buscador de arriba para agregar requisitos.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {draft
                                        .slice()
                                        .sort((a, b) => a.sort_order - b.sort_order)
                                        .map((row, idx) => (
                                            <div
                                                key={row.requirement_id}
                                                className="group flex flex-col gap-3 rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center dark:bg-slate-900"
                                            >
                                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="leading-tight font-medium" title={row.name}>
                                                            {row.name}
                                                        </p>
                                                        <p className="text-muted-foreground mt-0.5 font-mono text-xs">{row.code}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground text-xs">Orden:</span>
                                                        <Input
                                                            type="number"
                                                            className="h-8 w-16 text-center"
                                                            value={String(row.sort_order)}
                                                            onChange={(e) => {
                                                                const next = Number(e.target.value);
                                                                updateRow(row.requirement_id, { sort_order: Number.isFinite(next) ? next : 0 });
                                                            }}
                                                        />
                                                    </div>

                                                    <label className="flex cursor-pointer items-center gap-2">
                                                        <Checkbox
                                                            checked={row.is_required}
                                                            onCheckedChange={(v: CheckedState) =>
                                                                updateRow(row.requirement_id, { is_required: v === true })
                                                            }
                                                        />
                                                        <span className="text-sm">Obligatorio</span>
                                                    </label>

                                                    <label className="flex cursor-pointer items-center gap-2">
                                                        <Checkbox
                                                            checked={row.is_active}
                                                            onCheckedChange={(v: CheckedState) =>
                                                                updateRow(row.requirement_id, { is_active: v === true })
                                                            }
                                                        />
                                                        <span className="text-sm">Activo</span>
                                                    </label>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeRequirement(row.requirement_id)}
                                                        className="text-red-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
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
