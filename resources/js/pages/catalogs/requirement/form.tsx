import { ErrorSummary } from '@/components/form/ErrorSummary';
import { Field } from '@/components/form/Field';
import { ActiveField } from '@/components/forms/active-field';
import { FormActions } from '@/components/forms/form-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { FileCheck } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type FormMode = 'create' | 'edit';

interface ModelShape {
    id?: number | string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    is_active?: boolean | null;
    sort_order?: number | null;
    updated_at?: string | null;
}

interface PageProps {
    mode: FormMode;
    model?: ModelShape;
}

export default function FormPage(props: PageProps) {
    const mode: FormMode = props.mode ?? 'create';
    const initial = props.model ?? {};

    const form = useForm({
        code: initial.code ?? '',
        name: initial.name ?? '',
        description: initial.description ?? '',
        is_active: Boolean(initial.is_active ?? true),
        sort_order: initial.sort_order ?? null,
        _version: mode === 'edit' ? (initial.updated_at ?? null) : null,
    });

    const breadcrumbs = [
        { title: 'Catálogos', href: '/catalogs' },
        { title: 'Requisitos', href: '/catalogs/requirement' },
        { title: mode === 'edit' ? 'Editar' : 'Crear', href: '' },
    ];

    const firstErrorRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (Object.keys(form.errors).length > 0) {
            firstErrorRef.current?.focus();
        }
    }, [form.errors]);

    function handleCancel() {
        router.visit('/catalogs/requirement', { preserveScroll: true });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (mode === 'create') {
            form.post(route('catalogs.requirement.store'));
        } else {
            const id = initial.id;
            if (id === undefined || id === null || String(id) === '') {
                toast.error('ID inválido para editar');
                return;
            }
            form.put(route('catalogs.requirement.update', id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={mode === 'edit' ? 'Editar Requisito' : 'Crear Requisito'} />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                <div className="py-6 lg:py-10">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                {mode === 'edit' ? 'Editar' : 'Crear'} Requisito
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {mode === 'edit' ? 'Modifica los datos del requisito.' : 'Completa la información para registrar un nuevo requisito.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {Object.keys(form.errors).length > 0 && <ErrorSummary errors={form.errors} className="mb-4" />}

                            <Card className="border-0 shadow-md">
                                <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                            <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Información del Requisito</CardTitle>
                                            <CardDescription>Datos del documento o recaudo requerido</CardDescription>
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
                                                placeholder="REQ-001"
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
                                            <Field id="name" label="Nombre del requisito" error={form.errors.name}>
                                                <Textarea
                                                    name="name"
                                                    value={form.data.name}
                                                    onChange={(e) => form.setData('name', e.target.value)}
                                                    rows={2}
                                                    placeholder="Ej: Copia de la cédula de identidad del solicitante"
                                                />
                                            </Field>
                                        </div>

                                        <div className="md:col-span-2">
                                            <Field id="description" label="Descripción adicional (opcional)" error={form.errors.description}>
                                                <Textarea
                                                    name="description"
                                                    value={form.data.description}
                                                    onChange={(e) => form.setData('description', e.target.value)}
                                                    rows={3}
                                                    placeholder="Información adicional sobre el requisito..."
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {mode === 'edit' && (
                                <Card className="border-0 shadow-md">
                                    <CardContent className="py-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Estado del registro</p>
                                                <p className="text-muted-foreground text-sm">Define si este requisito está activo en el sistema</p>
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

                            <div className="flex items-center justify-between rounded-xl border bg-slate-50/50 p-4 dark:bg-slate-800/30">
                                <p className="text-muted-foreground text-sm">
                                    <span className="text-destructive">*</span> Campos obligatorios
                                </p>
                                <FormActions
                                    onCancel={handleCancel}
                                    isSubmitting={form.processing}
                                    isDirty={true}
                                    submitText={mode === 'create' ? 'Crear Requisito' : 'Guardar Cambios'}
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
