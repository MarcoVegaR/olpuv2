import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileText,
    Gavel,
    Image,
    QrCode,
    RotateCcw,
    Search,
    Send,
    Trash2,
    Upload,
    UserCheck,
    Users,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

type SimpleUser = { id: number; name: string };
type InspectionFile = { id: number; type: string; original_name: string; mime: string; size: number };
type ReturnablePhase = { value: string; label: string };

type ExpedienteRequirement = {
    id: number;
    requirement_id: number;
    sort_order: number;
    is_required: boolean;
    is_active: boolean;
    physical_received: boolean;
    notes?: string | null;
    requirement?: { id: number; code: string; name: string; description?: string | null } | null;
    current_file?: { id: number; original_name: string; mime: string; size: number; uploaded_at?: string | null } | null;
};

type ExpedienteEvent = {
    id: number;
    type: string;
    description: string;
    actor_name?: string | null;
    payload?: Record<string, unknown> | null;
    created_at?: string | null;
};

type LatestInspection = {
    id: number;
    observations: string;
    result: string;
    inspected_at?: string | null;
    submitted_at?: string | null;
    files: InspectionFile[];
};

type LatestResponse = {
    id: number;
    content: string;
    submitted_at?: string | null;
    reviewer?: SimpleUser | null;
};

type DecisionFile = { id: number; original_name: string; mime: string; size: number };

type ExpedienteItem = {
    id: number;
    tracking: string;
    qr_token: string;
    status: string;
    numero_receptoria?: string | null;
    codigo_catastral?: string | null;
    observaciones?: string | null;
    is_active: boolean;
    procedure_type?: { id: number; code: string; name: string } | null;
    solicitante?: {
        id: number;
        tipo_documento: string;
        numero_documento: string;
        nombre_razon_social: string;
        telefono?: string | null;
    } | null;
    requirements?: ExpedienteRequirement[];
    events?: ExpedienteEvent[];
    reviewer?: SimpleUser | null;
    reviewer_assigned_at?: string | null;
    inspector?: SimpleUser | null;
    inspector_assigned_at?: string | null;
    decision?: string | null;
    decision_notes?: string | null;
    decision_user?: SimpleUser | null;
    decision_at?: string | null;
    completed_at?: string | null;
    valid_from?: string | null;
    valid_until?: string | null;
    returned_from_status?: string | null;
    return_reason?: string | null;
    latest_inspection?: LatestInspection | null;
    latest_response?: LatestResponse | null;
    decision_files?: DecisionFile[];
};

interface Props extends PageProps {
    item: ExpedienteItem;
    auth?: { can?: Record<string, boolean> };
    statusLabels?: Record<string, string>;
    returnablePhases?: ReturnablePhase[];
    assignableReviewers?: SimpleUser[];
    assignableInspectors?: SimpleUser[];
    phaseWarnings?: string[];
}

