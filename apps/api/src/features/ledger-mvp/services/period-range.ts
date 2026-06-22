export interface LedgerPeriodRange {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
}

export function resolveLedgerPeriodRange(period: string): LedgerPeriodRange {
  const pattern = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!pattern.test(period)) {
    throw new Error('Invalid period format. Expected YYYY-MM');
  }

  const [yearValue, monthValue] = period.split('-');
  const year = Number.parseInt(yearValue, 10);
  const month = Number.parseInt(monthValue, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error('Invalid period values. Expected numeric YYYY-MM');
  }

  return {
    year,
    month,
    startDate: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
    endDate: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
  };
}
