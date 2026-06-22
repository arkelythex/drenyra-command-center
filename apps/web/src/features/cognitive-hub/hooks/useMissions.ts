import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BackgroundMission } from '@arkelythex/shared/agents';

interface MissionStore {
  missions: BackgroundMission[];
  addMission: (mission: BackgroundMission) => void;
  updateMission: (id: string, updates: Partial<BackgroundMission>) => void;
  removeMission: (id: string) => void;
  clearCompleted: () => void;
}

/**
 * useMissionStore: Motor de persistencia de misiones (Manus Style).
 * Permite que las tareas sigan su curso asíncrono.
 */
export const useMissionStore = create<MissionStore>()(
  persist(
    (set) => ({
      missions: [],
      addMission: (mission) => set((state) => ({ 
        missions: [mission, ...state.missions].slice(0, 10) 
      })),
      updateMission: (id, updates) => set((state) => ({
        missions: state.missions.map((m) => m.id === id ? { ...m, ...updates } : m)
      })),
      removeMission: (id) => set((state) => ({
        missions: state.missions.filter((m) => m.id !== id)
      })),
      clearCompleted: () => set((state) => ({
        missions: state.missions.filter((m) => m.status !== 'completed')
      })),
    }),
    { name: 'arkelythex-mission-engine' }
  )
);
