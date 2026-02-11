import LandingFooter from '@/components/landing/LandingFooter';
import LandingNavHeader from '@/components/landing/LandingNavHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, Circle, CircleDot, Download, FileText, Printer, Search } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

interface Requirement {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_required: boolean;
    sort_order: number;
}

interface ProcedureType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    requirements: Requirement[];
}

interface Props {
    procedureTypes: ProcedureType[];
}

function buildPrintHTML(types: ProcedureType[]): string {
    const rows = types
        .map((pt) => {
            const reqs = pt.requirements
                .map(
                    (r) =>
                        `<tr>
                        <td style="padding:6px 10px;border:1px solid #ddd;font-size:14px;">${r.name}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-size:14px;">${r.is_required ? 'Obligatorio' : 'Opcional'}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;font-size:13px;color:#555;">${r.description ?? ''}</td>
                    </tr>`,
                )
                .join('');

            return `
                <div style="margin-bottom:32px;page-break-inside:avoid;">
                    <h2 style="font-size:17px;margin:0 0 4px;color:#1a1a1a;">${pt.name}</h2>
                    <p style="font-size:13px;margin:0 0 10px;color:#666;">${pt.code} &mdash; ${pt.requirements.length} recaudo${pt.requirements.length !== 1 ? 's' : ''}</p>
                    ${pt.description ? `<p style="font-size:13px;color:#555;margin:0 0 10px;">${pt.description}</p>` : ''}
                    ${
                        pt.requirements.length > 0
                            ? `<table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f5f5f5;">
                                    <th style="padding:8px 10px;border:1px solid #ddd;text-align:left;font-size:13px;font-weight:600;">Recaudo</th>
                                    <th style="padding:8px 10px;border:1px solid #ddd;text-align:center;font-size:13px;font-weight:600;width:110px;">Tipo</th>
                                    <th style="padding:8px 10px;border:1px solid #ddd;text-align:left;font-size:13px;font-weight:600;">Descripción</th>
                                </tr>
                            </thead>
                            <tbody>${reqs}</tbody>
                        </table>`
                            : '<p style="font-size:13px;color:#888;font-style:italic;">Sin recaudos registrados.</p>'
                    }
                </div>`;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Requisitos y Recaudos - Alcaldía de Chacao</title>
    <style>
        @media print { body { margin: 0; } }
        body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; padding: 24px; }
    </style>
</head>
<body>
    <div style="text-align:center;margin-bottom:28px;">
        <h1 style="font-size:22px;margin:0;">Alcaldía de Chacao</h1>
        <p style="font-size:14px;color:#555;margin:4px 0 0;">Dirección de Planeamiento Urbano &mdash; Requisitos y Recaudos</p>
        <p style="font-size:12px;color:#888;margin:6px 0 0;">Generado: ${new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    ${rows}
</body>
</html>`;
}

function printSingleType(pt: ProcedureType, iframeRef: React.MutableRefObject<HTMLIFrameElement | null>) {
    const html = buildPrintHTML([pt]);
    let iframe = iframeRef.current;
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
    }
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => iframe!.contentWindow?.print(), 300);
    }
}

function downloadSingleType(pt: ProcedureType) {
    const html = buildPrintHTML([pt]);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitos-${pt.code.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function PublicRequirements({ procedureTypes }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [search, setSearch] = useState('');
    const printFrameRef = useRef<HTMLIFrameElement | null>(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return procedureTypes;
        const q = search.toLowerCase();
        return procedureTypes.filter(
            (pt) =>
                pt.name.toLowerCase().includes(q) ||
                pt.code.toLowerCase().includes(q) ||
                pt.requirements.some((r) => r.name.toLowerCase().includes(q)),
        );
    }, [search, procedureTypes]);

    const handlePrintAll = useCallback(() => {
        const html = buildPrintHTML(filtered);
        let iframe = printFrameRef.current;
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            printFrameRef.current = iframe;
        }
        const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            setTimeout(() => iframe!.contentWindow?.print(), 300);
        }
    }, [filtered]);

    const handleDownloadAll = useCallback(() => {
        const html = buildPrintHTML(filtered);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `requisitos-chacao-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [filtered]);

    return (
        <>
            <Head title="Requisitos y Recaudos - Chacao Verifica" />
            <div className="bg-background text-foreground flex min-h-screen flex-col">
                <LandingNavHeader auth={auth} />

                <main className="flex-1">
                    {/* Hero + Search */}
                    <section className="from-muted/30 bg-gradient-to-b to-transparent pt-12 pb-10">
                        <div className="container mx-auto px-6 text-center">
                            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">Requisitos y Recaudos</h1>
                            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-lg">
                                Busque el trámite que desea realizar para conocer los documentos que necesita.
                            </p>

                            <Card className="mx-auto mt-6 max-w-4xl shadow-none">
                                <CardContent className="p-4">
                                    <label htmlFor="req-search" className="text-foreground mb-2 block text-left text-sm font-semibold">
                                        Buscar trámite o recaudo
                                    </label>
                                    <div className="relative">
                                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                                        <Input
                                            id="req-search"
                                            placeholder="Escriba el nombre del trámite o documento..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="focus-visible:ring-primary/30 h-12 pl-11 text-base shadow-none"
                                        />
                                    </div>

                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-muted-foreground text-left text-sm">
                                            {filtered.length} trámite{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                                        </p>
                                        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                                            <Button variant="outline" className="min-w-[120px] gap-2 whitespace-nowrap" onClick={handlePrintAll}>
                                                <Printer className="size-4" />
                                                Imprimir
                                            </Button>
                                            <Button variant="outline" className="min-w-[120px] gap-2 whitespace-nowrap" onClick={handleDownloadAll}>
                                                <Download className="size-4" />
                                                Descargar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Results */}
                    <section className="container mx-auto px-6 pb-16">
                        {filtered.length === 0 ? (
                            <div className="text-muted-foreground py-16 text-center">
                                <FileText className="mx-auto mb-3 size-10 opacity-40" />
                                <p className="text-lg font-medium">No se encontraron trámites</p>
                                <p className="mt-1 text-base">Intente con otro término de búsqueda.</p>
                            </div>
                        ) : (
                            <Card className="mx-auto max-w-4xl shadow-none">
                                <CardContent className="p-0">
                                    <Accordion type="multiple" className="w-full">
                                        {filtered.map((pt) => (
                                            <AccordionItem key={pt.id} value={String(pt.id)} className="border-b px-4 last:border-b-0">
                                                <AccordionTrigger className="hover:bg-muted/30 focus-visible:ring-primary/20 -mx-2 rounded-md px-2 text-left hover:no-underline focus-visible:ring-2 focus-visible:outline-hidden">
                                                    <div className="flex flex-1 items-center gap-3">
                                                        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                                                            <FileText className="text-primary size-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-base font-semibold">{pt.name}</span>
                                                            <span className="text-muted-foreground block text-sm">
                                                                {pt.code} &mdash; {pt.requirements.length} recaudo
                                                                {pt.requirements.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-1 pb-6">
                                                    {pt.description && pt.description.includes('|') ? (
                                                        <div className="mb-4 flex flex-wrap gap-2">
                                                            {pt.description
                                                                .split('|')
                                                                .map((t) => t.trim())
                                                                .filter(Boolean)
                                                                .map((t) => (
                                                                    <Badge
                                                                        key={t}
                                                                        variant="outline"
                                                                        className="text-muted-foreground bg-transparent text-xs font-medium"
                                                                    >
                                                                        {t}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    ) : pt.description ? (
                                                        <p className="text-muted-foreground mb-4 text-base">{pt.description}</p>
                                                    ) : null}

                                                    {/* Summary badges */}
                                                    {pt.requirements.length > 0 &&
                                                        (() => {
                                                            const obligatorios = pt.requirements.filter((r) => r.is_required).length;
                                                            const opcionales = pt.requirements.length - obligatorios;
                                                            return (
                                                                <div className="mb-4 flex flex-wrap gap-2">
                                                                    <Badge variant="secondary" className="gap-1 px-2.5 py-1 text-xs font-medium">
                                                                        <CheckCircle2 className="size-3.5" />
                                                                        {obligatorios} obligatorio{obligatorios !== 1 ? 's' : ''}
                                                                    </Badge>
                                                                    {opcionales > 0 && (
                                                                        <Badge variant="outline" className="gap-1 px-2.5 py-1 text-xs font-medium">
                                                                            <Circle className="size-3.5" />
                                                                            {opcionales} opcional{opcionales !== 1 ? 'es' : ''}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                    {pt.requirements.length === 0 ? (
                                                        <p className="text-muted-foreground text-base italic">Sin recaudos registrados.</p>
                                                    ) : (
                                                        <ul className="divide-border/60 divide-y">
                                                            {pt.requirements.map((req, idx) => (
                                                                <li key={req.id} className="flex items-start gap-3 py-3 text-[15px] leading-6">
                                                                    <span className="text-muted-foreground mt-0.5 w-7 shrink-0 text-right font-mono text-sm">
                                                                        {idx + 1}.
                                                                    </span>
                                                                    {req.is_required ? (
                                                                        <CircleDot className="text-primary mt-0.5 size-4 shrink-0" />
                                                                    ) : (
                                                                        <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                                    )}
                                                                    <div className="max-w-[72ch] min-w-0">
                                                                        <span className="font-medium break-words">{req.name}</span>
                                                                        {!req.is_required && (
                                                                            <Badge variant="outline" className="ml-2 text-xs">
                                                                                Opcional
                                                                            </Badge>
                                                                        )}
                                                                        {req.description && (
                                                                            <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                                                                                {req.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {/* Per-item actions */}
                                                    <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
                                                        <Button
                                                            variant="outline"
                                                            className="gap-2"
                                                            onClick={() => printSingleType(pt, printFrameRef)}
                                                        >
                                                            <Printer className="size-4" />
                                                            Imprimir estos requisitos
                                                        </Button>
                                                        <Button variant="outline" className="gap-2" onClick={() => downloadSingleType(pt)}>
                                                            <Download className="size-4" />
                                                            Descargar
                                                        </Button>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </main>

                <LandingFooter />
            </div>
        </>
    );
}
