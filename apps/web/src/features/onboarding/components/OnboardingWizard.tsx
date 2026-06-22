'use client';

import { useOnboarding } from '../hooks/useOnboarding';
import { CompanyStep } from './steps/CompanyStep';
import { CertificateStep } from './steps/CertificateStep';
import { BrandingStep } from './steps/BrandingStep';
import { ShieldCheck } from 'lucide-react';

export function OnboardingWizard(): JSX.Element {
  const { currentStep, formData, isSubmitting, updateData, nextStep, prevStep, fetchRuc } = useOnboarding();

  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary via-[rgba(var(--premium-info-rgb),0.20)] to-primary" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-2xl space-y-8">
          
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 mx-auto mb-6">
                <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Activa Tu Entorno</h1>
            <p className="text-muted-foreground">Configura tu empresa y entra a la cabina operativa en minutos.</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            {['COMPANY', 'CERTIFICATE', 'BRANDING'].map((step, idx) => (
                <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${
                    ['COMPANY', 'CERTIFICATE', 'BRANDING'].indexOf(currentStep) >= idx ? 'bg-primary' : 'bg-muted'
                }`} />
            ))}
          </div>

          <div className="rounded-3xl border border-border/40 bg-card p-10 shadow-xl">
            {currentStep === 'COMPANY' && (
                <CompanyStep 
                    data={formData} 
                    onUpdate={updateData} 
                    onNext={nextStep} 
                    fetchRuc={fetchRuc}
                />
            )}
            {currentStep === 'CERTIFICATE' && (
                <CertificateStep 
                    data={formData} 
                    onUpdate={updateData} 
                    onNext={nextStep} 
                    onSkip={nextStep}
                    onBack={prevStep}
                />
            )}
            {currentStep === 'BRANDING' && (
                <BrandingStep 
                    data={formData} 
                    onUpdate={updateData} 
                    onSubmit={nextStep} 
                    onBack={prevStep}
                    isSubmitting={isSubmitting}
                />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
