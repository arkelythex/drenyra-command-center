export const bankingKeys = {
  all: ['banking'] as const,
  accounts: (companyId: string) => [...bankingKeys.all, 'accounts', companyId] as const,
  transactionsRoot: (accountId: string) => [...bankingKeys.all, 'transactions', accountId] as const,
  transactions: (
    accountId: string,
    filters?: { startDate?: string; endDate?: string },
  ) =>
    [
      ...bankingKeys.transactionsRoot(accountId),
      filters?.startDate ?? 'ALL',
      filters?.endDate ?? 'ALL',
    ] as const,
  summary: (companyId: string) => [...bankingKeys.all, 'summary', companyId] as const,
  engine: (accountId: string) => ['banking-engine', accountId] as const,
  cbdcWallet: (walletId: string | null) => ['cbdc-wallet', walletId] as const,
} as const;
