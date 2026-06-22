export interface Entity {
  id: string;
  legalName: string;
  taxId: string;
  condition: 'HABIDO' | 'NO HABIDO';
  status: 'ACTIVO' | 'INACTIVO';
  complianceScore: number;
  totalSpend: number;
  txCount: number;
  lastTx: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'CUSTOMER' | 'VENDOR';
}