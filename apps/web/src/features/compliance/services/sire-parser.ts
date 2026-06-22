import { SireRecord } from '../types/sire.types';
import { simulateLatency } from '@/lib/simulated-latency';

export const parseSireFile = async (file: File): Promise<SireRecord[]> => {
  // En producción, esto leería el File real con FileReader
  // Simulamos un delay y retornamos datos mock de "Propuesta SUNAT"
  
  await simulateLatency(1500);

  return [
    {
      periodo: '202501',
      caratula: 'RVIE',
      rucEmisor: '20100000001',
      razonSocial: 'PROVEEDOR A S.A.C.',
      tipoComprobante: '01',
      serie: 'F001',
      numero: '00001234',
      fechaEmision: '2025-01-10',
      moneda: 'PEN',
      baseImponible: 1000.00,
      igv: 180.00,
      total: 1180.00,
      estado: 'ACTIVO',
      origen: 'SUNAT'
    },
    {
      periodo: '202501',
      caratula: 'RVIE',
      rucEmisor: '20200000002',
      razonSocial: 'PROVEEDOR B E.I.R.L.',
      tipoComprobante: '01',
      serie: 'F001',
      numero: '00000567',
      fechaEmision: '2025-01-15',
      moneda: 'USD',
      baseImponible: 500.00,
      igv: 90.00,
      total: 590.00,
      estado: 'ACTIVO',
      origen: 'SUNAT'
    }
  ];
};