export default function ExpedienteShow({
    item,
    auth,
    statusLabels,
    returnablePhases,
    assignableReviewers,
    assignableInspectors,
    phaseWarnings,
}: Props) {
    const can = (p: string) => !!auth?.can?.[p];
    const canReceive = can('expedientes.receive');
    const canFilesView = can('expedientes.files.view');
    const canFilesUpload = can('expedientes.files.upload') || can('expedientes.files.replace');
    const canFilesDelete = can('expedientes.files.delete');
    const canQr = can('expedientes.qr.download');
    const canAssignReviewer = can('expedientes.assign.reviewer');
    const canAssignInspector = can('expedientes.assign.inspector');
    const canInspection = can('expedientes.inspection.submit');
    const canResponse = can('expedientes.response.submit');
    const canDecision = can('expedientes.decision.issue');
    const canReturn = can('expedientes.phase.return');

    const breadcrumbs = [
        { title: 'Trámites', href: '/procedures/expedientes' },
        { title: 'Expediente', href: `/procedures/expedientes/${item.id}` },
    ];

    const requirements = (item.requirements ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const sl = statusLabels ?? {};
    const statusLabel = sl[item.status] ?? item.status ?? '—';

    const [uploadingId, setUploadingId] = React.useState<number | null>(null);
    const fileInputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

    // Workflow form states
    const [reviewerId, setReviewerId] = React.useState<string>('');
    const [inspectorId, setInspectorId] = React.useState<string>('');
    const [inspForm, setInspForm] = React.useState({ observations: '', result: '', inspected_at: '' });
    const [responseContent, setResponseContent] = React.useState('');
    const [decForm, setDecForm] = React.useState({ decision: '', notes: '', valid_from: '', valid_until: '' });
    const [returnForm, setReturnForm] = React.useState({ target_status: '', reason: '' });
    const [submitting, setSubmitting] = React.useState(false);

    const inspPhotosRef = React.useRef<HTMLInputElement | null>(null);
    const inspReportsRef = React.useRef<HTMLInputElement | null>(null);
    const decFilesRef = React.useRef<HTMLInputElement | null>(null);

    const base = `/procedures/expedientes/${item.id}`;

    const handleTogglePhysical = (er: ExpedienteRequirement, next: boolean) => {
        if (!canReceive) return;
        router.patch(
            `${base}/requirements/${er.id}/physical`,
            { received: next },
            {
                preserveScroll: true,
                onStart: () => toast.loading('Actualizando…', { id: 'phys' }),
                onSuccess: () => toast.success('Actualizado', { id: 'phys' }),
                onError: () => toast.error('No se pudo actualizar', { id: 'phys' }),
            },
        );
    };

    const handleUpload = async (er: ExpedienteRequirement, file: File) => {
        if (!canFilesUpload) return;
        setUploadingId(er.id);
        try {
            await new Promise<void>((resolve, reject) => {
                router.post(
                    `${base}/requirements/${er.id}/file`,
                    { file },
                    {
                        forceFormData: true,
                        preserveScroll: true,
                        onStart: () => toast.loading('Cargando archivo…', { id: 'upload' }),
                        onSuccess: () => {
                            toast.success('Archivo cargado', { id: 'upload' });
                            resolve();
                        },
                        onError: () => {
                            toast.error('No se pudo cargar', { id: 'upload' });
                            reject(new Error('upload_failed'));
                        },
                    },
                );
            });
        } finally {
            setUploadingId(null);
        }
    };

    const patchAction = (url: string, data: Record<string, unknown>, msg: string) => {
        setSubmitting(true);
        router.patch(url, data as Record<string, string | number>, {
            preserveScroll: true,
            onStart: () => toast.loading('Procesando…', { id: 'wf' }),
            onSuccess: () => toast.success(msg, { id: 'wf' }),
            onError: (errors) => {
                toast.error((Object.values(errors)[0] as string) || 'Error', { id: 'wf' });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const postAction = (url: string, data: Record<string, unknown>, msg: string) => {
        setSubmitting(true);
        router.post(url, data as Record<string, string | number>, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => toast.loading('Procesando…', { id: 'wf' }),
            onSuccess: () => toast.success(msg, { id: 'wf' }),
            onError: (errors) => {
                toast.error((Object.values(errors)[0] as string) || 'Error', { id: 'wf' });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const statusBadgeVariant = (s: string) => {
        if (s === 'completed') return 'success' as const;
        if (s === 'rejected') return 'destructive' as const;
        if (s === 'suspended' || s === 'partial') return 'outline' as const;
        return 'secondary' as const;
    };

    const resultLabel = (r: string) => {
        if (r === 'favorable') return 'Favorable';
        if (r === 'unfavorable') return 'Desfavorable';
        return 'Con observaciones';
    };
    const decisionLabel = (d: string) => {
        if (d === 'approved') return 'Aprobado';
        if (d === 'rejected') return 'Rechazado';
        if (d === 'partial') return 'Aprobado parcialmente';
        return 'Suspendido';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Expediente ${item.tracking}`} />

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-3">
                            <Link href="/procedures/expedientes" className="text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                {item.tracking}
                            </h1>
                            <Badge variant={statusBadgeVariant(item.status)}>{statusLabel}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{item.procedure_type?.name ?? '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <a href={`${base}/planilla`} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" /> Planilla
                            </a>
                        </Button>
                        {canQr && (
                            <Button variant="outline" asChild>
                                <a href={`${base}/qr`}>
                                    <QrCode className="h-4 w-4" /> QR
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Solicitante */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Solicitante</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm font-medium">{item.solicitante?.nombre_razon_social ?? '—'}</div>
                                <div className="text-muted-foreground text-sm">
                                    {(item.solicitante?.tipo_documento ?? '—') + '-' + (item.solicitante?.numero_documento ?? '')}
                                </div>
                                <div className="text-muted-foreground text-sm">{item.solicitante?.telefono ?? '—'}</div>
                            </CardContent>
                        </Card>

                        {/* Datos */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Datos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <DataRow label="N° Receptoría" value={item.numero_receptoria} />
                                <DataRow label="Código catastral" value={item.codigo_catastral} />
                            </CardContent>
                        </Card>

                        {/* Asignaciones */}
                        {(item.reviewer || item.inspector) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Asignaciones
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {item.reviewer && <DataRow label="Revisor" value={item.reviewer.name} />}
                                    {item.inspector && <DataRow label="Inspector" value={item.inspector.name} />}
                                </CardContent>
                            </Card>
                        )}

                        {/* Decision info */}
                        {item.decision && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Gavel className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Decisión
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <DataRow label="Resultado" value={decisionLabel(item.decision)} />
                                    {item.decision_user && <DataRow label="Emitida por" value={item.decision_user.name} />}
                                    {item.decision_at && <DataRow label="Fecha" value={fmtDate(item.decision_at)} />}
                                    {item.decision_notes && (
                                        <div className="mt-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800/50">{item.decision_notes}</div>
                                    )}
                                    {item.valid_from && <DataRow label="Vigencia" value={`${item.valid_from} — ${item.valid_until ?? '?'}`} />}
                                    {(item.decision_files ?? []).length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <span className="text-muted-foreground text-xs">Documentos adjuntos:</span>
                                            {(item.decision_files ?? []).map((df) => (
                                                <div key={df.id} className="text-sm">
                                                    {df.original_name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Phase validation warnings */}
                        {(phaseWarnings ?? []).length > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                                    <Clock className="h-4 w-4" /> Requisitos pendientes para avanzar
                                </div>
                                <ul className="list-inside list-disc space-y-1 text-sm text-amber-700 dark:text-amber-400">
                                    {(phaseWarnings ?? []).map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Workflow action panel */}
                        <WorkflowActions
                            status={item.status}
                            canAssignReviewer={canAssignReviewer}
                            canAssignInspector={canAssignInspector}
                            canInspection={canInspection}
                            canResponse={canResponse}
                            canDecision={canDecision}
                            canReturn={canReturn}
                            assignableReviewers={assignableReviewers ?? []}
                            assignableInspectors={assignableInspectors ?? []}
                            returnablePhases={returnablePhases ?? []}
                            reviewerId={reviewerId}
                            setReviewerId={setReviewerId}
                            inspectorId={inspectorId}
                            setInspectorId={setInspectorId}
                            inspForm={inspForm}
                            setInspForm={setInspForm}
                            responseContent={responseContent}
                            setResponseContent={setResponseContent}
                            decForm={decForm}
                            setDecForm={setDecForm}
                            returnForm={returnForm}
                            setReturnForm={setReturnForm}
                            submitting={submitting}
                            inspPhotosRef={inspPhotosRef}
                            inspReportsRef={inspReportsRef}
                            decFilesRef={decFilesRef}
                            onAssignReviewer={() => patchAction(`${base}/assign-reviewer`, { reviewer_id: Number(reviewerId) }, 'Revisor asignado')}
                            onAssignInspector={() =>
                                patchAction(`${base}/assign-inspector`, { inspector_id: Number(inspectorId) }, 'Inspector asignado')
                            }
                            onStartInspection={() => patchAction(`${base}/start-inspection`, {}, 'Inspección iniciada')}
                            onSubmitInspection={() => {
                                const fd: Record<string, unknown> = { ...inspForm };
                                const photos = inspPhotosRef.current?.files;
                                const reports = inspReportsRef.current?.files;
                                if (photos?.length) fd.photos = Array.from(photos);
                                if (reports?.length) fd.reports = Array.from(reports);
                                postAction(`${base}/inspection`, fd, 'Inspección registrada');
                            }}
                            onSubmitResponse={() => postAction(`${base}/response`, { content: responseContent }, 'Respuesta técnica enviada')}
                            onIssueDecision={() => {
                                const fd: Record<string, unknown> = { ...decForm };
                                const files = decFilesRef.current?.files;
                                if (files?.length) fd.files = Array.from(files);
                                patchAction(`${base}/decision`, fd, 'Decisión emitida');
                            }}
                            onReturn={() => patchAction(`${base}/return`, returnForm, 'Expediente devuelto')}
                        />

                        {/* Inspection info card */}
                        {item.latest_inspection && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Search className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Inspección
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <DataRow label="Resultado" value={resultLabel(item.latest_inspection.result)} />
                                    {item.latest_inspection.inspected_at && (
                                        <DataRow label="Fecha de inspección" value={item.latest_inspection.inspected_at} />
                                    )}
                                    <div className="rounded bg-gray-50 p-2 text-sm whitespace-pre-wrap dark:bg-gray-800/50">
                                        {item.latest_inspection.observations}
                                    </div>
                                    {item.latest_inspection.files.length > 0 && (
                                        <div className="space-y-1">
                                            <span className="text-muted-foreground text-xs">Archivos:</span>
                                            {item.latest_inspection.files.map((f) => (
                                                <div key={f.id} className="flex items-center gap-2 text-sm">
                                                    {f.type === 'photo' ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                                    {f.original_name}
                                                    <span className="text-muted-foreground text-xs">({Math.round(f.size / 1024)} KB)</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Response info card */}
                        {item.latest_response && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Respuesta Técnica
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {item.latest_response.reviewer && <DataRow label="Revisor" value={item.latest_response.reviewer.name} />}
                                    {item.latest_response.submitted_at && (
                                        <DataRow label="Fecha" value={fmtDate(item.latest_response.submitted_at)} />
                                    )}
                                    <div className="rounded bg-gray-50 p-2 text-sm whitespace-pre-wrap dark:bg-gray-800/50">
                                        {item.latest_response.content}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Checklist */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Checklist de recaudos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {requirements.length === 0 ? (
                                    <div className="text-muted-foreground text-sm">Sin recaudos asociados.</div>
                                ) : (
                                    requirements.map((er) => {
                                        const requiredLabel = er.is_required ? 'Requerido' : 'Opcional';
                                        const file = er.current_file;
                                        return (
                                            <div key={er.id} className="rounded-md border p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-medium">{er.requirement?.name ?? '—'}</div>
                                                            <Badge variant={er.is_required ? 'default' : 'secondary'}>{requiredLabel}</Badge>
                                                        </div>
                                                        <div className="text-muted-foreground font-mono text-xs">{er.requirement?.code ?? ''}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            disabled={!canReceive}
                                                            checked={er.physical_received}
                                                            onCheckedChange={(v) => handleTogglePhysical(er, !!v)}
                                                        />
                                                        <span className="text-sm">Consignado</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="text-sm">
                                                        {canFilesView && file ? (
                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    className="text-sky-600 hover:underline dark:text-sky-400"
                                                                    href={`${base}/files/${file.id}`}
                                                                >
                                                                    {file.original_name}
                                                                </a>
                                                                <span className="text-muted-foreground text-xs">
                                                                    ({Math.round((file.size ?? 0) / 1024)} KB)
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Sin archivo</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {canFilesUpload && (
                                                            <>
                                                                <Input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="application/pdf,image/*"
                                                                    disabled={uploadingId === er.id}
                                                                    ref={(el) => {
                                                                        fileInputRefs.current[er.id] = el;
                                                                    }}
                                                                    onChange={(e) => {
                                                                        const f = e.target.files?.[0];
                                                                        e.currentTarget.value = '';
                                                                        if (f) void handleUpload(er, f);
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={uploadingId === er.id}
                                                                    onClick={() => fileInputRefs.current[er.id]?.click()}
                                                                >
                                                                    <Upload className="h-4 w-4" /> {file ? 'Reemplazar' : 'Cargar'}
                                                                </Button>
                                                            </>
                                                        )}
                                                        {canFilesDelete && file && (
                                                            <ConfirmAlert
                                                                trigger={
                                                                    <Button type="button" variant="destructive" size="sm">
                                                                        <Trash2 className="h-4 w-4" /> Eliminar
                                                                    </Button>
                                                                }
                                                                title="Eliminar archivo"
                                                                description="¿Desea eliminar el archivo adjunto?"
                                                                confirmLabel="Eliminar"
                                                                onConfirm={async () => {
                                                                    await new Promise<void>((resolve, reject) => {
                                                                        router.delete(`${base}/files/${file.id}`, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => resolve(),
                                                                            onError: () => reject(new Error('delete_file_failed')),
                                                                        });
                                                                    });
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(item.events ?? []).length === 0 ? (
                                    <div className="text-muted-foreground text-sm">Sin eventos registrados.</div>
                                ) : (
                                    <div className="relative space-y-0">
                                        {(item.events ?? []).map((evt, idx) => {
                                            const isLast = idx === (item.events ?? []).length - 1;
                                            const date = evt.created_at ? new Date(evt.created_at) : null;
                                            const ic = eventIconColor(evt.type);
                                            return (
                                                <div key={evt.id} className="relative flex gap-3 pb-4">
                                                    {!isLast && (
                                                        <div className="absolute top-5 bottom-0 left-[7px] w-px bg-gray-200 dark:bg-gray-700" />
                                                    )}
                                                    <div className={`mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${ic}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium">{evt.description}</div>
                                                        <div className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
                                                            {evt.actor_name && <span>{evt.actor_name}</span>}
                                                            {date && <span>{fmtDate(evt.created_at!)}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

/* ── Workflow action panel ────────────────────────────────── */

type WFProps = {
    status: string;
    canAssignReviewer: boolean;
    canAssignInspector: boolean;
    canInspection: boolean;
    canResponse: boolean;
    canDecision: boolean;
    canReturn: boolean;
    assignableReviewers: SimpleUser[];
    assignableInspectors: SimpleUser[];
    returnablePhases: ReturnablePhase[];
    reviewerId: string;
    setReviewerId: (v: string) => void;
    inspectorId: string;
    setInspectorId: (v: string) => void;
    inspForm: { observations: string; result: string; inspected_at: string };
    setInspForm: React.Dispatch<React.SetStateAction<{ observations: string; result: string; inspected_at: string }>>;
    responseContent: string;
    setResponseContent: (v: string) => void;
    decForm: { decision: string; notes: string; valid_from: string; valid_until: string };
    setDecForm: React.Dispatch<React.SetStateAction<{ decision: string; notes: string; valid_from: string; valid_until: string }>>;
    returnForm: { target_status: string; reason: string };
    setReturnForm: React.Dispatch<React.SetStateAction<{ target_status: string; reason: string }>>;
    submitting: boolean;
    inspPhotosRef: React.RefObject<HTMLInputElement | null>;
    inspReportsRef: React.RefObject<HTMLInputElement | null>;
    decFilesRef: React.RefObject<HTMLInputElement | null>;
    onAssignReviewer: () => void;
    onAssignInspector: () => void;
    onStartInspection: () => void;
    onSubmitInspection: () => void;
    onSubmitResponse: () => void;
    onIssueDecision: () => void;
    onReturn: () => void;
};

function WorkflowActions(p: WFProps) {
    const s = p.status;
    const showAssignReviewer = s === 'received' && p.canAssignReviewer;
    const showAssignInspector = s === 'pending_reviewer' && p.canAssignInspector;
    const showStartInspection = s === 'pending_inspector' && p.canInspection;
    const showSubmitInspection = s === 'in_inspection' && p.canInspection;
    const showSubmitResponse = s === 'pending_response' && p.canResponse;
    const showIssueDecision = s === 'pending_decision' && p.canDecision;
    const showReturn = p.canReturn && p.returnablePhases.length > 0;

    const hasAction =
        showAssignReviewer ||
        showAssignInspector ||
        showStartInspection ||
        showSubmitInspection ||
        showSubmitResponse ||
        showIssueDecision ||
        showReturn;
    if (!hasAction) return null;

    return (
        <Card className="border-sky-200 dark:border-sky-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Acciones del flujo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {showAssignReviewer && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" /> Asignar Revisor
                        </Label>
                        <div className="flex gap-2">
                            <Select value={p.reviewerId} onValueChange={p.setReviewerId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Seleccionar revisor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {p.assignableReviewers.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button disabled={!p.reviewerId || p.submitting} onClick={p.onAssignReviewer}>
                                Asignar
                            </Button>
                        </div>
                    </div>
                )}

                {showAssignInspector && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" /> Asignar Inspector
                        </Label>
                        <div className="flex gap-2">
                            <Select value={p.inspectorId} onValueChange={p.setInspectorId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Seleccionar inspector" />
                                </SelectTrigger>
                                <SelectContent>
                                    {p.assignableInspectors.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button disabled={!p.inspectorId || p.submitting} onClick={p.onAssignInspector}>
                                Asignar
                            </Button>
                        </div>
                    </div>
                )}

                {showStartInspection && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Search className="h-4 w-4" /> Iniciar Inspección
                        </Label>
                        <Button disabled={p.submitting} onClick={p.onStartInspection}>
                            <CheckCircle2 className="h-4 w-4" /> Iniciar
                        </Button>
                    </div>
                )}

                {showSubmitInspection && (
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Search className="h-4 w-4" /> Registrar Inspección
                        </Label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label htmlFor="insp_result">Resultado</Label>
                                <Select value={p.inspForm.result} onValueChange={(v) => p.setInspForm((prev) => ({ ...prev, result: v }))}>
                                    <SelectTrigger id="insp_result">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="favorable">Favorable</SelectItem>
                                        <SelectItem value="unfavorable">Desfavorable</SelectItem>
                                        <SelectItem value="with_observations">Con observaciones</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="insp_date">Fecha inspección</Label>
                                <Input
                                    id="insp_date"
                                    type="date"
                                    value={p.inspForm.inspected_at}
                                    onChange={(e) => p.setInspForm((prev) => ({ ...prev, inspected_at: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="insp_obs">Observaciones</Label>
                            <Textarea
                                id="insp_obs"
                                rows={4}
                                value={p.inspForm.observations}
                                onChange={(e) => p.setInspForm((prev) => ({ ...prev, observations: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Fotos</Label>
                                <Input type="file" multiple accept="image/jpeg,image/png,image/webp" ref={p.inspPhotosRef} />
                            </div>
                            <div className="space-y-1">
                                <Label>Informe (PDF/Word)</Label>
                                <Input type="file" multiple accept=".pdf,.doc,.docx" ref={p.inspReportsRef} />
                            </div>
                        </div>
                        <Button
                            disabled={!p.inspForm.result || !p.inspForm.inspected_at || !p.inspForm.observations || p.submitting}
                            onClick={p.onSubmitInspection}
                        >
                            <CheckCircle2 className="h-4 w-4" /> Registrar inspección
                        </Button>
                    </div>
                )}

                {showSubmitResponse && (
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Send className="h-4 w-4" /> Respuesta Técnica
                        </Label>
                        <Textarea
                            rows={4}
                            value={p.responseContent}
                            onChange={(e) => p.setResponseContent(e.target.value)}
                            placeholder="Escriba la respuesta técnica…"
                        />
                        <Button disabled={!p.responseContent.trim() || p.submitting} onClick={p.onSubmitResponse}>
                            <Send className="h-4 w-4" /> Enviar respuesta
                        </Button>
                    </div>
                )}

                {showIssueDecision && (
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Gavel className="h-4 w-4" /> Emitir Decisión
                        </Label>
                        <Select value={p.decForm.decision} onValueChange={(v) => p.setDecForm((prev) => ({ ...prev, decision: v }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar decisión" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved">Aprobado</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                                <SelectItem value="partial">Aprobado parcialmente</SelectItem>
                                <SelectItem value="suspended">Suspendido</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            rows={3}
                            value={p.decForm.notes}
                            onChange={(e) => p.setDecForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Observaciones (opcional)"
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Vigencia desde</Label>
                                <Input
                                    type="date"
                                    value={p.decForm.valid_from}
                                    onChange={(e) => p.setDecForm((prev) => ({ ...prev, valid_from: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Vigencia hasta</Label>
                                <Input
                                    type="date"
                                    value={p.decForm.valid_until}
                                    onChange={(e) => p.setDecForm((prev) => ({ ...prev, valid_until: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Documento de decisión (PDF/Word)</Label>
                            <Input type="file" multiple accept=".pdf,.doc,.docx" ref={p.decFilesRef} />
                        </div>
                        <Button disabled={!p.decForm.decision || p.submitting} onClick={p.onIssueDecision}>
                            <Gavel className="h-4 w-4" /> Emitir decisión
                        </Button>
                    </div>
                )}

                {showReturn && (
                    <div className="space-y-3 border-t pt-4">
                        <Label className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <RotateCcw className="h-4 w-4" /> Devolver a fase previa
                        </Label>
                        <Select value={p.returnForm.target_status} onValueChange={(v) => p.setReturnForm((prev) => ({ ...prev, target_status: v }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Fase destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {p.returnablePhases.map((ph) => (
                                    <SelectItem key={ph.value} value={ph.value}>
                                        {ph.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            rows={2}
                            value={p.returnForm.reason}
                            onChange={(e) => p.setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
                            placeholder="Motivo de la devolución (obligatorio)"
                        />
                        <Button
                            variant="outline"
                            disabled={!p.returnForm.target_status || !p.returnForm.reason.trim() || p.submitting}
                            onClick={p.onReturn}
                        >
                            <RotateCcw className="h-4 w-4" /> Devolver
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ── Helpers ──────────────────────────────────────────────── */

function DataRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="text-sm font-medium">{value ?? '—'}</span>
        </div>
    );
}

function fmtDate(iso: string): string {
    const d = new Date(iso);
    return (
        d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    );
}

function eventIconColor(type: string): string {
    switch (type) {
        case 'reception_created':
            return 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40';
        case 'reviewer_assigned':
        case 'inspector_assigned':
            return 'border-violet-500 bg-violet-100 dark:bg-violet-900/40';
        case 'inspection_started':
        case 'inspection_submitted':
            return 'border-teal-500 bg-teal-100 dark:bg-teal-900/40';
        case 'response_submitted':
            return 'border-blue-500 bg-blue-100 dark:bg-blue-900/40';
        case 'decision_issued':
            return 'border-amber-500 bg-amber-100 dark:bg-amber-900/40';
        case 'returned_to_phase':
            return 'border-orange-500 bg-orange-100 dark:bg-orange-900/40';
        case 'requirement_received':
            return 'border-sky-500 bg-sky-100 dark:bg-sky-900/40';
        case 'requirement_unreceived':
            return 'border-amber-500 bg-amber-100 dark:bg-amber-900/40';
        case 'file_uploaded':
        case 'file_replaced':
            return 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/40';
        case 'file_deleted':
            return 'border-red-500 bg-red-100 dark:bg-red-900/40';
        default:
            return 'border-gray-400 bg-gray-100 dark:bg-gray-800';
    }
}
