import React from 'react';
import { useState } from 'react';
import { MobileSummaryChart } from './mobile-financial-summary/mobile-summary-chart';
import {
  MOBILE_SUMMARY_MONTHS,
  MOBILE_SUMMARY_SCORE,
  MOBILE_SUMMARY_TABS,
} from './mobile-financial-summary/mobile-summary.constants';
import { MobileSummaryFab } from './mobile-financial-summary/mobile-summary-fab';
import { MobileSummaryHeader } from './mobile-financial-summary/mobile-summary-header';
import { MobileSummaryPeriodCard } from './mobile-financial-summary/mobile-summary-period-card';
import { MobileSummaryTimelineScore } from './mobile-financial-summary/mobile-summary-timeline-score';
import type { MobileSummaryTab } from './mobile-financial-summary/mobile-summary.types';

interface MobileFinancialSummaryProps {
  onViewDetails?: (section: string) => void;
  onTabChange?: (tab: MobileSummaryTab) => void;
}

export const MobileFinancialSummary: React.FC<MobileFinancialSummaryProps> = ({
  onViewDetails,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<MobileSummaryTab>('resumen');

  const handleTabChange = (tab: MobileSummaryTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(var(--premium-info-rgb),0.09),transparent_20%),linear-gradient(180deg,#050505_0%,#0a0a0a_100%)] text-[var(--premium-text-primary)] font-sans">
      <MobileSummaryHeader
        tabs={MOBILE_SUMMARY_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <MobileSummaryChart />
      <MobileSummaryPeriodCard />
      <MobileSummaryTimelineScore
        months={MOBILE_SUMMARY_MONTHS}
        scoreValue={MOBILE_SUMMARY_SCORE.value}
        scoreMax={MOBILE_SUMMARY_SCORE.max}
        scoreLabel={MOBILE_SUMMARY_SCORE.label}
      />
      <MobileSummaryFab onClick={() => onViewDetails?.('new-transaction')} />
    </div>
  );
};
