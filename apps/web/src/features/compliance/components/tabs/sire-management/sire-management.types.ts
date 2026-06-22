export interface SireSummary {
  period: string;
  sunatCount: number;
  systemCount: number;
  differenceCount: number;
  totalAmount: number;
}

export type SireStatus =
  | 'Propuesta'
  | 'En Proceso'
  | 'No Registrado'
  | 'No Existe'
  | 'Registrado'
  | 'Sincronizado'
  | 'Observado'
  | 'Rechazado'
  | 'Anulado';

export type SireRowIcon = 'alert' | 'clock' | 'file';

export interface SireTableRowData {
  icon: SireRowIcon;
  id: string;
  provider: string;
  sunatStatus: SireStatus;
  internalStatus: SireStatus;
  amount: string;
  date: string;
  isCritical?: boolean;
}

export type SireSummaryIcon = 'sales' | 'purchases' | 'differences';

export interface SireSummaryCardData {
  icon: SireSummaryIcon;
  title: string;
  badge: string;
  count: number | string;
  unit: string;
  variant: 'default' | 'alert';
}
