import React from 'react';
/**
 * Invoice Filters Component
 * Advanced filtering UI for invoices
 */

import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCustomers } from '../../customers/hooks/useCustomers';
import { InvoiceFilters } from '../types/invoice-filters';
import { InvoiceSearch } from './filters/InvoiceSearch';
import { InvoiceAdvancedFilters } from './filters/InvoiceAdvancedFilters';
import { InvoiceActiveFilters } from './filters/InvoiceActiveFilters';

export type { InvoiceFilters };

interface InvoiceFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onClearFilters: () => void;
}

export const InvoiceFiltersComponent: React.FC<InvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const { data: customers } = useCustomers();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<InvoiceFilters>(filters);

  // Sync local filters with prop filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setShowFilters(false);
  };

  const handleClearAll = () => {
    setLocalFilters({});
    onClearFilters();
    setShowFilters(false);
  };

  const handleSearch = () => {
    onFiltersChange(localFilters);
  };

  const handleRemoveFilter = (key: keyof InvoiceFilters) => {
    const newFilters = { ...localFilters, [key]: undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof InvoiceFilters] !== undefined && filters[key as keyof InvoiceFilters] !== ''
  ).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <InvoiceSearch
          value={localFilters.search || ''}
          onChange={(val) => setLocalFilters({ ...localFilters, search: val })}
          onSearch={handleSearch}
        />

        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <InvoiceAdvancedFilters
              filters={localFilters}
              setFilters={setLocalFilters}
              customers={customers}
              onApply={handleApplyFilters}
              onCancel={() => setShowFilters(false)}
              onClear={handleClearAll}
              hasActiveFilters={activeFiltersCount > 0}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <InvoiceActiveFilters
          filters={localFilters}
          customers={customers}
          onRemove={handleRemoveFilter}
        />
      )}
    </div>
  );
};