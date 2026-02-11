import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { ErrorSummary } from '@/components/form/ErrorSummary';
import { Field } from '@/components/form/Field';
import { ActiveField } from '@/components/forms/active-field';
import { FormActions } from '@/components/forms/form-actions';
import { FormVersion } from '@/components/forms/form-version';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible, PageProps } from '@inertiajs/core';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Mail, MapPin, Phone, Save, User, Users2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { toast } from 'sonner';

type FormMode = 'create' | 'edit';

type SolicitanteModel = {
    id?: number;
    tipo_documento?: string | null;
    numero_documento?: string | null;
    nombre_razon_social?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    is_active?: boolean | null;
    updated_at?: string | null;
};

interface Props extends PageProps {
    mode: FormMode;
    model?: SolicitanteModel;
}

interface FormDataShape {
    tipo_documento: string;
    numero_documento: string;
    nombre_razon_social: string;
    telefono: string;
    email: string;
    direccion: string;
    is_active: boolean;
    _version: string | null;
    [key: string]: FormDataConvertible;
}

const TIPO_DOC_OPTIONS = [
    { value: 'V', label: 'V - Venezolano' },
    { value: 'E', label: 'E - Extranjero' },
    { value: 'P', label: 'P - Pasaporte' },
    { value: 'J', label: 'J - Jurídico' },
    { value: 'G', label: 'G - Gobierno' },
];

