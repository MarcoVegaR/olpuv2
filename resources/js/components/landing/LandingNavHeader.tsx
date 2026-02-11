import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type Auth } from '@/types';
import { Link } from '@inertiajs/react';
import { ClipboardList, FileText, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LandingNavHeaderProps {
    auth: Auth;
}

export default function LandingNavHeader({ auth }: LandingNavHeaderProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <header className="border-border/50 bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
            <div className="container mx-auto flex items-center justify-between px-6 py-3">
                {/* Logo & Brand */}
                <Link href="/" className="flex items-center gap-3">
                    <div className="from-primary flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br to-blue-700 text-white shadow-sm">
                        <AppLogoIcon className="size-5 fill-current text-white" />
                    </div>
                    <div className="grid text-left leading-tight">
                        <span className="text-foreground text-sm font-semibold tracking-tight">Alcaldía de Chacao</span>
                        <span className="text-muted-foreground text-xs">Innovación y Servicio</span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-1 md:flex">
                    <Button asChild variant="ghost" size="sm" className="gap-1.5">
                        <a href={route('public.tracking')}>
                            <ClipboardList className="size-4" />
                            Consultar Trámite
                        </a>
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="gap-1.5">
                        <a href={route('public.requirements.index')}>
                            <FileText className="size-4" />
                            Requisitos
                        </a>
                    </Button>
                    {auth.user ? (
                        <Button asChild size="sm">
                            <Link href={route('dashboard')}>Ir al panel</Link>
                        </Button>
                    ) : (
                        <Button asChild size="sm">
                            <Link href={route('login')}>
                                <LogIn className="mr-1.5 size-4" />
                                Iniciar Sesión
                            </Link>
                        </Button>
                    )}
                </nav>

                {/* Mobile toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                >
                    {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
            </div>

            {/* Mobile Navigation */}
            {mobileOpen && (
                <div className="border-border/50 bg-background border-t px-6 pb-4 md:hidden">
                    <nav className="flex flex-col gap-2 pt-3">
                        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
                            <a href={route('public.tracking')}>
                                <ClipboardList className="size-4" />
                                Consultar Trámite
                            </a>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
                            <a href={route('public.requirements.index')}>
                                <FileText className="size-4" />
                                Requisitos
                            </a>
                        </Button>
                        {auth.user ? (
                            <Button asChild size="sm" className="w-full">
                                <Link href={route('dashboard')}>Ir al panel</Link>
                            </Button>
                        ) : (
                            <Button asChild size="sm" className="w-full">
                                <Link href={route('login')}>
                                    <LogIn className="mr-1.5 size-4" />
                                    Iniciar Sesión
                                </Link>
                            </Button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
