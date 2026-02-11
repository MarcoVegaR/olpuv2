import { FilterBadges } from '@/components/filters/FilterBadges';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleLeft } from 'lucide-react';
import React from 'react';

export type SolicitanteFilterValue = {
    is_active?: boolean;
};

interface SolicitanteFiltersProps {
    value: SolicitanteFilterValue;
    onChange: (filters: SolicitanteFilterValue) => void;
}

export function SolicitanteFilters({ value, onChange }: SolicitanteFiltersProps) {
    const [localFilters, setLocalFilters] = React.useState<SolicitanteFilterValue>(value);

    React.useEffect(() => {
        setLocalFilters(value);
    }, [value]);

    const activeFiltersCount = React.useMemo(() => {
        let count = 0;
        if (value.is_active !== undefined) count++;
        return count;
    }, [value]);

    const applyFilters = () => {
        onChange(localFilters);
    };

    const clearFilters = () => {
        const empty: SolicitanteFilterValue = {};
        setLocalFilters(empty);
        onChange(empty);
    };

    const badges = [] as Array<{ key: string; label: string; icon?: React.ReactNode; onRemove: () => void }>;

    if (value.is_active !== undefined) {
        badges.push({
            key: 'is_active',
            label: value.is_active ? 'Solo Activos' : 'Solo Inactivos',
            icon: <ToggleLeft className="h-3 w-3 text-violet-600 dark:text-violet-400" />,
            onRemove: () => onChange({ ...value, is_active: undefined }),
        });
    }

    return (
        <div className="flex items-center gap-2">
            <FilterSheet
                activeFiltersCount={activeFiltersCount}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
                title="Filtros de Solicitantes"
                description="Aplica filtros específicos para solicitantes"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <ToggleLeft className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        <Label htmlFor="is_active">Estado</Label>
                    </div>
                    <Select
                        value={localFilters.is_active === undefined ? 'all' : localFilters.is_active ? 'active' : 'inactive'}
                        onValueChange={(val) => setLocalFilters({ ...localFilters, is_active: val === 'all' ? undefined : val === 'active' })}
                    >
                        <SelectTrigger id="is_active" className="w-full">
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="active">Solo Activos</SelectItem>
                            <SelectItem value="inactive">Solo Inactivos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterSheet>

            <FilterBadges badges={badges} />
        </div>
    );
}
