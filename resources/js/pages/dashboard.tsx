import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, FileText, Percent, TrendingUp, Users, Zap } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KPIs {
    totalActive: number;
    receivedThisMonth: number;
    receivedLastMonth: number;
    pendingAction: number;
    completedThisMonth: number | null;
    avgResolutionDays: number | null;
    approvalRate: number | null;
    delayedCount: number;
}

interface StatusItem {
    status: string;
    label: string;
    count: number;
}

interface MonthlyItem {
    month: string;
    received: number;
    completed: number;
}

interface ProcedureTypeItem {
    id: number;
    name: string;
    count: number;
}

interface AgingItem {
    status: string;
    label: string;
    ok: number;
    warn: number;
    critical: number;
}

interface PerformanceRow {
    id: number;
    name: string;
    assigned: number;
    resolved?: number;
    inspectionsDone?: number;
    avgDays: number | null;
}

interface ActivityItem {
    id: number;
    type: string;
    description: string;
    actorName: string;
    tracking: string | null;
    expedienteId: number | null;
    createdAt: string;
}

interface WorkQueueItem {
    id: number;
    tracking: string;
    status: string;
    statusLabel: string;
    procedureType: string | null;
    solicitante: string | null;
    receivedAt: string | null;
    daysInPhase: number;
    delayed: boolean;
}

