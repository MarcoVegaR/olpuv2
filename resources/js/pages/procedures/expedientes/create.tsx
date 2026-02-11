import { ErrorSummary } from '@/components/form/ErrorSummary';
import { Field } from '@/components/form/Field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible, PageProps } from '@inertiajs/core';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

type ProcedureType = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    requirements: Array<{ id: number; code: string; name: string; description?: string | null; is_required: boolean; sort_order: number }>;
};

interface Props extends PageProps {
    procedureTypes: ProcedureType[];
}

interface FormDataShape {
    procedure_type_id: number | '';
    numero_receptoria: string;
    codigo_catastral: string;
    observaciones: string;
    confirm: boolean;
    solicitante_id: number | '';
    presentado_por: {
        nombre: string;
        documento: string;
        telefono: string;
    };
    physical_received_requirement_ids: number[];
    [key: string]: FormDataConvertible;
}

export default function ExpedienteCreate({ procedureTypes }: Props) {
    const form = useForm<FormDataShape>({
        procedure_type_id: '',
        numero_receptoria: '',
        codigo_catastral: '',
        observaciones: '',
        confirm: true,
        solicitante_id: '',
        presentado_por: {
            nombre: '',
            documento: '',
            telefono: '',
        },
        physical_received_requirement_ids: [],
    });

    const [solicitanteQuery, setSolicitanteQuery] = React.useState('');
    const [solicitanteLoading, setSolicitanteLoading] = React.useState(false);
    const [solicitanteOptions, setSolicitanteOptions] = React.useState<Array<{ value: string; label: string }>>([]);
    const [solicitanteMap, setSolicitanteMap] = React.useState<
        Record<
            string,
            {
                id: number;
                tipo_documento: string;
                numero_documento: string;
                nombre_razon_social: string;
                telefono?: string | null;
                email?: string | null;
                direccion?: string | null;
            }
        >
    >({});

    const selectedSolicitante = form.data.solicitante_id ? (solicitanteMap[String(form.data.solicitante_id)] ?? null) : null;

    React.useEffect(() => {
        const q = solicitanteQuery.trim();

        const t = window.setTimeout(async () => {
            setSolicitanteLoading(true);
            try {
                const url = new URL('/procedures/solicitantes/search', window.location.origin);
                if (q) url.searchParams.set('q', q);
                url.searchParams.set('limit', '20');

                const res = await fetch(url.toString(), {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error('search_failed');

                const json = (await res.json()) as {
                    data: Array<{
                        id: number;
                        tipo_documento: string;
                        numero_documento: string;
                        nombre_razon_social: string;
                        telefono?: string | null;
                        email?: string | null;
                        direccion?: string | null;
                    }>;
                };

                const nextMap: typeof solicitanteMap = {};
                const nextOptions = (json.data ?? []).map((s) => {
                    const idStr = String(s.id);
                    nextMap[idStr] = s;
                    return {
                        value: idStr,
                        label: `${s.nombre_razon_social} — ${s.tipo_documento}${s.numero_documento}`,
                    };
                });

                setSolicitanteOptions(nextOptions);
                setSolicitanteMap((prev) => ({ ...prev, ...nextMap }));
            } catch {
                setSolicitanteOptions([]);
            } finally {
                setSolicitanteLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(t);
    }, [solicitanteQuery]);

    const selectedType = React.useMemo(
        () => procedureTypes.find((t) => t.id === form.data.procedure_type_id) ?? null,
        [procedureTypes, form.data.procedure_type_id],
    );

    const errors = form.errors as Record<string, string | undefined>;

    const breadcrumbs = [
        { title: 'Trámites', href: '/procedures/expedientes' },
        { title: 'Recepción', href: '' },
    ];

    const toggleReq = (reqId: number, next: boolean) => {
        const current = new Set(form.data.physical_received_requirement_ids);
        if (next) current.add(reqId);
        else current.delete(reqId);
        form.setData('physical_received_requirement_ids', Array.from(current));
    };

    const toggleAll = (next: boolean) => {
        if (!selectedType) return;
        form.setData('physical_received_requirement_ids', next ? selectedType.requirements.map((r) => r.id) : []);
    };

    const allChecked =
        !!selectedType &&
        selectedType.requirements.length > 0 &&
        selectedType.requirements.every((r) => form.data.physical_received_requirement_ids.includes(r.id));

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.solicitante_id) {
            toast.error('Seleccione un solicitante');
            return;
        }

        if (!form.data.procedure_type_id) {
            toast.error('Seleccione un tipo de trámite');
            return;
        }

        form.transform((data) => ({ ...data, confirm: true }));

        form.post('/procedures/expedientes', {
            preserveScroll: true,
            onStart: () => toast.loading('Creando expediente…', { id: 'create-exp' }),
            onSuccess: () => toast.success('Expediente creado', { id: 'create-exp' }),
            onError: (errs) => {
                const msg = Object.values(errs).flat().join(' ') || 'No se pudo crear el expediente';
                toast.error(msg, { id: 'create-exp' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recepción de expediente" />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                            <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            Recepción de expediente
                        </h1>
                        <p className="text-muted-foreground text-sm">Asocia solicitante + trámite y marca recaudos consignados</p>
                    </div>

                    <Button variant="outline" onClick={() => router.visit('/procedures/expedientes')}>
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <ErrorSummary errors={form.errors} />

                <form onSubmit={onSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Solicitante (Titular)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Field id="solicitante_id" label="Buscar solicitante" required error={errors.solicitante_id}>
                                    <Combobox
                                        options={solicitanteOptions}
                                        value={form.data.solicitante_id ? String(form.data.solicitante_id) : ''}
                                        onChange={(v) => form.setData('solicitante_id', v ? Number(v) : '')}
                                        placeholder="Seleccione un solicitante"
                                        searchPlaceholder="Buscar por nombre o documento…"
                                        emptyText={solicitanteLoading ? 'Buscando…' : 'Sin coincidencias'}
                                        onQueryChange={setSolicitanteQuery}
                                    />
                                </Field>
                            </div>

                            {selectedSolicitante && (
                                <div className="bg-muted/30 rounded-md border p-3 text-sm sm:col-span-2">
                                    <div className="font-medium">{selectedSolicitante.nombre_razon_social}</div>
                                    <div className="text-muted-foreground font-mono text-xs">
                                        {selectedSolicitante.tipo_documento}
                                        {selectedSolicitante.numero_documento}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Datos del trámite</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field id="procedure_type_id" label="Tipo de trámite" required error={form.errors.procedure_type_id}>
                                <Select
                                    disabled={!form.data.solicitante_id}
                                    value={form.data.procedure_type_id ? String(form.data.procedure_type_id) : ''}
                                    onValueChange={(v) => form.setData('procedure_type_id', v ? Number(v) : '')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {procedureTypes.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name} ({t.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field id="numero_receptoria" label="N° receptoría" error={form.errors.numero_receptoria}>
                                <Input
                                    disabled={!form.data.solicitante_id}
                                    value={form.data.numero_receptoria}
                                    onChange={(e) => form.setData('numero_receptoria', e.target.value)}
                                />
                            </Field>

                            <Field id="codigo_catastral" label="Código catastral" error={form.errors.codigo_catastral}>
                                <Input
                                    disabled={!form.data.solicitante_id}
                                    value={form.data.codigo_catastral}
                                    onChange={(e) => form.setData('codigo_catastral', e.target.value)}
                                />
                            </Field>

                            <div className="sm:col-span-2">
                                <Field id="observaciones" label="Observaciones" error={form.errors.observaciones}>
                                    <Textarea
                                        disabled={!form.data.solicitante_id}
                                        value={form.data.observaciones}
                                        onChange={(e) => form.setData('observaciones', e.target.value)}
                                    />
                                </Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Checklist de recaudos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {errors.physical_received_requirement_ids && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                                    {errors.physical_received_requirement_ids}
                                </div>
                            )}
                            {!selectedType ? (
                                <div className="text-muted-foreground text-sm">Seleccione un tipo de trámite para ver sus recaudos.</div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="mb-1 flex items-center gap-2 border-b pb-2">
                                        <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                                        <span className="text-sm font-medium">Seleccionar todos</span>
                                        <span className="text-muted-foreground text-xs">
                                            ({form.data.physical_received_requirement_ids.length}/{selectedType.requirements.length})
                                        </span>
                                    </div>
                                    {selectedType.requirements
                                        .slice()
                                        .sort((a, b) => a.sort_order - b.sort_order)
                                        .map((r) => {
                                            const checked = form.data.physical_received_requirement_ids.includes(r.id);
                                            return (
                                                <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                                                    <div className="min-w-0">
                                                        <div className="font-medium">{r.name}</div>
                                                        <div className="text-muted-foreground font-mono text-xs">{r.code}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox checked={checked} onCheckedChange={(v) => toggleReq(r.id, !!v)} />
                                                        <span className="text-sm">Consignado</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Save className="h-4 w-4" />
                            Crear
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
