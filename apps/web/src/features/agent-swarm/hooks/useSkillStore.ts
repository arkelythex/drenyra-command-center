import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccountingSkill } from '../types/skills.types';

interface SkillStore {
  skills: AccountingSkill[];
  installSkill: (id: string) => void;
  uninstallSkill: (id: string) => void;
  getSkillsByCategory: (category: AccountingSkill['category']) => AccountingSkill[];
}

export const useSkillStore = create<SkillStore>()(
  persist(
    (set, get) => ({
      skills: [
        {
          id: 'skill-validador-sire',
          name: 'Validador SIRE',
          description: 'Auditoría automática de registros de compras y ventas vs SUNAT.',
          category: 'fiscal',
          version: '1.2.0',
          isInstalled: true,
          outputArtifact: 'table',
          inputSchema: { period: 'string' }
        },
        {
          id: 'skill-conciliar-bcp',
          name: 'Conciliador BCP',
          description: 'Match inteligente de estados de cuenta BCP con el Ledger.',
          category: 'finance',
          version: '2.0.4',
          isInstalled: false,
          outputArtifact: 'simulation',
          inputSchema: { bankStatement: 'file' }
        },
        {
          id: 'skill-generar-ple',
          name: 'Generador PLE',
          description: 'Construcción de libros electrónicos bajo normativa 2026.',
          category: 'fiscal',
          version: '0.9.0',
          isInstalled: false,
          outputArtifact: 'report',
          inputSchema: { bookType: 'string' }
        }
      ],
      installSkill: (id) => set((state) => ({
        skills: state.skills.map(s => s.id === id ? { ...s, isInstalled: true } : s)
      })),
      uninstallSkill: (id) => set((state) => ({
        skills: state.skills.map(s => s.id === id ? { ...s, isInstalled: false } : s)
      })),
      getSkillsByCategory: (category) => get().skills.filter(s => s.category === category)
    }),
    { name: 'arkelythex-skills-v1' }
  )
);
