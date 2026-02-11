import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type Auth } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Shield } from 'lucide-react';

interface LandingHeroProps {
    auth: Auth;
}

export default function LandingHero({ auth }: LandingHeroProps) {
    return (
        <section className="from-primary/5 relative overflow-hidden bg-gradient-to-b to-transparent pt-20 pb-16 lg:pt-28 lg:pb-24">
            {/* Background decorative elements */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="bg-primary/8 absolute -top-20 -left-20 h-72 w-72 rounded-full blur-3xl" />
                <div className="bg-primary/6 absolute right-10 -bottom-16 h-56 w-56 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto grid items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
                {/* Left: Copy */}
                <div className="max-w-xl">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                        <span className="from-primary bg-gradient-to-r to-blue-700 bg-clip-text text-transparent">Chacao Verifica</span>
                        <span className="text-foreground mt-2 block text-2xl font-semibold sm:text-3xl">Gestión integral de trámites</span>
                    </h1>
                    <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty">
                        Plataforma única para la <strong className="text-primary font-semibold">emisión</strong>,{' '}
                        <strong className="text-primary font-semibold">verificación</strong> y{' '}
                        <strong className="text-primary font-semibold">gestión</strong> de trámites municipales con eficiencia y transparencia.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        {auth.user ? (
                            <Button asChild size="lg">
                                <Link href={route('dashboard')}>
                                    Ir al panel <ArrowRight className="ml-1.5 size-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="lg">
                                <Link href={route('login')}>
                                    Iniciar Sesión <ArrowRight className="ml-1.5 size-4" />
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline" size="lg">
                            <a href={route('public.requirements.index')}>Ver requisitos</a>
                        </Button>
                    </div>
                </div>

                {/* Right: Brand card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="bg-card relative w-full max-w-sm rounded-2xl border p-8 shadow-lg">
                        <div className="from-primary/10 pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br to-transparent" />
                        <div className="flex flex-col items-center gap-5 text-center">
                            <div className="from-primary flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br to-blue-700 text-white shadow-md">
                                <AppLogoIcon className="size-11 fill-current text-white" />
                            </div>
                            <div>
                                <h2 className="text-foreground text-xl font-bold">Alcaldía de Chacao</h2>
                                <p className="text-muted-foreground text-sm">Innovación y Servicio</p>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                <Shield className="text-primary size-4" />
                                <span>Documentos verificables con QR seguro</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
