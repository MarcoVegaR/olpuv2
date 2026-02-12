import LandingFooter from '@/components/landing/LandingFooter';
import LandingNavHeader from '@/components/landing/LandingNavHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Circle,
    ClipboardCheck,
    Clock,
    FileSearch,
    Gavel,
    Loader2,
    Search,
    ShieldCheck,
    UserCheck,
    UserSearch,
    XCircle,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';

interface TimelineEvent {
    id: number;
    type: string;
    description: string;
    createdAt: string;
}

interface TrackingResult {
    tracking: string;
    status: string;
    statusLabel: string;
    procedureType: string;
    solicitante: string;
    documento: string;
    receivedAt: string;
    completedAt: string | null;
    events: TimelineEvent[];
}

const EVENT_ICONS: Record<string, typeof Circle> = {
    reception: ClipboardCheck,
    created: ClipboardCheck,
    reception_created: ClipboardCheck,
    confirmed: ShieldCheck,
    reviewer_assigned: UserSearch,
    inspector_assigned: UserCheck,
    inspection_started: FileSearch,
    inspection_submitted: FileSearch,
    response_submitted: ClipboardCheck,
    decision_issued: Gavel,
    returned_to_phase: AlertCircle,
};

export default function PublicTracking() {
    const { auth } = usePage<SharedData>().props;
    const [tracking, setTracking] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TrackingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = tracking.trim().toUpperCase();
        if (!trimmed) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/public/tracking/${encodeURIComponent(trimmed)}`, {
                headers: { Accept: 'application/json' },
            });

            if (!res.ok) {
                if (res.status === 404) {
                    setError('No se encontró ningún trámite con ese número. Verifique que esté correcto e intente de nuevo.');
                } else {
                    setError('Ocurrió un error al consultar. Por favor intente nuevamente.');
                }
                return;
            }

            const json = await res.json();
            setResult(json.data);
        } catch {
            setError('Error de conexión. Verifique su conexión a internet e intente nuevamente.');
        } finally {
            setLoading(false);
        }
    }

    const isTerminal = result && ['completed'].includes(result.status);

    const timelineEvents = useMemo(() => {
        if (!result) return [];
        const events = [...result.events];

        const hasReception = events.some((e) => e.type === 'reception' || e.type === 'created' || e.type === 'reception_created');
        if (!hasReception && result.receivedAt) {
            events.push({
                id: -1,
                type: 'reception',
                description: 'Expediente recepcionado',
                createdAt: result.receivedAt,
            });
        }

        if (isTerminal && result.completedAt) {
            events.unshift({
                id: -2,
                type: 'completed',
                description: 'Trámite completado',
                createdAt: result.completedAt,
            });
        }

        return events;
    }, [result, isTerminal]);
    return (
        <>
            <Head title="Consultar Trámite - Chacao Verifica" />
            <div className="bg-background text-foreground flex min-h-screen flex-col">
                <LandingNavHeader auth={auth} />

                <main className="flex-1">
                    {/* Hero + Search */}
                    <section className="bg-gradient-to-b from-blue-50 to-transparent pt-12 pb-10 dark:from-blue-950/20">
                        <div className="container mx-auto px-6 text-center">
                            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">Consultar Trámite</h1>
                            <p className="mx-auto mt-3 max-w-xl text-lg text-slate-600 dark:text-slate-400">
                                Escriba su número de expediente y presione <strong>Consultar</strong>.
                            </p>

                            {/* Search — prominent with strong visual presence */}
                            <form onSubmit={handleSubmit}>
                                <Card className="mx-auto mt-6 max-w-4xl shadow-none">
                                    <CardContent className="p-4">
                                        <label htmlFor="tracking-input" className="text-foreground mb-2 block text-left text-sm font-semibold">
                                            Número de expediente
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                                                <Input
                                                    id="tracking-input"
                                                    placeholder="Ej: EXP-01KH6H5EHZJN8VX2YGHZWM40D5"
                                                    value={tracking}
                                                    onChange={(e) => setTracking(e.target.value)}
                                                    className="focus-visible:ring-primary/30 h-12 pl-11 text-base shadow-none"
                                                    disabled={loading}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <Button type="submit" size="lg" disabled={loading || !tracking.trim()} className="h-12 px-6 text-base">
                                                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Consultar'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </form>
                        </div>
                    </section>

                    {/* Results area */}
                    <section className="container mx-auto px-6 pb-16">
                        <div className="mx-auto max-w-4xl">
                            {/* Error */}
                            {error && (
                                <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                                    <p className="text-base text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Result */}
                            {result && (
                                <div className="space-y-6">
                                    {/* Summary Card */}
                                    <Card className="overflow-hidden shadow-sm">
                                        {/* Blue header band */}
                                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 text-white">
                                            <div className="flex items-center justify-between gap-3">
                                                <h2 className="text-lg font-bold">Estado de su Trámite</h2>
                                                <span className="shrink-0 rounded-lg bg-white/20 px-4 py-1.5 text-sm font-bold backdrop-blur">
                                                    {result.statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <CardContent className="pt-5">
                                            <dl className="divide-y divide-slate-100 text-base dark:divide-slate-800">
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Expediente</dt>
                                                    <dd className="text-foreground font-mono text-sm font-semibold">{result.tracking}</dd>
                                                </div>
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Tipo de Trámite</dt>
                                                    <dd className="text-foreground text-right font-semibold">{result.procedureType}</dd>
                                                </div>
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Fecha de Recepción</dt>
                                                    <dd className="text-foreground font-semibold">{result.receivedAt ?? '—'}</dd>
                                                </div>
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Solicitante</dt>
                                                    <dd className="text-foreground font-semibold">{result.solicitante}</dd>
                                                </div>
                                                <div className="flex justify-between gap-4 py-3">
                                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Documento</dt>
                                                    <dd className="text-foreground font-semibold">{result.documento}</dd>
                                                </div>
                                                {result.completedAt && (
                                                    <div className="flex justify-between gap-4 py-3">
                                                        <dt className="font-medium text-slate-500 dark:text-slate-400">Fecha de Conclusión</dt>
                                                        <dd className="text-foreground font-semibold">{result.completedAt}</dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </CardContent>
                                    </Card>

                                    {/* Timeline */}
                                    {timelineEvents.length > 0 && (
                                        <Card className="shadow-sm">
                                            <CardContent className="pt-6">
                                                <h2 className="text-foreground mb-1 flex items-center gap-2 text-xl font-bold">
                                                    <Clock className="text-primary size-5" />
                                                    Historial del Trámite
                                                </h2>
                                                <p className="text-muted-foreground mb-5 text-sm">
                                                    Cada paso que ha seguido su expediente, del más reciente al más antiguo.
                                                </p>

                                                <ol className="border-border relative ml-4 border-l-2">
                                                    {timelineEvents.map((event, idx) => {
                                                        const isFirst = idx === 0;
                                                        const Icon = EVENT_ICONS[event.type] ?? Circle;
                                                        const isReturn = event.type === 'returned_to_phase';

                                                        let dotColor = 'bg-primary/15 text-primary';
                                                        if (isFirst && isTerminal) {
                                                            dotColor =
                                                                result.status === 'completed'
                                                                    ? 'bg-green-100 text-green-600'
                                                                    : result.status === 'rejected'
                                                                      ? 'bg-red-100 text-red-600'
                                                                      : 'bg-amber-100 text-amber-600';
                                                        } else if (isReturn) {
                                                            dotColor = 'bg-amber-100 text-amber-600';
                                                        } else if (isFirst) {
                                                            dotColor = 'bg-primary text-primary-foreground';
                                                        }

                                                        return (
                                                            <li key={event.id} className="relative pb-7 pl-9 last:pb-0">
                                                                {/* Dot */}
                                                                <div
                                                                    className={`absolute -left-[18px] flex size-9 items-center justify-center rounded-full ${dotColor} ring-background ring-4`}
                                                                >
                                                                    {isFirst && isTerminal ? (
                                                                        result.status === 'completed' ? (
                                                                            <CheckCircle2 className="size-5" />
                                                                        ) : (
                                                                            <XCircle className="size-5" />
                                                                        )
                                                                    ) : (
                                                                        <Icon className="size-5" />
                                                                    )}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="min-w-0 pt-1">
                                                                    <p
                                                                        className={`text-base font-semibold ${isFirst ? 'text-foreground' : 'text-foreground/80'}`}
                                                                    >
                                                                        {event.description}
                                                                    </p>
                                                                    <p className="text-muted-foreground mt-0.5 text-sm">{event.createdAt}</p>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ol>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </main>

                <LandingFooter />
            </div>
        </>
    );
}