export default function SolicitanteForm({ mode, model }: Props) {
    const initial = model ?? {};
    const isEdit = mode === 'edit';

    const form = useForm<FormDataShape>({
        tipo_documento: String(initial.tipo_documento ?? 'V'),
        numero_documento: String(initial.numero_documento ?? ''),
        nombre_razon_social: String(initial.nombre_razon_social ?? ''),
        telefono: String(initial.telefono ?? ''),
        email: String(initial.email ?? ''),
        direccion: String(initial.direccion ?? ''),
        is_active: Boolean(initial.is_active ?? true),
        _version: isEdit ? (initial.updated_at ?? null) : null,
    });

    const initialData = useMemo(
        () => ({
            tipo_documento: String(model?.tipo_documento ?? 'V'),
            numero_documento: String(model?.numero_documento ?? ''),
            nombre_razon_social: String(model?.nombre_razon_social ?? ''),
            telefono: String(model?.telefono ?? ''),
            email: String(model?.email ?? ''),
            direccion: String(model?.direccion ?? ''),
            is_active: Boolean(model?.is_active ?? true),
        }),
        [model],
    );

    const [navConfirm, setNavConfirm] = React.useState<{ open: boolean; resume?: () => void } | null>(null);

    const { clearUnsavedChanges } = useUnsavedChanges(form.data, initialData, true, {
        excludeKeys: ['_token', '_method', '_version'],
        ignoreUnderscored: true,
        confirmMessage: '¿Estás seguro de salir? Los cambios no guardados se perderán.',
        onConfirm: (resume) => {
            setNavConfirm({ open: true, resume });
        },
    });

    const breadcrumbs = [
        { title: 'Trámites', href: '/procedures/expedientes' },
        { title: 'Solicitantes', href: '/procedures/solicitantes' },
        { title: isEdit ? 'Editar' : 'Crear', href: '' },
    ];

    const title = isEdit ? 'Editar solicitante' : 'Nuevo solicitante';
    const subtitle = isEdit ? `${initial.tipo_documento}-${initial.numero_documento}` : 'Complete la información del solicitante';

    const handleCancel = () => {
        router.visit('/procedures/solicitantes');
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.transform((data) => ({ ...data, is_active: !!data.is_active }));

        const options = {
            preserveScroll: true,
            onStart: () => toast.loading('Guardando...', { id: 'save' }),
            onSuccess: () => {
                clearUnsavedChanges();
                toast.success('Guardado correctamente', { id: 'save' });
            },
            onError: () => toast.error('No se pudo guardar', { id: 'save' }),
        };

        if (isEdit) {
            form.put(`/procedures/solicitantes/${initial.id}`, options);
        } else {
            form.post('/procedures/solicitantes', options);
        }
    };

    const isJuridico = form.data.tipo_documento === 'J' || form.data.tipo_documento === 'G';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/procedures/solicitantes" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                {isJuridico ? (
                                    <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                    <Users2 className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                                )}
                                {title}
                            </h1>
                            <p className="text-muted-foreground text-sm">{subtitle}</p>
                        </div>
                    </div>

                    {isEdit && form.data._version && <FormVersion version={form.data._version} />}
                </div>

                <ErrorSummary errors={form.errors} />

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Identificación */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                Identificación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-12">
                                <div className="sm:col-span-4">
                                    <Field id="tipo_documento" label="Tipo de documento" required error={form.errors.tipo_documento}>
                                        <Select value={form.data.tipo_documento} onValueChange={(v) => form.setData('tipo_documento', v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIPO_DOC_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <div className="sm:col-span-4">
                                    <Field id="numero_documento" label="Número de documento" required error={form.errors.numero_documento}>
                                        <Input
                                            placeholder="Ej: 12345678"
                                            value={form.data.numero_documento}
                                            onChange={(e) => form.setData('numero_documento', e.target.value)}
                                        />
                                    </Field>
                                </div>

                                <div className="flex items-end sm:col-span-4">
                                    {isEdit && <ActiveField checked={form.data.is_active} onChange={(v) => form.setData('is_active', v)} />}
                                </div>

                                <div className="sm:col-span-12">
                                    <Field
                                        id="nombre_razon_social"
                                        label={isJuridico ? 'Razón social' : 'Nombre completo'}
                                        required
                                        error={form.errors.nombre_razon_social}
                                    >
                                        <Input
                                            placeholder={isJuridico ? 'Nombre de la empresa' : 'Nombre y apellido'}
                                            value={form.data.nombre_razon_social}
                                            onChange={(e) => form.setData('nombre_razon_social', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacto */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Información de contacto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="telefono" label="Teléfono" error={form.errors.telefono}>
                                    <div className="relative">
                                        <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            className="pl-10"
                                            placeholder="0424-1234567"
                                            value={form.data.telefono}
                                            onChange={(e) => form.setData('telefono', e.target.value)}
                                        />
                                    </div>
                                </Field>

                                <Field id="email" label="Correo electrónico" error={form.errors.email}>
                                    <div className="relative">
                                        <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            type="email"
                                            className="pl-10"
                                            placeholder="correo@ejemplo.com"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                        />
                                    </div>
                                </Field>

                                <div className="sm:col-span-2">
                                    <Field id="direccion" label="Dirección" error={form.errors.direccion}>
                                        <div className="relative">
                                            <MapPin className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                            <Textarea
                                                className="min-h-[80px] pl-10"
                                                placeholder="Dirección completa del solicitante"
                                                value={form.data.direccion}
                                                onChange={(e) => form.setData('direccion', e.target.value)}
                                            />
                                        </div>
                                    </Field>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Acciones */}
                    <FormActions>
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={form.processing}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Save className="h-4 w-4" />
                            {isEdit ? 'Guardar cambios' : 'Crear solicitante'}
                        </Button>
                    </FormActions>
                </form>

                {/* Unsaved changes dialog */}
                {navConfirm && (
                    <ConfirmAlert
                        open={navConfirm.open}
                        onOpenChange={(open) => !open && setNavConfirm(null)}
                        title="Cambios sin guardar"
                        description="Tiene cambios sin guardar. ¿Desea salir de todos modos?"
                        confirmLabel="Salir sin guardar"
                        cancelLabel="Quedarse"
                        onConfirm={() => {
                            clearUnsavedChanges();
                            navConfirm.resume?.();
                            setNavConfirm(null);
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
