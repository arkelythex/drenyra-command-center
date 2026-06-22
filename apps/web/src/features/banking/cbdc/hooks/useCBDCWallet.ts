import { useQuery } from '@tanstack/react-query';
import { WalletBalance, CBDCWalletOptions } from '../types';
import { bankingKeys } from '../../api/query-keys';
import { simulateLatency } from '@/lib/simulated-latency';

// Mock API function (placeholder for actual API call)
const fetchWalletBalance = async (walletId: string | null): Promise<WalletBalance> => {
  // Simulate API delay
  await simulateLatency(1000);

  // Return mock data for now
  return {
    wallet_id: walletId || 'default-wallet',
    balance: {
      available: 5420.00,
      pending: 150.00,
      currency: 'PEN_CBDC'
    },
    last_update: new Date().toISOString()
  };
};

export const useCBDCWallet = ({ walletId = null, enableRealTime = true }: CBDCWalletOptions = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
    isStale
  } = useQuery({
    queryKey: bankingKeys.cbdcWallet(walletId),
    queryFn: () => fetchWalletBalance(walletId),
    refetchInterval: enableRealTime ? 5000 : false, // Real-time sync every 5s if enabled
    staleTime: 10000,
  });

  return {
    balance: data?.balance.available ?? 0,
    pendingBalance: data?.balance.pending ?? 0,
    totalBalance: (data?.balance.available ?? 0) + (data?.balance.pending ?? 0),
    currency: data?.balance.currency ?? 'PEN_CBDC',
    syncStatus: isLoading ? 'syncing' : error ? 'error' : isStale ? 'stale' : 'synced',
    lastSync: data?.last_update ? new Date(data.last_update) : null,
    isLoading,
    error,
    walletInfo: data ? { id: data.wallet_id } : null,
    refetch,
    rawData: data
  };
};
