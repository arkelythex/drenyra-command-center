export const payrollKeys = {
  all: ['payroll'] as const,
  employees: (companyId: string) => [...payrollKeys.all, 'employees', companyId] as const,
  calculate: (employeeId: string, period: string) =>
    [...payrollKeys.all, 'calculate', employeeId, period] as const,
} as const;
