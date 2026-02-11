import { FilterBadges } from '@/components/filters/FilterBadges';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CreditCard, FileText } from 'lucide-react';
import React from 'react';

export type ExpedienteFilterValue = {
    procedure_type_id?: number;
    solicitante_tipo_documento?: string;
    solicitante_numero_documento_like?: string;
    status?: string;
};

interface ExpedienteFiltersProps {
    value: ExpedienteFilterValue;
    onChange: (filters: ExpedienteFilterValue) => void;
    procedureTypes?: Array<{ id: number; name: string }>;
}

export function ExpedienteFilters({ value, onChange, procedureTypes = [] }: ExpedienteFiltersProps) {
    const [localFilters, setLocalFilters] = React.useState<ExpedienteFilterValue>(value);

    React.useEffect(() => {
        setLocalFilters(value);
    }, [value]);

    const activeFiltersCount = React.useMemo(() => {
        let count = 0;
        if (value.procedure_type_id) count++;
        if (value.solicitante_tipo_documento) count++;
        if (value.solicitante_numero_documento_like) count++;
        return count;
    }, [value]);

    const applyFilters = () => {
        onChange(localFilters);
    };

    const clearFilters = () => {
        const empty: ExpedienteFilterValue = {};
        setLocalFilters(empty);
        onChange(empty);
    };

    const badges = [] as Array<{ key: string; label: string; icon?: React.ReactNode; onRemove: () => void }>;

    if (value.procedure_type_id) {
        const pt = procedureTypes.find((p) => p.id === value.procedure_type_id);
        badges.push({
            key: 'procedure_type_id',
            label: `Trámite: ${pt?.name ?? value.procedure_type_id}`,
            icon: <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />,
            onRemove: () => onChange({ ...value, procedure_type_id: undefined }),
        });
    }

    if (value.solicitante_tipo_documento) {
        badges.push({
            key: 'solicitante_tipo_documento',
            label: `Solicitante Doc: ${value.solicitante_tipo_documento}`,
            icon: <CreditCard className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
            onRemove: () => onChange({ ...value, solicitante_tipo_documento: undefined }),
        });
    }

    if (value.solicitante_numero_documento_like) {
        badges.push({
            key: 'solicitante_numero_documento_like',
            label: `Solicitante N°: ${value.solicitante_numero_documento_like}`,
            icon: <CreditCard className="h-3 w-3 text-amber-600 dark:text-amber-400" />,
            onRemove: () => onChange({ ...value, solicitante_numero_documento_like: undefined }),
        });
    }

    return (
        <div className="flex items-center gap-2">
            <FilterSheet
                activeFiltersCount={activeFiltersCount}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                title="Filtros de Expedientes"
                description="Aplica filtros específicos para expedientes"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <Label htmlFor="procedure_type_id">Tipo de Trámite</Label>
                    </div>
                    <Select
                        value={localFilters.procedure_type_id ? String(localFilters.procedure_type_id) : 'all'}
                        onValueChange={(val) => setLocalFilters({ ...localFilters, procedure_type_id: val === 'all' ? undefined : Number(val) })}
                    >
                        <SelectTrigger id="procedure_type_id" className="w-full">
                            <SelectValue placeholder="Seleccionar trámite" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {procedureTypes.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <Label htmlFor="solicitante_tipo_documento">Solicitante: Tipo doc</Label>
                    </div>
                    <Select
                        value={localFilters.solicitante_tipo_documento ? String(localFilters.solicitante_tipo_documento) : 'all'}
                        onValueChange={(val) => setLocalFilters({ ...localFilters, solicitante_tipo_documento: val === 'all' ? undefined : val })}
                    >
                        <SelectTrigger id="solicitante_tipo_documento" className="w-full">
                            <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="V">V</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="J">J</SelectItem>
                            <SelectItem value="G">G</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <Label htmlFor="solicitante_numero_documento_like">Solicitante: N° doc</Label>
                    </div>
                    <Input
                        id="solicitante_numero_documento_like"
                        value={localFilters.solicitante_numero_documento_like ?? ''}
                        onChange={(e) => setLocalFilters({ ...localFilters, solicitante_numero_documento_like: e.target.value || undefined })}
                        placeholder="Ej: 123"
                    />
                </div>
            </FilterSheet>

            <FilterBadges badges={badges} />
        </div>
    );
}
