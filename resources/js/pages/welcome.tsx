import LandingFooter from '@/components/landing/LandingFooter';
import LandingHero from '@/components/landing/LandingHero';
import LandingNavHeader from '@/components/landing/LandingNavHeader';
import LandingServices from '@/components/landing/LandingServices';
import { type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Chacao Verifica - Gestión Integral de Trámites Municipales" />
            <div className="bg-background text-foreground flex min-h-screen flex-col">
                <LandingNavHeader auth={auth} />
                <main className="flex-1">
                    <LandingHero auth={auth} />
                    <LandingServices auth={auth} />
                </main>
                <LandingFooter />
            </div>
        </>
    );
}
