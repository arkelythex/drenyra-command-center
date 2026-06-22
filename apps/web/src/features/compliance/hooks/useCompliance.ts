import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveCompanyContext } from '@/lib/use-active-company-context';
import {
  buildComplianceOverviewData,
  complianceKeys,
  complianceOverviewQueryOptions,
  type ComplianceOverviewData,
} from '../compliance.query';

export type ComplianceTab = 'ruc' | 'cpe' | 'sire' | 'risk' | 'detracciones';

export const useCompliance = () => {
  const {
    companyContext: { companyId },
  } = useActiveCompanyContext();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ComplianceTab>('sire');
  const [isSyncing, setIsSyncing] = useState(false);
  const { data } = useQuery(complianceOverviewQueryOptions(companyId));

  const runGlobalSync = useCallback(async () => {
    setIsSyncing(true);
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
    const currentLastSync = data?.lastSync ? new Date(data.lastSync).getTime() : Date.now();
    const nextLastSync = new Date(Math.max(Date.now(), currentLastSync + 1)).toISOString();
    queryClient.setQueryData(
      complianceKeys.overview(companyId),
      (current: ComplianceOverviewData | undefined) => ({
        ...(current ?? buildComplianceOverviewData()),
        lastSync: nextLastSync,
      }),
    );
    setIsSyncing(false);
  }, [companyId, data?.lastSync, queryClient]);

  const overview = data ?? buildComplianceOverviewData();
  const syncStats = overview.syncStats;
  const lastSync = new Date(overview.lastSync);

  return {
    activeTab,
    setActiveTab,
    isSyncing,
    lastSync,
    runGlobalSync,
    syncStats
  };
};
