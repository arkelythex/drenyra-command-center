'use client';

import { type FocusEvent, useState } from 'react';
import { Search, Building2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CompanySetupDraft, RucLookupResult } from '../../types/onboarding.types';

interface CompanyStepProps {
  data: CompanySetupDraft;
  onUpdate: (data: CompanySetupDraft) => void;
  onNext: () => void;
  fetchRuc: (ruc: string) => Promise<RucLookupResult | null>;
}

export function CompanyStep({ data, onUpdate, onNext, fetchRuc }: CompanyStepProps): JSX.Element {
  const [loading, setLoading] = useState(false);

  const handleRucBlur = async (e: FocusEvent<HTMLInputElement>): Promise<void> => {
    const ruc = e.target.value;
    if (ruc.length === 11) {
      setLoading(true);
      const res = await fetchRuc(ruc);
      if (res) {
        onUpdate({ ruc, ...res });
      }
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-2">
        <h3 className="text-lg font-black uppercase tracking-tight">Empresa y Cumplimiento</h3>
        <p className="text-sm text-muted-foreground">Ingresa tu RUC para configurar el entorno fiscal de la empresa.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">RUC</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
            <Input 
              value={data.ruc || ''}
              onChange={(e) => onUpdate({ ruc: e.target.value.replace(/\D/g, '') })}
              onBlur={handleRucBlur}
              placeholder="20XXXXXXXXX" 
              className="pl-10 font-mono"
              maxLength={11}
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Razón Social</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={data.legalName || ''}
              onChange={(e) => onUpdate({ legalName: e.target.value })}
              placeholder="Razón Social automática" 
              className="pl-10"
              readOnly={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Dirección Fiscal</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={data.address || ''}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Dirección fiscal" 
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Régimen Tributario</label>
          <Select
            value={data.taxRegime || 'RMT'}
            onValueChange={(value) => onUpdate({ taxRegime: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un régimen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RUS">Nuevo RUS</SelectItem>
              <SelectItem value="RER">Régimen Especial</SelectItem>
              <SelectItem value="RMT">Régimen MYPE Tributario</SelectItem>
              <SelectItem value="RG">Régimen General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!data.ruc || !data.legalName || !data.taxRegime}
        className="w-full font-black uppercase tracking-widest"
      >
        Continuar
      </Button>
    </div>
  );
}
