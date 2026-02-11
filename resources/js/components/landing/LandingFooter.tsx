import { Button } from '@/components/ui/button';
import { ClipboardList, FileText } from 'lucide-react';

export default function LandingFooter() {
    return (
        <footer className="border-t">
            {/* Quick Access Bar */}
            <div className="bg-primary text-primary-foreground py-8">
                <div className="container mx-auto px-6 text-center">
                    <h3 className="mb-4 text-lg font-semibold">Accesos Rápidos</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button asChild variant="secondary" size="sm" className="gap-1.5">
                            <a href={route('public.tracking')}>
                                <ClipboardList className="size-4" />
                                Consultar Trámite
                            </a>
                        </Button>
                        <Button asChild variant="secondary" size="sm" className="gap-1.5">
                            <a href={route('public.requirements.index')}>
                                <FileText className="size-4" />
                                Requisitos y Recaudos
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer Content */}
            <div className="bg-card py-10">
                <div className="container mx-auto grid gap-8 px-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* About */}
                    <div>
                        <h4 className="text-foreground mb-3 text-sm font-semibold">Alcaldía de Chacao</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Somos una institución comprometida con el servicio al ciudadano, la transparencia y la innovación en la gestión pública
                            municipal.
                        </p>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-foreground mb-3 text-sm font-semibold">Contacto</h4>
                        <ul className="text-muted-foreground space-y-1.5 text-xs">
                            <li>Dirección: Av. Francisco de Miranda, Chacao, Caracas</li>
                            <li>
                                Correo:{' '}
                                <a href="mailto:atencion@chacao.gob.ve" className="text-primary hover:underline">
                                    atencion@chacao.gob.ve
                                </a>
                            </li>
                            <li>Teléfono: 0212-953.6222</li>
                        </ul>
                    </div>

                    {/* Developer */}
                    <div>
                        <h4 className="text-foreground mb-3 text-sm font-semibold">Desarrollo</h4>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Desarrollado por <span className="text-foreground font-medium">Caracoders Pro Services C.A.</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-border/50 text-muted-foreground border-t py-4 text-center text-xs">
                <div className="container mx-auto px-6">&copy; {new Date().getFullYear()} Chacao Verifica. Todos los derechos reservados.</div>
            </div>
        </footer>
    );
}
