import LandingFooter from '@/components/landing/LandingFooter';
import LandingNavHeader from '@/components/landing/LandingNavHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { AlertCircle, Check, Loader2, Search, X } from 'lucide-react';
import React, { type FormEvent, useState } from 'react';

interface TrackingResult {
    tracking: string;
    status: string;
    statusLabel: string;
    procedureType: string;
    solicitante: string;
    documento: string;
    receivedAt: string;
    completedAt: string | null;
    currentPhase: string;
}

const PHASES = [
    { key: 'received', label: 'Recibido' },
    { key: 'pending_reviewer', label: 'Revisor' },
    { key: 'pending_inspector', label: 'Inspector' },
    { key: 'in_inspection', label: 'Inspección' },
    { key: 'pending_response', label: 'Respuesta' },
    { key: 'pending_decision', label: 'Decisión' },
    { key: 'completed', label: 'Completado' },
] as const;

function phaseIndex(status: string): number {
    const idx = PHASES.findIndex((p) => p.key === status);
    if (status === 'completed' || status === 'rejected') return PHASES.length - 1;
    return idx >= 0 ? idx : 0;
}

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

    const currentPhase = result ? phaseIndex(result.currentPhase) : 0;
    const isRejected = result?.currentPhase === 'rejected';

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
                                Escriba su número de seguimiento y presione <strong>Consultar</strong>.
                            </p>

                            {/* Search — prominent with strong visual presence */}
                            <form onSubmit={handleSubmit}>
                                <Card className="mx-auto mt-6 max-w-4xl shadow-none">
                                    <CardContent className="p-4">
                                        <label htmlFor="tracking-input" className="text-foreground mb-2 block text-left text-sm font-semibold">
                                            Número de seguimiento
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                                                <Input
                                                    id="tracking-input"
                                                    placeholder="Ej: TRK-01KH6H5EHZJN8VX2YGHZWM40D5"
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
                                                    <dt className="font-medium text-slate-500 dark:text-slate-400">Nro. de Seguimiento</dt>
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

                                    {/* Progress Stepper */}
                                    <Card className="shadow-sm">
                                        <CardContent className="px-4 py-5 sm:px-6">
                                            <h2 className="mb-4 text-center text-lg font-semibold">Progreso del trámite</h2>
                                            <div className="flex items-center justify-between">
                                                {PHASES.map((phase, idx) => {
                                                    const isDone = idx < currentPhase;
                                                    const isCurrent = idx === currentPhase;
                                                    const isRejectedStep = isRejected && idx === PHASES.length - 1;
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
                                                                        isCurrent &&
                                                                            !isRejectedStep &&
                                                                            'ring-primary/30 bg-primary text-primary-foreground shadow-md ring-4',
                                                                        isCurrent &&
                                                                            isRejectedStep &&
                                                                            'bg-destructive text-destructive-foreground shadow-md ring-4 ring-red-200 dark:ring-red-900',
                                                                        !isDone &&
                                                                            !isCurrent &&
                                                                            'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
                                                                    )}
                                                                >
                                                                    {isDone ? (
                                                                        <Check className="h-5 w-5" />
                                                                    ) : isRejectedStep ? (
                                                                        <X className="h-5 w-5" />
                                                                    ) : (
                                                                        idx + 1
                                                                    )}
                                                                </div>
                                                                <span
                                                                    className={cn(
                                                                        'hidden text-center text-xs font-medium sm:block sm:text-sm',
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
                                            <p className="text-primary mt-3 text-center text-base font-semibold sm:hidden">
                                                Paso actual: {PHASES[currentPhase]?.label}
                                            </p>
                                        </CardContent>
                                    </Card>
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
