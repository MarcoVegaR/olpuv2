import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { MultiFilePicker } from '@/components/form/MultiFilePicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { PageProps } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    Check,
    CheckCircle2,
    ClipboardList,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileCheck,
    FileText,
    FileUp,
    Gavel,
    Hash,
    MapPin,
    Paperclip,
    Pencil,
    Phone,
    QrCode,
    RotateCcw,
    Search,
    Send,
    Trash2,
    User,
    UserCheck,
    Users,
    X,
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
    files?: ResponseFile[];
};

type ResponseFile = { id: number; original_name: string; mime: string; size: number };
type DecisionFile = { id: number; kind: string; original_name: string; mime: string; size: number };

type ExpedienteItem = {
    id: number;
    tracking: string;
    qr_token: string;
    status: string;
    numero_receptoria?: string | null;
    codigo_catastral?: string | null;
    observaciones?: string | null;
    is_active: boolean;
    procedure_type?: {
        id: number;
        code: string;
        name: string;
        inspection_requires_photos?: boolean;
        inspection_requires_report?: boolean;
        decision_requires_document?: boolean;
        has_validity?: boolean;
    } | null;
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
    hasEditRoute?: boolean;
}

/* ── Phase stepper definitions ────────────────────────────── */

const PHASES = [
    { key: 'received', label: 'Recibido' },
    { key: 'pending_reviewer', label: 'Revisor' },
    { key: 'pending_inspector', label: 'Inspector' },
    { key: 'in_inspection', label: 'Inspección' },
    { key: 'pending_response', label: 'Respuesta' },
    { key: 'pending_decision', label: 'Decisión' },
    { key: 'completed', label: 'Completado' },
] as const;

function normalizeWorkflowStatus(status: string): string {
    if (status === 'pending_final_doc' || status === 'pending_final_document') {
        return 'pending_decision';
    }

    return status;
}

function phaseIndex(status: string): number {
    const normalizedStatus = normalizeWorkflowStatus(status);
    const idx = PHASES.findIndex((p) => p.key === normalizedStatus);
    if (['completed', 'rejected', 'partial', 'suspended'].includes(normalizedStatus)) return PHASES.length - 1;
    return idx >= 0 ? idx : 0;
}

