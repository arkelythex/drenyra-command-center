import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { simulateLatency } from '@/lib/simulated-latency';
import { Prediction } from '../types/inventory.types';
import { inventoryKeys } from '../api/query-keys';

interface AlertRecord {
  productName: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  daysUntilStockout: number;
  consumptionRate: number;
}

interface UsePredictionsResult {
  predictions: Prediction[];
}

// Mock Data
const MOCK_ALERTS: AlertRecord[] = [
  { productName: 'Impresora Epson L3150', severity: 'HIGH', daysUntilStockout: 2, consumptionRate: 15 },
  { productName: 'Monitor LG Ultrawide', severity: 'MEDIUM', daysUntilStockout: 8, consumptionRate: 5 },
  { productName: 'SSD Samsung 1TB', severity: 'LOW', daysUntilStockout: 25, consumptionRate: 2 },
  { productName: 'Cable HDMI 2.1', severity: 'HIGH', daysUntilStockout: 1, consumptionRate: 30 },
];

function toPrediction(alert: AlertRecord): Prediction {
  return {
    item: alert.productName,
    status: alert.severity === 'HIGH' ? 'Critical' : 'Warning',
    days: alert.daysUntilStockout || 0,
    usage: alert.consumptionRate > 10 ? 'High' : 'Low',
    action: alert.severity === 'HIGH' ? 'Reorder Now' : 'Monitor',
  };
}

export const usePredictions = (): UsePredictionsResult => {
  const { user } = useAuthStore();
  const companyId = user?.companyId || 'demo-mode';

  const { data } = useQuery<AlertRecord[]>({
    queryKey: inventoryKeys.alerts(companyId),
    queryFn: async (): Promise<AlertRecord[]> => {
      await simulateLatency(750);
      return MOCK_ALERTS;
    }
  });

  // Adapter: Backend Alert -> UI Prediction
  const predictions: Prediction[] = (Array.isArray(data) ? data : []).map(toPrediction);

  return { predictions };
};
