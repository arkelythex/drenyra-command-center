'use client';

import { UploadCloud, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CompanySetupDraft } from '../../types/onboarding.types';

interface CertificateStepProps {
  data: CompanySetupDraft;
  onUpdate: (data: CompanySetupDraft) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function CertificateStep({
  data,
  onUpdate,
  onNext,
  onSkip,
  onBack,
}: CertificateStepProps): JSX.Element {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-2">
        <h3 className="text-lg font-black uppercase tracking-tight">Certificado Digital</h3>
        <p className="text-sm text-muted-foreground">Puedes cargarlo ahora o terminar el setup y configurarlo después.</p>
      </div>

      <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <UploadCloud size={24} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">Arrastra tu archivo .pfx o .p12</p>
          <p className="text-xs text-muted-foreground mt-1">Máximo 5MB</p>
        </div>
        <Input 
          type="file" 
          accept=".pfx,.p12" 
          className="hidden" 
          id="cert-upload"
          onChange={(e) => onUpdate({ certificate: e.target.files?.[0] })}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            document.getElementById('cert-upload')?.click();
          }}
        >
          Seleccionar Archivo
        </Button>
        {data.certificate && <p className="text-xs text-[var(--premium-success)] font-bold">{data.certificate.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Contraseña del Certificado</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="password"
            value={data.certificatePassword || ''}
            onChange={(e) => onUpdate({ certificatePassword: e.target.value })}
            placeholder="••••••••" 
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-2xs font-black uppercase tracking-widest text-muted-foreground">Credenciales SOL (Usuario Secundario)</label>
        <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Usuario SOL" value={data.solUser || ''} onChange={(e) => onUpdate({ solUser: e.target.value })} />
            <Input type="password" placeholder="Clave SOL" value={data.solPass || ''} onChange={(e) => onUpdate({ solPass: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 font-black uppercase tracking-widest">Atrás</Button>
        <Button variant="outline" onClick={onSkip} className="flex-1 font-black uppercase tracking-widest">Omitir</Button>
        <Button onClick={onNext} disabled={!data.certificate} className="flex-[2] font-black uppercase tracking-widest">Continuar con Certificado</Button>
      </div>
    </div>
  );
}
