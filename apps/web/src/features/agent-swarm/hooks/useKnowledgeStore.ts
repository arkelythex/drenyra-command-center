import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'manual';
  uploadedAt: string;
  status: 'indexed' | 'processing';
  rulesCount: number;
}

interface KnowledgeStore {
  documents: KnowledgeDocument[];
  addDocument: (doc: Omit<KnowledgeDocument, 'id' | 'status' | 'rulesCount'>) => void;
  removeDocument: (id: string) => void;
}

/**
 * useKnowledgeStore: Motor de RAG corporativo para el enjambre.
 * Permite que los agentes hereden reglas de negocio del usuario.
 */
export const useKnowledgeStore = create<KnowledgeStore>()(
  persist(
    (set) => ({
      documents: [
        {
          id: '1',
          name: 'Manual de Políticas de Gasto 2026',
          type: 'pdf',
          uploadedAt: new Date().toISOString(),
          status: 'indexed',
          rulesCount: 42
        }
      ],
      addDocument: (doc) => set((state) => ({
        documents: [{
          ...doc,
          id: crypto.randomUUID(),
          status: 'processing',
          rulesCount: 0,
          uploadedAt: new Date().toISOString()
        }, ...state.documents]
      })),
      removeDocument: (id) => set((state) => ({
        documents: state.documents.filter(d => d.id !== id)
      })),
    }),
    { name: 'arkelythex-knowledge-base' }
  )
);
