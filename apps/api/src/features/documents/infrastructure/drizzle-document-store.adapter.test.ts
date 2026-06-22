import { describe, expect, it } from 'vitest';
import { DrizzleDocumentStoreAdapter } from './drizzle-document-store.adapter';
import type { DocumentRow } from '../ports/document-store.port';

function buildDocumentRow(overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    id: 'doc-1',
    organizationId: 1,
    companyId: 'cmp-1',
    clientId: null,
    clientName: 'Cliente Demo',
    fileName: 'demo.pdf',
    fileUrl: 'https://example.com/demo.pdf',
    fileType: 'PDF',
    fileSize: 1024,
    status: 'revision_humana',
    confidenceLevel: null,
    extractedData: null,
    validatedBy: 'legacy-user-1',
    validatedAt: new Date('2026-03-20T10:00:00.000Z'),
    validationNotes: 'Observacion',
    accountingEntryId: null,
    uploadedAt: new Date('2026-03-20T09:00:00.000Z'),
    processedAt: null,
    createdAt: new Date('2026-03-20T09:00:00.000Z'),
    updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('DrizzleDocumentStoreAdapter.toResponseDTO', () => {
  const adapter = new DrizzleDocumentStoreAdapter();

  it('does not expose rejection metadata for validated documents', () => {
    const dto = adapter.toResponseDTO(
      buildDocumentRow({
        status: 'listo_para_sire',
      }),
    );

    expect(dto.validatedBy).toBe('legacy-user-1');
    expect(dto.rejectionReason).toBeNull();
    expect(dto.rejectedBy).toBeNull();
    expect(dto.rejectedAt).toBeUndefined();
  });

  it('maps rejection metadata only for rejected documents', () => {
    const dto = adapter.toResponseDTO(
      buildDocumentRow({
        status: 'rechazado_por_sire',
        validationNotes: 'Documento duplicado',
      }),
    );

    expect(dto.rejectionReason).toBe('Documento duplicado');
    expect(dto.rejectedBy).toBe('legacy-user-1');
    expect(dto.rejectedAt).toBe('2026-03-20T10:00:00.000Z');
  });
});
