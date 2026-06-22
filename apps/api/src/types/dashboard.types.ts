export interface DashboardFinancials {
  totalSales: number;
  totalExpenses: number;
  netIncome: number;
  igvToPay: number;
  igvCredit: number;
}

export interface DashboardSummary {
  financials: DashboardFinancials;
  recentTransactions: Array<Record<string, unknown>>;
}

export interface ComplianceRisk {
  id: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  message: string;
}

export interface ComplianceHealth {
  complianceScore: number;
  level: 'EXCELENTE' | 'BUENO' | 'CRÍTICO';
  risks: ComplianceRisk[];
}