interface Props {
    kpis: KPIs;
    statusDistribution: StatusItem[];
    monthlyTrend: MonthlyItem[];
    byProcedureType: ProcedureTypeItem[];
    agingData: AgingItem[];
    performance: { reviewers: PerformanceRow[]; inspectors: PerformanceRow[] } | null;
    recentActivity: ActivityItem[];
    workQueue: WorkQueueItem[];
    canSeeAll: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const STATUS_COLORS: Record<string, string> = {
    received: '#22d3ee',
    pending_reviewer: '#a78bfa',
    pending_inspector: '#818cf8',
    in_inspection: '#f59e0b',
    pending_response: '#fb923c',
    pending_decision: '#f472b6',
    completed: '#34d399',
    rejected: '#f87171',
    partial: '#fbbf24',
    suspended: '#94a3b8',
    draft: '#64748b',
};

const AGING_COLORS = { ok: '#34d399', warn: '#fbbf24', critical: '#f87171' };

/* ------------------------------------------------------------------ */
/*  Small components                                                   */
/* ------------------------------------------------------------------ */

function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    accent = 'text-white',
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
    accent?: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 shadow-lg dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium tracking-wide text-zinc-400 uppercase">{title}</p>
                    <p className={`mt-1 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
                    {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
                    {trend && (
                        <div className="mt-1.5 flex items-center gap-1 text-xs">
                            {trend.direction === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />}
                            {trend.direction === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
                            <span
                                className={
                                    trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : 'text-zinc-500'
                                }
                            >
                                {trend.label}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Icon className="h-5 w-5 text-zinc-400" />
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-400 uppercase">{children}</h2>;
}

function ChartCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={`rounded-xl border border-white/[0.06] bg-zinc-900/80 p-4 shadow-lg ${className}`}>
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">{title}</h3>
            {children}
        </div>
    );
}

function truncate(str: string, max: number): string {
    return str.length > max ? str.slice(0, max) + '…' : str;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    // For PieChart the label comes from payload[0].name, not the `label` prop
    const title = label || payload[0]?.payload?.fullName || payload[0]?.name;
    return (
        <div className="z-[9999] rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs shadow-2xl" style={{ pointerEvents: 'none' }}>
            {title && <p className="mb-1 max-w-[220px] font-medium text-zinc-100">{title}</p>}
            {payload.map((p: any, i: number) => (
                <p key={p.dataKey ?? i} className="flex items-center gap-1.5 text-zinc-200">
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: p.color || p.fill }} />
                    <span style={{ color: p.color || p.fill }}>{p.name ?? p.dataKey}:</span>
                    <span className="font-semibold text-white">{p.value}</span>
                </p>
            ))}
        </div>
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function navigateToExpedientes(filters: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
        params.set(`filters[${k}]`, v);
    }
    router.visit(`/procedures/expedientes?${params.toString()}`);
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard({
    kpis,
    statusDistribution,
    monthlyTrend,
    byProcedureType,
    agingData,
    performance,
    recentActivity,
    workQueue,
    canSeeAll,
}: Props) {
    const receivedDelta =
        kpis.receivedLastMonth > 0 ? Math.round(((kpis.receivedThisMonth - kpis.receivedLastMonth) / kpis.receivedLastMonth) * 100) : null;

    // Prepare procedure type data with truncated labels for the Y-axis
    const procedureTypeData = byProcedureType.map((d) => ({
        ...d,
        shortName: truncate(d.name, 22),
        fullName: d.name,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* ── KPI Cards ── */}
                <section>
                    <SectionHeader>Indicadores clave</SectionHeader>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard title="Total expedientes" value={kpis.totalActive} icon={FileText} subtitle="Activos en el sistema" />
                        <KpiCard
                            title="Recibidos este mes"
                            value={kpis.receivedThisMonth}
                            icon={TrendingUp}
                            trend={
                                receivedDelta !== null
                                    ? { direction: receivedDelta >= 0 ? 'up' : 'down', label: `${Math.abs(receivedDelta)}% vs mes anterior` }
                                    : undefined
                            }
                        />
                        <KpiCard
                            title="Pendientes de acción"
                            value={kpis.pendingAction}
                            icon={Zap}
                            accent={kpis.pendingAction > 0 ? 'text-amber-400' : 'text-emerald-400'}
                            subtitle="Requieren tu atención"
                        />
                        <KpiCard
                            title="Con retraso (>15 días)"
                            value={kpis.delayedCount}
                            icon={AlertTriangle}
                            accent={kpis.delayedCount > 0 ? 'text-red-400' : 'text-emerald-400'}
                            subtitle="Sin avance en 15+ días"
                        />

                        {canSeeAll && kpis.completedThisMonth !== null && (
                            <KpiCard title="Resueltos este mes" value={kpis.completedThisMonth} icon={CheckCircle2} accent="text-emerald-400" />
                        )}
                        {canSeeAll && kpis.avgResolutionDays !== null && (
                            <KpiCard
                                title="Tiempo promedio resolución"
                                value={`${kpis.avgResolutionDays}d`}
                                icon={Clock}
                                subtitle="Últimos 90 días"
                            />
                        )}
                        {canSeeAll && kpis.approvalRate !== null && (
                            <KpiCard
                                title="Tasa de aprobación"
                                value={`${kpis.approvalRate}%`}
                                icon={Percent}
                                subtitle="Últimos 90 días"
                                accent="text-cyan-400"
                            />
                        )}
                    </div>
                </section>

                {/* ── Charts row ── */}
                <section>
                    <SectionHeader>Análisis</SectionHeader>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Donut: status distribution */}
                        <ChartCard title="Distribución por estado">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusDistribution}
                                            dataKey="count"
                                            nameKey="label"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            stroke="none"
                                            cursor="pointer"
                                            onClick={(entry) => {
                                                if (entry?.status) navigateToExpedientes({ status: entry.status });
                                            }}
                                        >
                                            {statusDistribution.map((d) => (
                                                <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? '#6b7280'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value: string) => <span className="text-xs text-zinc-400">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-1 text-center text-[10px] text-zinc-600">Clic en un segmento para filtrar</p>
                        </ChartCard>

                        {/* Area: monthly trend */}
                        <ChartCard title="Tendencia mensual">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyTrend}>
                                        <defs>
                                            <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                        <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        <Area
                                            type="monotone"
                                            dataKey="received"
                                            name="Recibidos"
                                            stroke="#22d3ee"
                                            fill="url(#gradReceived)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="completed"
                                            name="Resueltos"
                                            stroke="#34d399"
                                            fill="url(#gradCompleted)"
                                            strokeWidth={2}
                                        />
                                        <Legend
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(v: string) => <span className="text-xs text-zinc-400">{v}</span>}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        {/* Bar: by procedure type */}
                        <ChartCard title="Por tipo de trámite">
                            <div style={{ height: Math.max(200, procedureTypeData.length * 36 + 40) }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={procedureTypeData} layout="vertical" margin={{ left: 4, right: 12 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            tick={{ fill: '#71717a', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            dataKey="shortName"
                                            type="category"
                                            tick={{ fill: '#a1a1aa', fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={150}
                                        />
                                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                        <Bar
                                            dataKey="count"
                                            name="Expedientes"
                                            fill="#818cf8"
                                            radius={[0, 4, 4, 0]}
                                            barSize={20}
                                            cursor="pointer"
                                            onClick={(entry) => {
                                                if (entry?.id) navigateToExpedientes({ procedure_type_id: String(entry.id) });
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-1 text-center text-[10px] text-zinc-600">Clic en una barra para filtrar</p>
                        </ChartCard>

                        {/* Stacked bar: aging / SLA */}
                        <ChartCard title="Antigüedad en fase (SLA)">
                            <div className="h-64">
                                {agingData.length === 0 ? (
                                    <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                                        Sin expedientes activos en fases intermedias
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={agingData} layout="vertical" margin={{ left: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tick={{ fill: '#71717a', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                            />
                                            <YAxis
                                                dataKey="label"
                                                type="category"
                                                tick={{ fill: '#a1a1aa', fontSize: 10 }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={130}
                                            />
                                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
                                            <Bar dataKey="ok" name="< 15 días" stackId="a" fill={AGING_COLORS.ok} barSize={18} />
                                            <Bar dataKey="warn" name="15-30 días" stackId="a" fill={AGING_COLORS.warn} barSize={18} />
                                            <Bar
                                                dataKey="critical"
                                                name="> 30 días"
                                                stackId="a"
                                                fill={AGING_COLORS.critical}
                                                radius={[0, 4, 4, 0]}
                                                barSize={18}
                                            />
                                            <Legend
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(v: string) => <span className="text-xs text-zinc-400">{v}</span>}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </ChartCard>
                    </div>
                </section>

                {/* ── Performance tables (directora/admin only) ── */}
                {performance && (
                    <section>
                        <SectionHeader>Desempeño del equipo (últimos 90 días)</SectionHeader>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Reviewers */}
                            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/80 shadow-lg">
                                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                                    <Users className="h-4 w-4 text-violet-400" />
                                    <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Revisores</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
                                            <th className="px-4 py-2 font-medium">Nombre</th>
                                            <th className="px-4 py-2 text-center font-medium">Asignados</th>
                                            <th className="px-4 py-2 text-center font-medium">Resueltos</th>
                                            <th className="px-4 py-2 text-center font-medium">Prom. días</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performance.reviewers.map((r) => (
                                            <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                <td className="px-4 py-2 font-medium text-zinc-200">{r.name}</td>
                                                <td className="px-4 py-2 text-center text-zinc-400">{r.assigned}</td>
                                                <td className="px-4 py-2 text-center text-emerald-400">{r.resolved}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={r.avgDays !== null && r.avgDays > 15 ? 'text-red-400' : 'text-zinc-400'}>
                                                        {r.avgDays ?? '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {performance.reviewers.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-zinc-500">
                                                    Sin datos
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Inspectors */}
                            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/80 shadow-lg">
                                <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                                    <Users className="h-4 w-4 text-amber-400" />
                                    <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Inspectores</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
                                            <th className="px-4 py-2 font-medium">Nombre</th>
                                            <th className="px-4 py-2 text-center font-medium">Asignados</th>
                                            <th className="px-4 py-2 text-center font-medium">Inspecciones</th>
                                            <th className="px-4 py-2 text-center font-medium">Prom. días</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performance.inspectors.map((r) => (
                                            <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                <td className="px-4 py-2 font-medium text-zinc-200">{r.name}</td>
                                                <td className="px-4 py-2 text-center text-zinc-400">{r.assigned}</td>
                                                <td className="px-4 py-2 text-center text-emerald-400">{r.inspectionsDone}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={r.avgDays !== null && r.avgDays > 15 ? 'text-red-400' : 'text-zinc-400'}>
                                                        {r.avgDays ?? '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {performance.inspectors.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-zinc-500">
                                                    Sin datos
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Bottom row: Work queue + Activity feed ── */}
                <section>
                    <div className="grid gap-4 lg:grid-cols-5">
                        {/* Work queue (wider) */}
                        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/80 shadow-lg lg:col-span-3">
                            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                                <Zap className="h-4 w-4 text-amber-400" />
                                <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Cola de trabajo</h3>
                                <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{workQueue.length}</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-zinc-900">
                                        <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase">
                                            <th className="px-4 py-2 font-medium">Tracking</th>
                                            <th className="px-4 py-2 font-medium">Trámite</th>
                                            <th className="px-4 py-2 text-center font-medium">Estado</th>
                                            <th className="px-4 py-2 text-center font-medium">Días</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workQueue.map((item) => (
                                            <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                <td className="px-4 py-2">
                                                    <Link
                                                        href={`/procedures/expedientes/${item.id}`}
                                                        className="font-mono text-xs text-cyan-400 hover:underline"
                                                    >
                                                        {item.tracking}
                                                    </Link>
                                                </td>
                                                <td className="max-w-[180px] truncate px-4 py-2 text-zinc-300">{item.procedureType ?? '—'}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span
                                                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                                        style={{
                                                            backgroundColor: `${STATUS_COLORS[item.status] ?? '#6b7280'}20`,
                                                            color: STATUS_COLORS[item.status] ?? '#6b7280',
                                                        }}
                                                    >
                                                        {item.statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <span
                                                        className={`text-xs font-semibold ${item.delayed ? 'text-red-400' : item.daysInPhase > 10 ? 'text-amber-400' : 'text-zinc-400'}`}
                                                    >
                                                        {item.daysInPhase}d
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {workQueue.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                                                    Sin expedientes pendientes
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Activity feed */}
                        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/80 shadow-lg lg:col-span-2">
                            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                                <Clock className="h-4 w-4 text-cyan-400" />
                                <h3 className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Actividad reciente</h3>
                            </div>
                            <div className="max-h-80 space-y-0 overflow-y-auto">
                                {recentActivity.map((ev) => (
                                    <div key={ev.id} className="flex gap-3 border-b border-zinc-800/50 px-4 py-2.5 hover:bg-zinc-800/20">
                                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-cyan-500" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs text-zinc-300">{ev.description}</p>
                                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                                                <span>{ev.actorName}</span>
                                                <span>·</span>
                                                {ev.tracking && ev.expedienteId && (
                                                    <>
                                                        <Link
                                                            href={`/procedures/expedientes/${ev.expedienteId}`}
                                                            className="text-cyan-500 hover:underline"
                                                        >
                                                            {ev.tracking}
                                                        </Link>
                                                        <span>·</span>
                                                    </>
                                                )}
                                                <span>{new Date(ev.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {recentActivity.length === 0 && (
                                    <div className="px-4 py-6 text-center text-sm text-zinc-500">Sin actividad reciente</div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
