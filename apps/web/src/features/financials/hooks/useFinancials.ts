import { useState, useMemo } from 'react';

export type ReportTab = 'pnl' | 'balance' | 'cashflow' | 'ap' | 'ar';

export interface FinancialLine {
  label: string;
  amount: number;
  isTotal?: boolean;
  level?: number;
}

const BALANCE_DATA: FinancialLine[] = [
  { label: 'ACTIVO CORRIENTE', amount: 1542000, isTotal: true, level: 0 },
  { label: 'Efectivo y Equivalentes', amount: 1121182, level: 1 },
  { label: 'Cuentas por Cobrar', amount: 320818, level: 1 },
  { label: 'Existencias', amount: 100000, level: 1 },
  { label: 'ACTIVO NO CORRIENTE', amount: 850000, isTotal: true, level: 0 },
  { label: 'Inmuebles y Equipo', amount: 900000, level: 1 },
  { label: 'Depreciación', amount: -50000, level: 1 },
  { label: 'TOTAL ACTIVO', amount: 2392000, isTotal: true, level: 0 },
];

const PNL_DATA: FinancialLine[] = [
  { label: 'VENTAS NETAS', amount: 714932, isTotal: true, level: 0 },
  { label: 'COSTO DE VENTAS', amount: -420000, level: 0 },
  { label: 'UTILIDAD BRUTA', amount: 294932, isTotal: true, level: 0 },
  { label: 'GASTOS ADMINISTRATIVOS', amount: -120000, level: 1 },
  { label: 'GASTOS DE VENTAS', amount: -50431, level: 1 },
  { label: 'UTILIDAD OPERATIVA', amount: 124501, isTotal: true, level: 0 },
];

export const useFinancials = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('pnl');
  const [chatQuery, setChatQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const reportData = useMemo(() => {
    switch (activeTab) {
      case 'balance': return BALANCE_DATA;
      case 'pnl': return PNL_DATA;
      case 'cashflow': return BALANCE_DATA; // Placeholder
      default: return PNL_DATA;
    }
  }, [activeTab]);

  return {
    activeTab,
    setActiveTab,
    reportData,
    chatQuery,
    setChatQuery,
    isChatOpen,
    setIsChatOpen
  };
};
