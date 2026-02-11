import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { ShowLayout } from '@/components/show-base/ShowLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Edit, FileText, Hash, Mail, MapPin, Phone, Power, Trash2, User, Users2 } from 'lucide-react';
import { toast } from 'sonner';

interface SolicitanteItem {
    id: number;
    tipo_documento: string;
    numero_documento: string;
    nombre_razon_social: string;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    expedientes_count?: number | null;
}

interface Props extends PageProps {
    item: SolicitanteItem;
    auth?: { can?: Record<string, boolean> };
    hasEditRoute?: boolean;
}

const TIPO_DOC_LABELS: Record<string, string> = {
    V: 'Venezolano',
    E: 'Extranjero',
    P: 'Pasaporte',
    J: 'Jurídico',
    G: 'Gobierno',
};

export default function SolicitanteShow({ item, auth }: Props) {
    const canUpdate = !!auth?.can?.['solicitantes.update'];
    const canDelete = !!auth?.can?.['solicitantes.delete'];
    const canSetActive = !!auth?.can?.['solicitantes.setActive'];

    const isJuridico = item.tipo_documento === 'J' || item.tipo_documento === 'G';

    const breadcrumbs = [
        { title: 'Trámites', href: '/procedures/expedientes' },
        { title: 'Solicitantes', href: '/procedures/solicitantes' },
        { title: item.nombre_razon_social, href: '' },
    ];

    const formatDate = (date: string | null | undefined) => {
        if (!date) return '—';
        try {
            return new Date(date).toLocaleDateString('es-VE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return '—';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Solicitante: ${item.nombre_razon_social}`} />

            <ShowLayout
                header={
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
                                {item.nombre_razon_social}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {TIPO_DOC_LABELS[item.tipo_documento] || item.tipo_documento}-{item.numero_documento}
                            </p>
                        </div>
                    </div>
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        {canUpdate && (
                            <Button asChild>
                                <Link href={`/procedures/solicitantes/${item.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                        )}

                        {canSetActive && (
                            <ConfirmAlert
                                trigger={
                                    <Button variant="outline" type="button">
                                        <Power className="h-4 w-4" />
                                        {item.is_active ? 'Desactivar' : 'Activar'}
                                    </Button>
                                }
                                title={item.is_active ? 'Desactivar solicitante' : 'Activar solicitante'}
                                description="¿Desea cambiar el estado del solicitante?"
                                confirmLabel={item.is_active ? 'Desactivar' : 'Activar'}
                                onConfirm={async () => {
                                    await new Promise<void>((resolve, reject) => {
                                        router.patch(
                                            `/procedures/solicitantes/${item.id}/active`,
                                            { active: !item.is_active },
                                            {
                                                preserveState: false,
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    toast.success(item.is_active ? 'Solicitante desactivado' : 'Solicitante activado');
                                                    resolve();
                                                },
                                                onError: () => reject(new Error('toggle_failed')),
                                            },
                                        );
                                    });
                                }}
                                toastMessages={{
                                    loading: 'Actualizando estado…',
                                    success: 'Estado actualizado',
                                    error: 'No se pudo cambiar el estado',
                                }}
                            />
                        )}

                        {canDelete && (
                            <ConfirmAlert
                                trigger={
                                    <Button variant="destructive" type="button">
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </Button>
                                }
                                title="Eliminar solicitante"
                                description={`¿Está seguro de eliminar a "${item.nombre_razon_social}"? Esta acción no se puede deshacer.`}
                                confirmLabel="Eliminar"
                                onConfirm={async () => {
                                    await new Promise<void>((resolve, reject) => {
                                        router.delete(`/procedures/solicitantes/${item.id}`, {
                                            preserveState: false,
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                resolve();
                                                router.visit('/procedures/solicitantes');
                                            },
                                            onError: () => reject(new Error('delete_failed')),
                                        });
                                    });
                                }}
                                toastMessages={{
                                    loading: 'Eliminando solicitante…',
                                    success: 'Solicitante eliminado',
                                    error: 'No se pudo eliminar el solicitante',
                                }}
                            />
                        )}
                    </div>
                }
                aside={
                    <>
                        {/* Estado Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center text-sm">
                                        <Power className={`mr-2 h-4 w-4 ${item.is_active ? 'text-emerald-500' : 'text-red-500'}`} />
                                        Estado
                                    </span>
                                    <Badge variant={item.is_active ? 'success' : 'error'} className="font-medium">
                                        {item.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center text-sm">
                                        <Hash className="mr-2 h-4 w-4 text-sky-500" />
                                        Documento
                                    </span>
                                    <span className="font-mono text-sm font-medium">
                                        {item.tipo_documento}-{item.numero_documento}
                                    </span>
                                </div>
                                {item.expedientes_count !== undefined && item.expedientes_count !== null && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center text-sm">
                                            <FileText className="mr-2 h-4 w-4 text-emerald-500" />
                                            Expedientes
                                        </span>
                                        <span className="text-sm font-medium">{item.expedientes_count}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Fechas Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Fechas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center text-sm">
                                        <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                                        Creado
                                    </span>
                                    <span className="text-sm">{formatDate(item.created_at)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center text-sm">
                                        <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                                        Actualizado
                                    </span>
                                    <span className="text-sm">{formatDate(item.updated_at)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                }
            >
                {/* Información principal */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                Información del solicitante
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-muted-foreground text-sm">Tipo de documento</dt>
                                    <dd className="font-medium">{TIPO_DOC_LABELS[item.tipo_documento] || item.tipo_documento}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-muted-foreground text-sm">Número de documento</dt>
                                    <dd className="font-mono font-medium">{item.numero_documento}</dd>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-muted-foreground text-sm">{isJuridico ? 'Razón social' : 'Nombre completo'}</dt>
                                    <dd className="text-lg font-semibold">{item.nombre_razon_social}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Información de contacto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <dt className="text-muted-foreground flex items-center text-sm">
                                        <Phone className="mr-2 h-4 w-4" />
                                        Teléfono
                                    </dt>
                                    <dd className="font-medium">{item.telefono || '—'}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-muted-foreground flex items-center text-sm">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Correo electrónico
                                    </dt>
                                    <dd className="font-medium">
                                        {item.email ? (
                                            <a href={`mailto:${item.email}`} className="text-primary hover:underline">
                                                {item.email}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="text-muted-foreground flex items-center text-sm">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Dirección
                                    </dt>
                                    <dd className="font-medium">{item.direccion || '—'}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </ShowLayout>
        </AppLayout>
    );
}