export default function ExpedienteShow({
    item,
    auth,
    statusLabels,
    returnablePhases,
    assignableReviewers,
    assignableInspectors,
    phaseWarnings,
    hasEditRoute,
}: Props) {
    const can = (p: string) => !!auth?.can?.[p];
    const canReceive = can('expedientes.receive');
    const canUpdate = !!hasEditRoute;
    const canFilesView = can('expedientes.files.view');
    const canFilesUpload = can('expedientes.files.upload') || can('expedientes.files.replace');
    const canFilesDelete = can('expedientes.files.delete');
    const canQr = can('expedientes.qr.download');
    const canAssignReviewer = can('expedientes.assign.reviewer');
    const canAssignInspector = can('expedientes.assign.inspector');
    const canInspection = can('expedientes.inspection.submit');
    const canResponse = can('expedientes.response.submit');
    const canDecision = can('expedientes.decision.issue');
    const canDecisionFiles = can('expedientes.decision.files');
    const canReturn = can('expedientes.phase.return');

    const breadcrumbs = [
        { title: 'Trámites', href: '/procedures/expedientes' },
        { title: 'Expediente', href: `/procedures/expedientes/${item.id}` },
    ];

    const requirements = (item.requirements ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const normalizedStatus = normalizeWorkflowStatus(item.status);
    const sl = statusLabels ?? {};
    const statusLabel = sl[item.status] ?? sl[normalizedStatus] ?? normalizedStatus ?? '—';

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

    const [inspPhotos, setInspPhotos] = React.useState<File[]>([]);
    const [inspReports, setInspReports] = React.useState<File[]>([]);
    const [responseFiles, setResponseFiles] = React.useState<File[]>([]);
    const [decFiles, setDecFiles] = React.useState<File[]>([]);
    const [finalDecisionFiles, setFinalDecisionFiles] = React.useState<File[]>([]);

    // Edit form state
    const [editing, setEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState({
        solicitante_id: item.solicitante?.id ?? '',
        numero_receptoria: item.numero_receptoria ?? '',
        codigo_catastral: item.codigo_catastral ?? '',
        observaciones: item.observaciones ?? '',
    });

    const base = `/procedures/expedientes/${item.id}`;

    const handleSaveEdit = () => {
        router.put(base, editForm as unknown as Record<string, string | number>, {
            preserveScroll: true,
            onStart: () => toast.loading('Guardando…', { id: 'edit' }),
            onSuccess: () => {
                toast.success('Expediente actualizado', { id: 'edit' });
                setEditing(false);
            },
            onError: (errs) => {
                const msg = Object.values(errs).flat().join(' ') || 'Error al actualizar';
                toast.error(msg, { id: 'edit' });
            },
        });
    };

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
                const msgs = Object.values(errors).flat().filter(Boolean);
                toast.error(msgs.join(' • ') || 'Error', { id: 'wf' });
            },
            onFinish: () => setSubmitting(false),
        });
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

    // Computed values for checklist progress
    const totalReqs = requirements.length;
    const receivedReqs = requirements.filter((r) => r.physical_received).length;
    const progressPct = totalReqs > 0 ? Math.round((receivedReqs / totalReqs) * 100) : 0;
    const currentPhase = phaseIndex(item.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Expediente ${item.tracking}`} />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                {/* ── Header ──────────────────────────────────────── */}
                <div className="mb-8">
                    {/* Back link */}
                    <Link
                        href="/procedures/expedientes"
                        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-base transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Volver a expedientes
                    </Link>

                    {/* Title row: name + status */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.procedure_type?.name ?? 'Expediente'}</h1>
                            <p className="text-muted-foreground mt-1 font-mono text-sm">{item.tracking}</p>
                        </div>
                        <div
                            className={cn(
                                'mt-1 shrink-0 rounded-xl px-5 py-2.5 text-base font-bold',
                                item.status === 'completed' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
                                item.status === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                                (item.status === 'suspended' || item.status === 'partial') &&
                                    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                                !['completed', 'rejected', 'suspended', 'partial'].includes(item.status) &&
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                            )}
                        >
                            {statusLabel}
                        </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {canUpdate && (
                            <Button variant="outline" size="lg" className="text-base" onClick={() => setEditing((v) => !v)}>
                                {editing ? <X className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                                {editing ? 'Cancelar edición' : 'Editar datos'}
                            </Button>
                        )}
                        <Button variant="outline" size="lg" className="text-base" asChild>
                            <a href={`${base}/planilla`} target="_blank" rel="noreferrer">
                                <Download className="h-5 w-5" /> Descargar Planilla
                            </a>
                        </Button>
                        {canQr && (
                            <Button variant="outline" size="lg" className="text-base" asChild>
                                <a href={`${base}/qr`}>
                                    <QrCode className="h-5 w-5" /> Descargar QR
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Progress Stepper ────────────────────────────── */}
                <Card className="mb-8">
                    <CardContent className="px-4 py-5 sm:px-6">
                        <h2 className="mb-4 text-center text-lg font-semibold">Progreso del trámite</h2>
                        <div className="flex items-center justify-between">
                            {PHASES.map((phase, idx) => {
                                const isDone = idx < currentPhase;
                                const isCurrent = idx === currentPhase;
                                const isRejected = item.status === 'rejected' && idx === PHASES.length - 1;
                                return (
                                    <React.Fragment key={phase.key}>
                                        {idx > 0 && (
                                            <div
                                                className={cn(
                                                    'hidden h-1.5 flex-1 rounded-full sm:block',
                                                    isDone ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700',
                                                )}
                                            />
                                        )}
                                        <div className="flex flex-col items-center gap-2">
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 items-center justify-center rounded-full text-base font-bold transition-colors sm:h-11 sm:w-11',
                                                    isDone && 'bg-emerald-500 text-white shadow-md',
                                                    isCurrent && !isRejected && 'ring-primary/30 bg-primary text-primary-foreground shadow-md ring-4',
                                                    isCurrent &&
                                                        isRejected &&
                                                        'bg-destructive text-destructive-foreground shadow-md ring-4 ring-red-200 dark:ring-red-900',
                                                    !isDone && !isCurrent && 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
                                                )}
                                            >
                                                {isDone ? <Check className="h-5 w-5" /> : idx + 1}
                                            </div>
                                            <span
                                                className={cn(
                                                    'hidden text-center text-xs font-medium sm:block sm:text-base',
                                                    isDone && 'text-emerald-600 dark:text-emerald-400',
                                                    isCurrent && 'text-primary font-bold',
                                                    !isDone && !isCurrent && 'text-muted-foreground',
                                                )}
                                            >
                                                {phase.label}
                                            </span>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        {/* Mobile: show current phase name */}
                        <p className="text-primary mt-3 text-center text-base font-semibold sm:hidden">Paso actual: {PHASES[currentPhase]?.label}</p>
                    </CardContent>
                </Card>

                {/* ── Phase warnings ──────────────────────────────── */}
                {(phaseWarnings ?? []).length > 0 && (
                    <div className="mb-8 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
                        <div className="mb-2 flex items-center gap-3 text-lg font-bold text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="h-6 w-6" />
                            Requisitos pendientes para avanzar
                        </div>
                        <ul className="list-inside list-disc space-y-1.5 text-base text-amber-700 dark:text-amber-400">
                            {(phaseWarnings ?? []).map((w, i) => (
                                <li key={i}>{w}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ── Inline Edit Form ──────────────────────────── */}
                {editing && canUpdate && (
                    <Card className="mb-8 border-2 border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Editar datos del expediente
                            </CardTitle>
                            <p className="text-muted-foreground text-sm">Solo disponible mientras el expediente está en fase «Recibido».</p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <Label className="mb-1.5 block text-sm font-medium">Solicitante</Label>
                                    <div className="flex items-center gap-3 rounded-md border bg-gray-50 px-3 py-2.5 dark:bg-gray-800/50">
                                        <User className="text-muted-foreground h-4 w-4 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium">{item.solicitante?.nombre_razon_social ?? '—'}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {item.solicitante?.tipo_documento}-{item.solicitante?.numero_documento}
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            className="w-20 text-center text-xs"
                                            value={editForm.solicitante_id}
                                            onChange={(e) =>
                                                setEditForm((f) => ({ ...f, solicitante_id: e.target.value ? Number(e.target.value) : '' }))
                                            }
                                            title="ID del solicitante (cambiar solo si es necesario)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label className="mb-1.5 block text-sm font-medium">N° Receptoría</Label>
                                    <Input
                                        value={editForm.numero_receptoria}
                                        onChange={(e) => setEditForm((f) => ({ ...f, numero_receptoria: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1.5 block text-sm font-medium">Código catastral</Label>
                                    <Input
                                        value={editForm.codigo_catastral}
                                        onChange={(e) => setEditForm((f) => ({ ...f, codigo_catastral: e.target.value }))}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label className="mb-1.5 block text-sm font-medium">Observaciones</Label>
                                    <Textarea
                                        rows={2}
                                        value={editForm.observaciones}
                                        onChange={(e) => setEditForm((f) => ({ ...f, observaciones: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditing(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveEdit}>
                                    <Check className="h-4 w-4" /> Guardar cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Workflow Actions (prominent) ────────────────── */}
                <WorkflowActions
                    status={normalizedStatus}
                    hasDecision={!!item.decision}
                    inspectionRequiresPhotos={!!item.procedure_type?.inspection_requires_photos}
                    inspectionRequiresReport={!!item.procedure_type?.inspection_requires_report}
                    procedureHasValidity={!!item.procedure_type?.has_validity}
                    canAssignReviewer={canAssignReviewer}
                    canAssignInspector={canAssignInspector}
                    canInspection={canInspection}
                    canResponse={canResponse}
                    canDecision={canDecision}
                    canDecisionFiles={canDecisionFiles}
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
                    inspPhotos={inspPhotos}
                    setInspPhotos={setInspPhotos}
                    inspReports={inspReports}
                    setInspReports={setInspReports}
                    responseFiles={responseFiles}
                    setResponseFiles={setResponseFiles}
                    decFiles={decFiles}
                    setDecFiles={setDecFiles}
                    finalDecisionFiles={finalDecisionFiles}
                    setFinalDecisionFiles={setFinalDecisionFiles}
                    onAssignReviewer={() => patchAction(`${base}/assign-reviewer`, { reviewer_id: Number(reviewerId) }, 'Revisor asignado')}
                    onAssignInspector={() => patchAction(`${base}/assign-inspector`, { inspector_id: Number(inspectorId) }, 'Inspector asignado')}
                    onStartInspection={() => patchAction(`${base}/start-inspection`, {}, 'Inspección iniciada')}
                    onSubmitInspection={() => {
                        const fd: Record<string, unknown> = { ...inspForm };
                        if (inspPhotos.length) fd.photos = inspPhotos;
                        if (inspReports.length) fd.reports = inspReports;
                        postAction(`${base}/inspection`, fd, 'Inspección registrada');
                    }}
                    onSubmitResponse={() => {
                        const fd: Record<string, unknown> = { content: responseContent };
                        if (responseFiles.length) fd.files = responseFiles;
                        postAction(`${base}/response`, fd, 'Respuesta técnica enviada');
                    }}
                    onIssueDecision={() => {
                        const fd: Record<string, unknown> = { ...decForm };
                        if (decFiles.length) fd.correction_files = decFiles;
                        postAction(`${base}/decision`, { ...fd, _method: 'patch' }, 'Decisión emitida');
                    }}
                    onUploadFinalDecisionDocument={() => {
                        const fd: Record<string, unknown> = {};
                        if (finalDecisionFiles.length) fd.files = finalDecisionFiles;
                        postAction(`${base}/decision-document`, fd, 'Documento final adjuntado');
                    }}
                    onReturn={() => patchAction(`${base}/return`, returnForm, 'Expediente devuelto')}
                />

                {/* ── Tabbed Content ────────────────────────────── */}
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="mb-4 w-full justify-start">
                        <TabsTrigger value="info" className="gap-1.5 text-sm">
                            <ClipboardList className="h-4 w-4" /> Información
                        </TabsTrigger>
                        <TabsTrigger value="recaudos" className="gap-1.5 text-sm">
                            <FileCheck className="h-4 w-4" /> Recaudos
                            {totalReqs > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {receivedReqs}/{totalReqs}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="historial" className="gap-1.5 text-sm">
                            <Clock className="h-4 w-4" /> Historial
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Tab: Información ──────────────────────────── */}
                    <TabsContent value="info">
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Solicitante */}
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4 text-blue-500" /> Solicitante
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="text-base font-semibold">{item.solicitante?.nombre_razon_social ?? '—'}</div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                        {(item.solicitante?.tipo_documento ?? '—') + '-' + (item.solicitante?.numero_documento ?? '')}
                                    </div>
                                    {item.solicitante?.telefono && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                            {item.solicitante.telefono}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Datos del expediente */}
                            <Card className="border-l-4 border-l-emerald-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ClipboardList className="h-4 w-4 text-emerald-500" /> Datos del expediente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="N° Receptoría" value={item.numero_receptoria} />
                                    <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Código catastral" value={item.codigo_catastral} />
                                    {item.observaciones && (
                                        <div className="rounded-md bg-gray-50 p-2.5 text-sm dark:bg-gray-800/50">
                                            <span className="text-muted-foreground text-xs font-medium">Observaciones:</span>
                                            <p className="mt-0.5">{item.observaciones}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Asignaciones */}
                            {(item.reviewer || item.inspector) && (
                                <Card className="border-l-4 border-l-violet-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Users className="h-4 w-4 text-violet-500" /> Personas asignadas
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {item.reviewer && (
                                            <InfoRow icon={<UserCheck className="h-3.5 w-3.5" />} label="Revisor" value={item.reviewer.name} />
                                        )}
                                        {item.inspector && (
                                            <InfoRow icon={<Search className="h-3.5 w-3.5" />} label="Inspector" value={item.inspector.name} />
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Decision */}
                            {item.decision && (
                                <Card
                                    className={cn(
                                        'border-l-4',
                                        item.decision === 'approved' && 'border-l-emerald-500',
                                        item.decision === 'rejected' && 'border-l-red-500',
                                        (item.decision === 'partial' || item.decision === 'suspended') && 'border-l-amber-500',
                                    )}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Gavel className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Decisión final
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="text-base font-bold">{decisionLabel(item.decision)}</div>
                                        {item.decision_user && (
                                            <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Emitida por" value={item.decision_user.name} />
                                        )}
                                        {item.decision_at && (
                                            <InfoRow
                                                icon={<CalendarDays className="h-3.5 w-3.5" />}
                                                label="Fecha"
                                                value={fmtDate(item.decision_at)}
                                            />
                                        )}
                                        {item.decision_notes && (
                                            <div className="rounded-md bg-gray-50 p-2.5 dark:bg-gray-800/50">{item.decision_notes}</div>
                                        )}
                                        {item.valid_from && (
                                            <InfoRow
                                                icon={<CalendarDays className="h-3.5 w-3.5" />}
                                                label="Vigencia"
                                                value={`${item.valid_from} — ${item.valid_until ?? '?'}`}
                                            />
                                        )}
                                        {(() => {
                                            const corrections = (item.decision_files ?? []).filter((df) => df.kind === 'correction');
                                            const finalDocs = (item.decision_files ?? []).filter((df) => df.kind === 'decision_document');

                                            if (corrections.length === 0 && finalDocs.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div className="space-y-2">
                                                    {finalDocs.length > 0 && (
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground text-xs font-medium">
                                                                Documento final firmado:
                                                            </span>
                                                            {finalDocs.map((df) => (
                                                                <a
                                                                    key={df.id}
                                                                    href={`${base}/decision-files/${df.id}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                                >
                                                                    <FileText className="h-3.5 w-3.5" /> {df.original_name}
                                                                    <span className="text-muted-foreground text-xs">
                                                                        ({Math.round(df.size / 1024)} KB)
                                                                    </span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {corrections.length > 0 && (
                                                        <div className="space-y-1">
                                                            <span className="text-muted-foreground text-xs font-medium">
                                                                Correcciones de dirección:
                                                            </span>
                                                            {corrections.map((df) => (
                                                                <a
                                                                    key={df.id}
                                                                    href={`${base}/decision-files/${df.id}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                                >
                                                                    <Paperclip className="h-3.5 w-3.5" /> {df.original_name}
                                                                    <span className="text-muted-foreground text-xs">
                                                                        ({Math.round(df.size / 1024)} KB)
                                                                    </span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Inspection */}
                            {item.latest_inspection && (
                                <Card className="border-l-4 border-l-teal-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Search className="h-4 w-4 text-teal-500" /> Resultado de la inspección
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="text-base font-bold">{resultLabel(item.latest_inspection.result)}</div>
                                        {item.latest_inspection.inspected_at && (
                                            <InfoRow
                                                icon={<CalendarDays className="h-3.5 w-3.5" />}
                                                label="Fecha"
                                                value={fmtDate(item.latest_inspection.inspected_at)}
                                            />
                                        )}
                                        <div className="rounded-md bg-gray-50 p-2.5 whitespace-pre-wrap dark:bg-gray-800/50">
                                            {item.latest_inspection.observations}
                                        </div>
                                        {(() => {
                                            const photos = item.latest_inspection!.files.filter((f) => f.type === 'photo');
                                            const reports = item.latest_inspection!.files.filter((f) => f.type === 'report');
                                            return (
                                                <>
                                                    {photos.length > 0 && (
                                                        <div>
                                                            <span className="text-muted-foreground text-xs font-medium">
                                                                Fotos ({photos.length}):
                                                            </span>
                                                            <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                                {photos.map((f) => (
                                                                    <a
                                                                        key={f.id}
                                                                        href={`${base}/inspection-files/${f.id}?inline=1`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="group relative block aspect-square overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-800"
                                                                    >
                                                                        <img
                                                                            src={`${base}/inspection-files/${f.id}?inline=1`}
                                                                            alt={f.original_name}
                                                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                                            loading="lazy"
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                                                                            <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {reports.length > 0 && (
                                                        <div>
                                                            <span className="text-muted-foreground text-xs font-medium">
                                                                Informes ({reports.length}):
                                                            </span>
                                                            <div className="mt-1 space-y-1">
                                                                {reports.map((f) => (
                                                                    <a
                                                                        key={f.id}
                                                                        href={`${base}/inspection-files/${f.id}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                                    >
                                                                        <FileText className="h-3.5 w-3.5" /> {f.original_name}
                                                                        <span className="text-muted-foreground text-xs">
                                                                            ({Math.round(f.size / 1024)} KB)
                                                                        </span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Technical response */}
                            {item.latest_response && (
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Send className="h-4 w-4 text-blue-500" /> Respuesta técnica
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {item.latest_response.reviewer && (
                                            <InfoRow
                                                icon={<User className="h-3.5 w-3.5" />}
                                                label="Revisor"
                                                value={item.latest_response.reviewer.name}
                                            />
                                        )}
                                        {item.latest_response.submitted_at && (
                                            <InfoRow
                                                icon={<CalendarDays className="h-3.5 w-3.5" />}
                                                label="Fecha"
                                                value={fmtDate(item.latest_response.submitted_at)}
                                            />
                                        )}
                                        <div className="rounded-md bg-gray-50 p-2.5 whitespace-pre-wrap dark:bg-gray-800/50">
                                            {item.latest_response.content}
                                        </div>
                                        {(item.latest_response.files ?? []).length > 0 && (
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground text-xs font-medium">Adjuntos de respuesta:</span>
                                                {(item.latest_response.files ?? []).map((f) => (
                                                    <a
                                                        key={f.id}
                                                        href={`${base}/response-files/${f.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" /> {f.original_name}
                                                        <span className="text-muted-foreground text-xs">({Math.round(f.size / 1024)} KB)</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── Tab: Recaudos ─────────────────────────────── */}
                    <TabsContent value="recaudos">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    Documentos requeridos
                                </CardTitle>
                                {totalReqs > 0 && (
                                    <div className="mt-2">
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {receivedReqs} de {totalReqs} consignados
                                            </span>
                                            <span className="font-bold">{progressPct}%</span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-all duration-500',
                                                    progressPct === 100 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-blue-500' : 'bg-amber-500',
                                                )}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {requirements.length === 0 ? (
                                    <div className="text-muted-foreground py-4 text-center text-sm">Sin recaudos asociados.</div>
                                ) : (
                                    requirements.map((er, reqIdx) => {
                                        const file = er.current_file;
                                        const isReceived = er.physical_received;
                                        return (
                                            <div
                                                key={er.id}
                                                className={cn(
                                                    'rounded-lg border px-3 py-2.5 transition-colors',
                                                    isReceived
                                                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                                                        : 'border-amber-200 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-950/10',
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                        <span
                                                            className={cn(
                                                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                                                isReceived
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200',
                                                            )}
                                                        >
                                                            {isReceived ? <Check className="h-3.5 w-3.5" /> : reqIdx + 1}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="text-sm leading-snug font-medium">{er.requirement?.name ?? '—'}</span>
                                                            {!er.is_required && (
                                                                <span className="text-muted-foreground ml-1 text-xs">(opcional)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={!canReceive}
                                                        onClick={() => handleTogglePhysical(er, !isReceived)}
                                                        className={cn(
                                                            'flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                                                            isReceived
                                                                ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                                : 'border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
                                                            !canReceive && 'cursor-not-allowed opacity-60',
                                                        )}
                                                    >
                                                        <Checkbox checked={isReceived} className="pointer-events-none h-4 w-4" tabIndex={-1} />
                                                        {isReceived ? 'Consignado' : 'Pendiente'}
                                                    </button>
                                                </div>
                                                {/* File row */}
                                                <div className="mt-1.5 flex flex-col gap-1.5 border-t border-gray-200/60 pt-1.5 dark:border-gray-700/40">
                                                    {canFilesView && file && file.mime?.startsWith('image/') && (
                                                        <a
                                                            href={`${base}/files/${file.id}?inline=1`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="group relative block h-24 w-24 overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-800"
                                                        >
                                                            <img
                                                                src={`${base}/files/${file.id}?inline=1`}
                                                                alt={file.original_name}
                                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                                loading="lazy"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                                                                <ExternalLink className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                                                            </div>
                                                        </a>
                                                    )}
                                                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="text-xs">
                                                            {canFilesView && file ? (
                                                                <a
                                                                    className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                                    href={`${base}/files/${file.id}${file.mime === 'application/pdf' ? '?inline=1' : ''}`}
                                                                    target={file.mime === 'application/pdf' ? '_blank' : undefined}
                                                                    rel={file.mime === 'application/pdf' ? 'noreferrer' : undefined}
                                                                >
                                                                    <Paperclip className="h-3.5 w-3.5" /> {file.original_name}{' '}
                                                                    <span className="text-muted-foreground">
                                                                        ({Math.round((file.size ?? 0) / 1024)} KB)
                                                                    </span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted-foreground inline-flex items-center gap-1">
                                                                    <Paperclip className="h-3.5 w-3.5" /> Sin archivo
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
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
                                                                        <FileUp className="h-3.5 w-3.5" /> {file ? 'Reemplazar' : 'Subir'}
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {canFilesDelete && file && (
                                                                <ConfirmAlert
                                                                    trigger={
                                                                        <Button type="button" variant="destructive" size="sm">
                                                                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                                                        </Button>
                                                                    }
                                                                    title="Eliminar archivo"
                                                                    description="¿Desea eliminar el archivo adjunto?"
                                                                    confirmLabel="Sí, eliminar"
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
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Tab: Historial ────────────────────────────── */}
                    <TabsContent value="historial">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Historial de actividades
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(item.events ?? []).length === 0 ? (
                                    <div className="text-muted-foreground py-4 text-center text-sm">Sin eventos registrados.</div>
                                ) : (
                                    <div className="relative space-y-0">
                                        {(item.events ?? []).map((evt, idx) => {
                                            const isLast = idx === (item.events ?? []).length - 1;
                                            const date = evt.created_at ? new Date(evt.created_at) : null;
                                            const ic = eventIconColor(evt.type);
                                            return (
                                                <div key={evt.id} className="relative flex gap-3 pb-5">
                                                    {!isLast && (
                                                        <div className="absolute top-7 bottom-0 left-[11px] w-0.5 bg-gray-200 dark:bg-gray-700" />
                                                    )}
                                                    <div className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 ${ic}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm leading-snug font-medium">{evt.description}</div>
                                                        <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 text-xs">
                                                            {evt.actor_name && <span className="font-medium">{evt.actor_name}</span>}
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
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

/* ── Workflow action panel ────────────────────────────────── */

type WFProps = {
    status: string;
    hasDecision: boolean;
    inspectionRequiresPhotos: boolean;
    inspectionRequiresReport: boolean;
    procedureHasValidity: boolean;
    canAssignReviewer: boolean;
    canAssignInspector: boolean;
    canInspection: boolean;
    canResponse: boolean;
    canDecision: boolean;
    canDecisionFiles: boolean;
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
    inspPhotos: File[];
    setInspPhotos: React.Dispatch<React.SetStateAction<File[]>>;
    inspReports: File[];
    setInspReports: React.Dispatch<React.SetStateAction<File[]>>;
    responseFiles: File[];
    setResponseFiles: React.Dispatch<React.SetStateAction<File[]>>;
    decFiles: File[];
    setDecFiles: React.Dispatch<React.SetStateAction<File[]>>;
    finalDecisionFiles: File[];
    setFinalDecisionFiles: React.Dispatch<React.SetStateAction<File[]>>;
    onAssignReviewer: () => void;
    onAssignInspector: () => void;
    onStartInspection: () => void;
    onSubmitInspection: () => void;
    onSubmitResponse: () => void;
    onIssueDecision: () => void;
    onUploadFinalDecisionDocument: () => void;
    onReturn: () => void;
};

function WorkflowActions(p: WFProps) {
    const s = p.status;
    const showAssignReviewer = s === 'received' && p.canAssignReviewer;
    const showAssignInspector = s === 'pending_reviewer' && p.canAssignInspector;
    const showStartInspection = s === 'pending_inspector' && p.canInspection;
    const showSubmitInspection = s === 'in_inspection' && p.canInspection;
    const showSubmitResponse = s === 'pending_response' && p.canResponse;
    const showIssueDecision = s === 'pending_decision' && p.canDecision && !p.hasDecision;
    const showUploadFinalDecisionDocument = s === 'pending_decision' && p.canDecisionFiles && p.hasDecision;
    const showReturn = p.canReturn && p.returnablePhases.length > 0;

    const hasAction =
        showAssignReviewer ||
        showAssignInspector ||
        showStartInspection ||
        showSubmitInspection ||
        showSubmitResponse ||
        showIssueDecision ||
        showUploadFinalDecisionDocument ||
        showReturn;
    if (!hasAction) return null;

    const inspectionObservations = p.inspForm.observations.trim();
    const responseText = p.responseContent.trim();
    const decisionNeedsValidity = p.procedureHasValidity && p.decForm.decision === 'approved';
    const decisionHasDateRange = !!p.decForm.valid_from && !!p.decForm.valid_until;
    const decisionDateRangeInvalid = decisionHasDateRange && p.decForm.valid_until < p.decForm.valid_from;
    const canSubmitInspection =
        !!p.inspForm.result &&
        !!p.inspForm.inspected_at &&
        !!inspectionObservations &&
        (!p.inspectionRequiresPhotos || p.inspPhotos.length > 0) &&
        (!p.inspectionRequiresReport || p.inspReports.length > 0) &&
        !p.submitting;
    const canSubmitResponse = !!responseText && !p.submitting;
    const canIssueDecision = !!p.decForm.decision && (!decisionNeedsValidity || (decisionHasDateRange && !decisionDateRangeInvalid)) && !p.submitting;
    const canUploadFinalDecisionDocument = p.finalDecisionFiles.length > 0 && !p.submitting;

    return (
        <Card className="mb-8 border-2 border-sky-300 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-950/20">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-lg">
                    <Eye className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    Acciones del flujo
                </CardTitle>
                <p className="text-muted-foreground text-base">Realice la siguiente acción para avanzar el trámite.</p>
            </CardHeader>
            <CardContent className="space-y-5">
                {showAssignReviewer && (
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <UserCheck className="h-5 w-5" /> Asignar Revisor
                        </Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Select value={p.reviewerId} onValueChange={p.setReviewerId}>
                                <SelectTrigger className="flex-1 py-3 text-base">
                                    <SelectValue placeholder="Seleccionar revisor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {p.assignableReviewers.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)} className="text-base">
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                size="lg"
                                className="text-base"
                                disabled={!p.reviewerId || p.submitting}
                                onClick={p.onAssignReviewer}
                            >
                                <UserCheck className="h-5 w-5" /> Asignar
                            </Button>
                        </div>
                    </div>
                )}

                {showAssignInspector && (
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <UserCheck className="h-5 w-5" /> Asignar Inspector
                        </Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Select value={p.inspectorId} onValueChange={p.setInspectorId}>
                                <SelectTrigger className="flex-1 py-3 text-base">
                                    <SelectValue placeholder="Seleccionar inspector" />
                                </SelectTrigger>
                                <SelectContent>
                                    {p.assignableInspectors.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)} className="text-base">
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                size="lg"
                                className="text-base"
                                disabled={!p.inspectorId || p.submitting}
                                onClick={p.onAssignInspector}
                            >
                                <UserCheck className="h-5 w-5" /> Asignar
                            </Button>
                        </div>
                    </div>
                )}

                {showStartInspection && (
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <Search className="h-5 w-5" /> Iniciar Inspección
                        </Label>
                        <p className="text-muted-foreground text-base">Al iniciar, el inspector podrá registrar los resultados de su visita.</p>
                        <Button type="button" size="lg" className="text-base" disabled={p.submitting} onClick={p.onStartInspection}>
                            <CheckCircle2 className="h-5 w-5" /> Iniciar inspección
                        </Button>
                    </div>
                )}

                {showSubmitInspection && (
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <Search className="h-5 w-5" /> Registrar Inspección
                        </Label>
                        <p className="text-muted-foreground text-sm">
                            Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="insp_result" className="text-base">
                                    Resultado <span className="text-destructive">*</span>
                                </Label>
                                <Select value={p.inspForm.result} onValueChange={(v) => p.setInspForm((prev) => ({ ...prev, result: v }))}>
                                    <SelectTrigger id="insp_result" className="py-3 text-base">
                                        <SelectValue placeholder="Seleccionar resultado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="favorable" className="text-base">
                                            Favorable
                                        </SelectItem>
                                        <SelectItem value="unfavorable" className="text-base">
                                            Desfavorable
                                        </SelectItem>
                                        <SelectItem value="with_observations" className="text-base">
                                            Con observaciones
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="insp_date" className="text-base">
                                    Fecha de inspección <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="insp_date"
                                    type="date"
                                    className="py-3 text-base"
                                    value={p.inspForm.inspected_at}
                                    onInput={(e) => p.setInspForm((prev) => ({ ...prev, inspected_at: (e.target as HTMLInputElement).value }))}
                                    onChange={(e) => p.setInspForm((prev) => ({ ...prev, inspected_at: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="insp_obs" className="text-base">
                                Observaciones <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="insp_obs"
                                rows={4}
                                className="text-base"
                                placeholder="Describa los hallazgos de la inspección…"
                                value={p.inspForm.observations}
                                onInput={(e) => p.setInspForm((prev) => ({ ...prev, observations: (e.target as HTMLTextAreaElement).value }))}
                                onChange={(e) => p.setInspForm((prev) => ({ ...prev, observations: e.target.value }))}
                            />
                            <p className="text-muted-foreground text-xs">Máximo 5.000 caracteres.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-base">Fotos de evidencia</Label>
                            <MultiFilePicker
                                files={p.inspPhotos}
                                onChange={p.setInspPhotos}
                                accept="image/jpeg,image/png,image/webp"
                                maxFiles={20}
                                maxSizeMB={10}
                                hint="JPG, PNG o WEBP — Máx. 10 MB por archivo, hasta 20"
                                preview
                                disabled={p.submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-base">Informe (PDF/Word)</Label>
                            <MultiFilePicker
                                files={p.inspReports}
                                onChange={p.setInspReports}
                                accept=".pdf,.doc,.docx"
                                maxFiles={5}
                                maxSizeMB={10}
                                hint="PDF, DOC o DOCX — Máx. 10 MB por archivo, hasta 5"
                                disabled={p.submitting}
                            />
                        </div>
                        <Button type="button" size="lg" className="text-base" disabled={!canSubmitInspection} onClick={p.onSubmitInspection}>
                            <CheckCircle2 className="h-5 w-5" /> Registrar inspección
                        </Button>
                    </div>
                )}

                {showSubmitResponse && (
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <Send className="h-5 w-5" /> Respuesta Técnica
                        </Label>
                        <Textarea
                            rows={4}
                            className="text-base"
                            value={p.responseContent}
                            onInput={(e) => p.setResponseContent((e.target as HTMLTextAreaElement).value)}
                            onChange={(e) => p.setResponseContent(e.target.value)}
                            placeholder="Escriba la respuesta técnica…"
                        />
                        <div className="space-y-2">
                            <Label className="text-base">Adjuntos de respuesta (PDF/Word)</Label>
                            <MultiFilePicker
                                files={p.responseFiles}
                                onChange={p.setResponseFiles}
                                accept=".pdf,.doc,.docx"
                                maxFiles={5}
                                maxSizeMB={10}
                                hint="PDF, DOC o DOCX — Máx. 10 MB por archivo, hasta 5"
                                disabled={p.submitting}
                            />
                        </div>
                        <Button type="button" size="lg" className="text-base" disabled={!canSubmitResponse} onClick={p.onSubmitResponse}>
                            <Send className="h-5 w-5" /> Enviar respuesta
                        </Button>
                    </div>
                )}

                {showIssueDecision && (
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <Gavel className="h-5 w-5" /> Emitir Decisión
                        </Label>
                        <Select value={p.decForm.decision} onValueChange={(v) => p.setDecForm((prev) => ({ ...prev, decision: v }))}>
                            <SelectTrigger className="py-3 text-base">
                                <SelectValue placeholder="Seleccionar decisión" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="approved" className="text-base">
                                    Aprobado
                                </SelectItem>
                                <SelectItem value="rejected" className="text-base">
                                    Rechazado
                                </SelectItem>
                                <SelectItem value="partial" className="text-base">
                                    Aprobado parcialmente
                                </SelectItem>
                                <SelectItem value="suspended" className="text-base">
                                    Suspendido
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            rows={3}
                            className="text-base"
                            value={p.decForm.notes}
                            onInput={(e) => p.setDecForm((prev) => ({ ...prev, notes: (e.target as HTMLTextAreaElement).value }))}
                            onChange={(e) => p.setDecForm((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Observaciones (opcional)"
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-base">Vigencia desde</Label>
                                <Input
                                    type="date"
                                    className="py-3 text-base"
                                    value={p.decForm.valid_from}
                                    onInput={(e) => p.setDecForm((prev) => ({ ...prev, valid_from: (e.target as HTMLInputElement).value }))}
                                    onChange={(e) => p.setDecForm((prev) => ({ ...prev, valid_from: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base">Vigencia hasta</Label>
                                <Input
                                    type="date"
                                    className="py-3 text-base"
                                    value={p.decForm.valid_until}
                                    onInput={(e) => p.setDecForm((prev) => ({ ...prev, valid_until: (e.target as HTMLInputElement).value }))}
                                    onChange={(e) => p.setDecForm((prev) => ({ ...prev, valid_until: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-base">Archivos corregidos por dirección (opcional)</Label>
                            <MultiFilePicker
                                files={p.decFiles}
                                onChange={p.setDecFiles}
                                accept=".pdf,.doc,.docx"
                                maxFiles={5}
                                maxSizeMB={10}
                                hint="PDF, DOC o DOCX — Máx. 10 MB por archivo, hasta 5. Se guardan como versión corregida, sin reemplazar originales."
                                disabled={p.submitting}
                            />
                        </div>
                        <Button type="button" size="lg" className="text-base" disabled={!canIssueDecision} onClick={p.onIssueDecision}>
                            <Gavel className="h-5 w-5" /> Emitir decisión
                        </Button>
                    </div>
                )}

                {showUploadFinalDecisionDocument && (
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <FileUp className="h-5 w-5" /> Adjuntar documento final firmado
                        </Label>
                        <p className="text-muted-foreground text-sm">Cargue el documento escaneado firmado y sellado para concluir el trámite.</p>
                        <div className="space-y-2">
                            <Label className="text-base">Documento final (PDF/JPG/PNG/Word)</Label>
                            <MultiFilePicker
                                files={p.finalDecisionFiles}
                                onChange={p.setFinalDecisionFiles}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                maxFiles={5}
                                maxSizeMB={10}
                                hint="PDF, JPG, PNG, DOC o DOCX — Máx. 10 MB por archivo, hasta 5"
                                disabled={p.submitting}
                            />
                        </div>
                        <Button
                            type="button"
                            size="lg"
                            className="text-base"
                            disabled={!canUploadFinalDecisionDocument}
                            onClick={p.onUploadFinalDecisionDocument}
                        >
                            <FileUp className="h-5 w-5" /> Adjuntar y concluir
                        </Button>
                    </div>
                )}

                {showReturn && (
                    <div className="space-y-4 border-t-2 pt-5">
                        <Label className="flex items-center gap-2 text-base font-semibold text-amber-600 dark:text-amber-400">
                            <RotateCcw className="h-5 w-5" /> Devolver a fase previa
                        </Label>
                        <Select value={p.returnForm.target_status} onValueChange={(v) => p.setReturnForm((prev) => ({ ...prev, target_status: v }))}>
                            <SelectTrigger className="py-3 text-base">
                                <SelectValue placeholder="Seleccionar fase destino" />
                            </SelectTrigger>
                            <SelectContent>
                                {p.returnablePhases.map((ph) => (
                                    <SelectItem key={ph.value} value={ph.value} className="text-base">
                                        {ph.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            rows={3}
                            className="text-base"
                            value={p.returnForm.reason}
                            onInput={(e) => p.setReturnForm((prev) => ({ ...prev, reason: (e.target as HTMLTextAreaElement).value }))}
                            onChange={(e) => p.setReturnForm((prev) => ({ ...prev, reason: e.target.value }))}
                            placeholder="Motivo de la devolución (obligatorio)"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="text-base"
                            disabled={!p.returnForm.target_status || !p.returnForm.reason.trim() || p.submitting}
                            onClick={p.onReturn}
                        >
                            <RotateCcw className="h-5 w-5" /> Devolver
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* ── Helpers ──────────────────────────────────────────────── */

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-2.5 text-base">
            <span className="text-muted-foreground shrink-0">{icon}</span>
            <span className="text-muted-foreground">{label}:</span>
            <span className="font-medium">{value ?? '—'}</span>
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
        case 'decision_document_attached':
            return 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40';
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
