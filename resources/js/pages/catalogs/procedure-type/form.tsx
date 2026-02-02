import { ErrorSummary } from '@/components/form/ErrorSummary';
import { Field } from '@/components/form/Field';
import { ActiveField } from '@/components/forms/active-field';
import { FormActions } from '@/components/forms/form-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { ClipboardList, FileText, Save, Settings2, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type FormMode = 'create' | 'edit';

interface ModelShape {
    id?: number | string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    workflow_requires_review_assignment?: boolean | null;
    workflow_requires_inspector_assignment?: boolean | null;
    workflow_requires_inspection?: boolean | null;
    workflow_requires_technical_response?: boolean | null;
    workflow_requires_decision?: boolean | null;
    inspection_mode?: string | null;
    has_validity?: boolean | null;
    validity_years?: number | null;
    validity_months?: number | null;
    is_active?: boolean | null;
    sort_order?: number | null;
    requirements?: Array<{
        id: number;
        code: string;
        name: string;
        description?: string | null;
        pivot: {
            sort_order: number;
            is_required: boolean;
            is_active: boolean;
        };
    }>;
    updated_at?: string | null;
}

interface RequirementCatalogItem {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
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

interface PageProps {
    mode: FormMode;
    model?: ModelShape;
    requirementsCatalog?: RequirementCatalogItem[];
}

export default function FormPage(props: PageProps) {
    const mode: FormMode = props.mode ?? 'create';
    const initial = props.model ?? {};
    const requirementsCatalog = useMemo(() => props.requirementsCatalog ?? [], [props.requirementsCatalog]);

    const form = useForm({
        code: initial.code ?? '',
        name: initial.name ?? '',
        description: initial.description ?? '',
        workflow_requires_review_assignment: Boolean(initial.workflow_requires_review_assignment ?? false),
        workflow_requires_inspector_assignment: Boolean(initial.workflow_requires_inspector_assignment ?? false),
        workflow_requires_inspection: Boolean(initial.workflow_requires_inspection ?? false),
        workflow_requires_technical_response: Boolean(initial.workflow_requires_technical_response ?? false),
        workflow_requires_decision: Boolean(initial.workflow_requires_decision ?? false),
        inspection_mode: String(initial.inspection_mode ?? 'none'),
        has_validity: Boolean(initial.has_validity ?? false),
        validity_years: initial.validity_years ?? null,
        validity_months: initial.validity_months ?? null,
        is_active: Boolean(initial.is_active ?? true),
        sort_order: initial.sort_order ?? null,
        _version: mode === 'edit' ? (initial.updated_at ?? null) : null,
    });

    const requirementsOptions = useMemo(() => {
        return requirementsCatalog.map((r) => ({
            value: String(r.id),
            label: `${r.name} (${r.code})`,
            disabled: !r.is_active,
        }));
    }, [requirementsCatalog]);

    const initialDraft = useMemo((): RequirementDraftRow[] => {
        const rows = initial.requirements ?? [];
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
    }, [initial.requirements]);

    const [selectedToAdd, setSelectedToAdd] = useState<string>('');
    const [draft, setDraft] = useState<RequirementDraftRow[]>(initialDraft);

    useEffect(() => {
        setDraft(initialDraft);
    }, [initialDraft]);

    const requirementsById = useMemo(() => {
        const map = new Map<number, RequirementCatalogItem>();
        for (const r of requirementsCatalog) map.set(r.id, r);
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
        if (mode !== 'edit') return;
        const id = initial.id;
        if (id === undefined || id === null || String(id) === '') return;

        const payload = draft
            .map((d) => ({
                requirement_id: d.requirement_id,
                sort_order: Number.isFinite(d.sort_order) ? d.sort_order : 0,
                is_required: !!d.is_required,
                is_active: !!d.is_active,
            }))
            .sort((a, b) => a.sort_order - b.sort_order);

        router.put(
            route('catalogs.procedure-type.requirements.sync', id),
            { requirements: payload },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const breadcrumbs = [
        { title: 'Catálogos', href: '/catalogs' },
        { title: 'Tipos de trámite', href: '/catalogs/procedure-type' },
        { title: mode === 'edit' ? 'Editar' : 'Crear', href: '' },
    ];

    const firstErrorRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (Object.keys(form.errors).length > 0) {
            firstErrorRef.current?.focus();
        }
    }, [form.errors]);

    function handleCancel() {
        router.visit('/catalogs/procedure-type', { preserveScroll: true });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (mode === 'create') {
            form.post(route('catalogs.procedure-type.store'));
        } else {
            const id = initial.id;
            if (id === undefined || id === null || String(id) === '') {
                toast.error('ID inválido para editar');
                return;
            }
            form.put(route('catalogs.procedure-type.update', id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={mode === 'edit' ? 'Editar Tipo de trámite' : 'Crear Tipo de trámite'} />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <div className="py-6 lg:py-10">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                {mode === 'edit' ? 'Editar' : 'Crear'} Tipo de Trámite
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {mode === 'edit'
                                    ? 'Modifica los datos del tipo de trámite.'
                                    : 'Completa la información para registrar un nuevo tipo de trámite.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {Object.keys(form.errors).length > 0 && <ErrorSummary errors={form.errors} className="mb-4" />}

                            {/* Información básica */}
                            <Card className="border-0 shadow-md">
                                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Información Básica</CardTitle>
                                            <CardDescription>Datos principales del tipo de trámite</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field id="code" label="Código" error={form.errors.code}>
                                            <Input
                                                name="code"
                                                ref={firstErrorRef}
                                                autoFocus
                                                value={form.data.code}
                                                onChange={(e) => form.setData('code', e.target.value)}
                                                maxLength={50}
                                                className="font-mono"
                                                placeholder="PR-001"
                                            />
                                        </Field>

                                        <Field id="sort_order" label="Orden de visualización" error={form.errors.sort_order}>
                                            <Input
                                                type="number"
                                                name="sort_order"
                                                value={form.data.sort_order === null ? '' : String(form.data.sort_order)}
                                                onChange={(e) => form.setData('sort_order', e.target.value === '' ? null : Number(e.target.value))}
                                                placeholder="10"
                                            />
                                        </Field>

                                        <div className="md:col-span-2">
                                            <Field id="name" label="Nombre del trámite" error={form.errors.name}>
                                                <Input
                                                    name="name"
                                                    value={form.data.name}
                                                    onChange={(e) => form.setData('name', e.target.value)}
                                                    maxLength={255}
                                                    placeholder="Ej: Factibilidad de Uso Asistencial"
                                                />
                                            </Field>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Field id="description" label="Descripción" error={form.errors.description}>
                                                <Textarea
                                                    name="description"
                                                    value={form.data.description}
                                                    onChange={(e) => form.setData('description', e.target.value)}
                                                    rows={3}
                                                    placeholder="Descripción detallada del tipo de trámite..."
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Configuración del proceso */}
                            <Card className="border-0 shadow-md">
                                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                            <Settings2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Configuración del Proceso</CardTitle>
                                            <CardDescription>Inspección, vigencia y flujo de trabajo</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid gap-6">
                                        {/* Inspección y vigencia */}
                                        <div className="grid gap-5 md:grid-cols-4">
                                            <Field id="inspection_mode" label="Inspección" error={form.errors.inspection_mode}>
                                                <Select
                                                    value={String(form.data.inspection_mode)}
                                                    onValueChange={(v) => form.setData('inspection_mode', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No requiere</SelectItem>
                                                        <SelectItem value="optional">Opcional</SelectItem>
                                                        <SelectItem value="required">Obligatoria</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Field>

                                            <Field id="has_validity" label="Tiene vigencia">
                                                <div className="flex h-10 items-center">
                                                    <ActiveField
                                                        name="has_validity"
                                                        checked={!!form.data.has_validity}
                                                        onChange={(v) => form.setData('has_validity', v)}
                                                        canToggle={true}
                                                        activeLabel="Sí"
                                                        inactiveLabel="No"
                                                    />
                                                </div>
                                            </Field>

                                            <Field id="validity_years" label="Años">
                                                <Input
                                                    type="number"
                                                    name="validity_years"
                                                    value={form.data.validity_years === null ? '' : String(form.data.validity_years)}
                                                    onChange={(e) =>
                                                        form.setData('validity_years', e.target.value === '' ? null : Number(e.target.value))
                                                    }
                                                    disabled={!form.data.has_validity}
                                                    min={0}
                                                    placeholder="0"
                                                />
                                            </Field>

                                            <Field id="validity_months" label="Meses">
                                                <Input
                                                    type="number"
                                                    name="validity_months"
                                                    value={form.data.validity_months === null ? '' : String(form.data.validity_months)}
                                                    onChange={(e) =>
                                                        form.setData('validity_months', e.target.value === '' ? null : Number(e.target.value))
                                                    }
                                                    disabled={!form.data.has_validity}
                                                    min={0}
                                                    max={11}
                                                    placeholder="0"
                                                />
                                            </Field>
                                        </div>

                                        {/* Workflow flags */}
                                        <div className="rounded-xl border bg-slate-50/50 p-5 dark:bg-slate-800/30">
                                            <div className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Etapas del flujo de trabajo
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        checked={!!form.data.workflow_requires_review_assignment}
                                                        onCheckedChange={(v) => form.setData('workflow_requires_review_assignment', v === true)}
                                                    />
                                                    <span className="text-sm">Asignación de revisor</span>
                                                </label>

                                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        checked={!!form.data.workflow_requires_inspector_assignment}
                                                        onCheckedChange={(v) => form.setData('workflow_requires_inspector_assignment', v === true)}
                                                    />
                                                    <span className="text-sm">Asignación de inspector</span>
                                                </label>

                                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        checked={!!form.data.workflow_requires_inspection}
                                                        onCheckedChange={(v) => form.setData('workflow_requires_inspection', v === true)}
                                                    />
                                                    <span className="text-sm">Inspección de campo</span>
                                                </label>

                                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        checked={!!form.data.workflow_requires_technical_response}
                                                        onCheckedChange={(v) => form.setData('workflow_requires_technical_response', v === true)}
                                                    />
                                                    <span className="text-sm">Respuesta técnica</span>
                                                </label>

                                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                                                    <Checkbox
                                                        checked={!!form.data.workflow_requires_decision}
                                                        onCheckedChange={(v) => form.setData('workflow_requires_decision', v === true)}
                                                    />
                                                    <span className="text-sm">Decisión final</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Requisitos asociados (solo en edición) */}
                            {mode === 'edit' && (
                                <Card className="border-0 shadow-md">
                                    <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                                    <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">Requisitos Asociados</CardTitle>
                                                    <CardDescription>
                                                        {draft.length} requisito{draft.length !== 1 ? 's' : ''} vinculado
                                                        {draft.length !== 1 ? 's' : ''}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Button type="button" variant="default" size="sm" onClick={handleSaveRequirements} className="gap-2">
                                                <Save className="h-4 w-4" />
                                                Guardar requisitos
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
                                                        const rid = Number(val);
                                                        if (Number.isInteger(rid) && rid > 0) {
                                                            addRequirement(rid);
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
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Use el buscador de arriba para agregar requisitos.
                                                </p>
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
                                                                    <p className="truncate leading-tight font-medium" title={row.name}>
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
                                                                            updateRow(row.requirement_id, {
                                                                                sort_order: Number.isFinite(next) ? next : 0,
                                                                            });
                                                                        }}
                                                                    />
                                                                </div>

                                                                <label className="flex cursor-pointer items-center gap-2">
                                                                    <Checkbox
                                                                        checked={row.is_required}
                                                                        onCheckedChange={(v) =>
                                                                            updateRow(row.requirement_id, { is_required: v === true })
                                                                        }
                                                                    />
                                                                    <span className="text-sm">Obligatorio</span>
                                                                </label>

                                                                <label className="flex cursor-pointer items-center gap-2">
                                                                    <Checkbox
                                                                        checked={row.is_active}
                                                                        onCheckedChange={(v) =>
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
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Estado (solo en edición) */}
                            {mode === 'edit' && (
                                <Card className="border-0 shadow-md">
                                    <CardContent className="py-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Estado del registro</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Define si este tipo de trámite está activo en el sistema
                                                </p>
                                            </div>
                                            <ActiveField
                                                checked={!!form.data.is_active}
                                                onChange={(v) => form.setData('is_active', v)}
                                                canToggle={true}
                                                activeLabel="Activo"
                                                inactiveLabel="Inactivo"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Acciones del formulario */}
                            <div className="flex items-center justify-between rounded-xl border bg-slate-50/50 p-4 dark:bg-slate-800/30">
                                <p className="text-muted-foreground text-sm">
                                    <span className="text-destructive">*</span> Campos obligatorios
                                </p>
                                <FormActions
                                    onCancel={handleCancel}
                                    isSubmitting={form.processing}
                                    isDirty={true}
                                    submitText={mode === 'create' ? 'Crear Tipo de Trámite' : 'Guardar Cambios'}
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
