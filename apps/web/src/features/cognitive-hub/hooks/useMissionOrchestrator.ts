import React from 'react';
import { useMissionStore } from './useMissions';
import { useSoundUI } from '@/hooks/useSoundUI';
import { useHubSwarm } from '../api/useHubSwarm';

export const useMissionOrchestrator = (autonomyLevel: number) => {
  const addMission = useMissionStore((s) => s.addMission);
  const updateMission = useMissionStore((s) => s.updateMission);
  const { playSound } = useSoundUI();
  const { startStream } = useHubSwarm();

  const handleStartMission = React.useCallback(() => {
    playSound('ping');

    startStream({
      documentId: `DOC-HUB-${Date.now()}`,
      filename: 'factura-hub.pdf',
      ruc: '20100070970',
      serie: 'F001',
      numero: String(Math.floor(Math.random() * 9000) + 1000),
      fecha: new Date().toISOString().slice(0, 10),
      moneda: 'PEN',
      subtotal: '100',
      igv: '18',
      total: '118',
    });

    const missionMonth = new Date()
      .toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })
      .replace('.', '')
      .toUpperCase();
    const missionRucSuffix = '20100070970'.slice(-4);

    const missionId = crypto.randomUUID();
    addMission({
      id: missionId,
      title: `Auditoría SIRE ${missionMonth} · RUC ***${missionRucSuffix}`,
      status: 'active',
      progress: 0,
      agentId: 'validador',
      startedAt: new Date().toISOString(),
    });

    let progress = 0;
    const interval = setInterval(() => {
      if (autonomyLevel === 1) return;

      progress += Math.floor(Math.random() * 5) + 1;
      if (progress >= 100) {
        updateMission(missionId, { progress: 100, status: 'completed' });
        playSound('success');
        clearInterval(interval);
        return;
      }

      updateMission(missionId, { progress });
    }, 3000);
  }, [addMission, autonomyLevel, playSound, startStream, updateMission]);

  return { handleStartMission };
};
