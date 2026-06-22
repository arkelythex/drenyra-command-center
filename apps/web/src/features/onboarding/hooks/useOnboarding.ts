'use client';

import { useState } from 'react';
import { type CompanySetupDraft, type OnboardingStep, type RucLookupResult } from '../types/onboarding.types';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import {
  buildDemoSessionPayload,
  enableDemoAccess,
} from '@/features/auth/lib/demo-access';
import {
  DEMO_COMPANY_NAME,
  DEMO_COMPANY_RUC,
} from '@/lib/company-context';
import { simulateLatency } from '@/lib/simulated-latency';

interface UseOnboardingResult {
  currentStep: OnboardingStep;
  formData: CompanySetupDraft;
  isSubmitting: boolean;
  updateData: (data: CompanySetupDraft) => void;
  nextStep: () => void;
  prevStep: () => void;
  fetchRuc: (ruc: string) => Promise<RucLookupResult | null>;
}

export function useOnboarding(): UseOnboardingResult {
  const { updateUser, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [currentStep, setStep] = useState<OnboardingStep>('COMPANY');
  const [formData, setFormData] = useState<CompanySetupDraft>({
    taxRegime: 'RMT',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = (data: CompanySetupDraft): void => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = (): void => {
    if (currentStep === 'COMPANY') setStep('CERTIFICATE');
    else if (currentStep === 'CERTIFICATE') setStep('BRANDING');
    else if (currentStep === 'BRANDING') void finishOnboarding();
  };

  const prevStep = (): void => {
    if (currentStep === 'CERTIFICATE') setStep('COMPANY');
    else if (currentStep === 'BRANDING') setStep('CERTIFICATE');
  };

  const finishOnboarding = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await simulateLatency(2000);

      const demoAccess = enableDemoAccess({
        companyName: formData.legalName,
        ruc: formData.ruc,
        taxRegime: formData.taxRegime,
      });
      const demoSession = buildDemoSessionPayload(demoAccess);

      setSession(demoSession);
      updateUser({
        companyId: demoAccess.companyId,
        companyName: demoAccess.companyName,
        ruc: demoAccess.ruc,
        taxRegime: demoAccess.taxRegime,
        role: 'ADMIN',
        emailVerified: true,
      });
      setStep('COMPLETE');
      toast.success('Empresa configurada exitosamente', {
        description: 'Ingresando al dashboard demo operativo.',
      });
      await navigate({ to: '/dashboard' });
    } catch (error: unknown) {
      toast.error('Error al guardar configuración', {
        description:
          error instanceof Error ? error.message : 'No se pudo completar el onboarding.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock RUC Lookup
  const fetchRuc = async (ruc: string): Promise<RucLookupResult | null> => {
    if (ruc.length !== 11) return null;
    await simulateLatency(800);

    if (ruc === DEMO_COMPANY_RUC) {
      return {
        legalName: DEMO_COMPANY_NAME,
        address: 'Av. Javier Prado Este 1021, San Isidro, Lima',
        taxRegime: 'RMT',
      };
    }

    return {
      legalName: `EMPRESA DEMO ${ruc.slice(-4)} S.A.C.`,
      address: 'Av. Principal 100, San Isidro, Lima',
      taxRegime: 'RMT',
    };
  };

  return {
    currentStep,
    formData,
    isSubmitting,
    updateData,
    nextStep,
    prevStep,
    fetchRuc
  };
}
