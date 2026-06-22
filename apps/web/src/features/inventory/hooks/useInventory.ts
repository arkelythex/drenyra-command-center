import { useQuery } from '@tanstack/react-query';
import { n } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { simulateLatency } from '@/lib/simulated-latency';
import { inventoryKeys } from '../api/query-keys';

// Mock Data for "Solo Frontend" (Demo Mode)
const MOCK_SUMMARY = {
  totalValue: 1254300.50,
  rotationRate: 1.2
};

const MOCK_STOCK = [
  { id: '1', sku: 'LAP-001', name: 'Laptop Dell XPS 15', stock: 45, unit: 'UND', lastMovement: '2026-06-12', status: 'optimal' },
  { id: '2', sku: 'MON-023', name: 'Monitor LG Ultrawide', stock: 12, unit: 'UND', lastMovement: '2026-06-10', status: 'low' },
  { id: '3', sku: 'PRN-004', name: 'Impresora Epson L3150', stock: 5, unit: 'UND', lastMovement: '2026-06-08', status: 'critical' },
  { id: '4', sku: 'KEY-102', name: 'Teclado Mecánico RGB', stock: 150, unit: 'UND', lastMovement: '2026-06-14', status: 'optimal' },
];

const MOCK_ALERTS = [
  { productName: 'Impresora Epson L3150', severity: 'HIGH', daysUntilStockout: 2, consumptionRate: 15 },
  { productName: 'Monitor LG Ultrawide', severity: 'MEDIUM', daysUntilStockout: 8, consumptionRate: 5 },
];

const MOCK_MOVEMENTS = [
  { id: 'MOV-120', type: 'IN' as const, item: 'Laptop Dell XPS 15', qty: '10', cost: 'S/ 4,500', total: 'S/ 45,000', date: 'Hace 5 min', user: 'Admin' },
  { id: 'MOV-121', type: 'OUT' as const, item: 'Monitor LG Ultrawide', qty: '2', cost: 'S/ 850', total: 'S/ 1,700', date: 'Hace 12 min', user: 'Admin' },
  { id: 'MOV-122', type: 'IN' as const, item: 'Teclado Mecánico RGB', qty: '50', cost: 'S/ 120', total: 'S/ 6,000', date: 'Hace 45 min', user: 'Admin' },
  { id: 'MOV-123', type: 'OUT' as const, item: 'Impresora Epson L3150', qty: '1', cost: 'S/ 750', total: 'S/ 750', date: 'Hace 1 hora', user: 'Logística' },
];

export const useInventory = () => {
  const { user } = useAuthStore();
  const companyId = user?.companyId || 'demo-mode';

  // 1. Fetch Summary (Mocked)
  const { data: summary } = useQuery({
    queryKey: inventoryKeys.summary(companyId),
    queryFn: async () => {
      await simulateLatency(500);
      return MOCK_SUMMARY;
    }
  });

  // 2. Fetch Alerts (Mocked - kept for consistency, though handled in usePredictions)
  const { data: alerts } = useQuery({
    queryKey: inventoryKeys.alerts(companyId),
    queryFn: async () => {
      await simulateLatency(600);
      return MOCK_ALERTS;
    }
  });

  // 3. Fetch Inventory List (Mocked)
  const { data: stockList } = useQuery({
    queryKey: inventoryKeys.list(companyId),
    queryFn: async () => {
      await simulateLatency(800);
      return MOCK_STOCK;
    }
  });

  // --- Adapters ---
  
  const formattedMetrics = {
    totalValorization: summary 
      ? n(Number(summary.totalValue || 0))
      : n(0),
    rotationRate: '1.2x'
  };

  return {
    movements: MOCK_MOVEMENTS, 
    predictions: alerts || [], // Exposed here but mainly used in usePredictions
    metrics: formattedMetrics
  };
};
