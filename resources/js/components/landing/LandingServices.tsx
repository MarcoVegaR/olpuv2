import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Auth } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, ClipboardList, FileText, LogIn } from 'lucide-react';

interface LandingServicesProps {
    auth: Auth;
}

export default function LandingServices({ auth }: LandingServicesProps) {
    const services = [
        {
            icon: ClipboardList,
            title: 'Consultar Trámite',
            description: 'Verifique el estado actual de su trámite municipal mediante el número de seguimiento.',
            href: route('public.tracking'),
            label: 'Acceder',
        },
        {
            icon: FileText,
            title: 'Documentación Requerida',
            description: 'Información sobre la documentación necesaria para iniciar un trámite municipal.',
            href: route('public.requirements.index'),
            label: 'Acceder',
        },
        {
            icon: LogIn,
            title: auth.user ? 'Ir al Panel' : 'Iniciar Sesión',
            description: auth.user
                ? 'Acceda al panel de gestión para administrar trámites y expedientes.'
                : 'Acceda a su cuenta para gestionar sus trámites y verificar su estado.',
            href: auth.user ? route('dashboard') : route('login'),
            label: 'Acceder',
        },
    ];

    return (
        <section className="bg-background py-16 lg:py-24">
            <div className="container mx-auto px-6">
                <div className="mx-auto mb-10 max-w-2xl text-center">
                    <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Servicios de Trámites</h2>
                    <p className="text-muted-foreground mt-2 text-base">Información sobre trámites y servicios municipales</p>
                </div>

                <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <Link key={service.title} href={service.href} className="group">
                            <Card className="h-full transition-shadow hover:-translate-y-0.5 hover:shadow-md">
                                <CardHeader className="pb-3">
                                    <div className="bg-primary/10 mb-3 flex size-11 items-center justify-center rounded-lg">
                                        <service.icon className="text-primary size-5" />
                                    </div>
                                    <CardTitle className="text-lg">{service.title}</CardTitle>
                                    <CardDescription className="text-sm leading-relaxed">{service.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <span className="text-primary group-hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium transition-colors">
                                        {service.label}
                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
