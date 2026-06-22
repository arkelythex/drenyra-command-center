import React from 'react';
import { FileCode, Download, ExternalLink } from 'lucide-react';
import type { HubArtifact } from '@arkelythex/shared/artifacts';

interface UBLViewerArtifactProps {
  artifact: HubArtifact;
}

export const UBLViewerArtifact: React.FC<UBLViewerArtifactProps> = ({ artifact }) => {
  // En el futuro, el XML parseado vendría de artifact.data o artifact.metadata
  const placeholderXml = `<?xml version="1.0" encoding="ISO-8859-1" standalone="no"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>F001-00001234</cbc:ID>
  <cbc:IssueDate>2026-04-18</cbc:IssueDate>
  <cbc:IssueTime>10:30:00</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="0101" name="Tipo de Operacion">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">PEN</cbc:DocumentCurrencyCode>
  <!-- ... resto del documento UBL ... -->
</Invoice>`;

  return (
    <div className="flex h-full flex-col bg-[var(--surface-1)] text-[var(--text-primary)]">
      <div className="flex flex-col border-b border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <FileCode size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Factura Electrónica F001-00001234</h3>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Emisión: 18 Abr 2026 · Moneda: PEN
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
              <Download size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5">
            <span className="block text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Emisor</span>
            <span className="mt-1 block truncate text-xs font-semibold">20123456789</span>
            <span className="block truncate text-2xs text-[var(--text-secondary)]">EMPRESA EJEMPLO S.A.C.</span>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5">
            <span className="block text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Adquirente</span>
            <span className="mt-1 block truncate text-xs font-semibold">10987654321</span>
            <span className="block truncate text-2xs text-[var(--text-secondary)]">CLIENTE PRUEBA S.R.L.</span>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5">
            <span className="block text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Importe Total</span>
            <span className="mt-1 block text-xs font-bold text-[var(--color-success)]">S/ 1,500.00</span>
            <span className="block text-2xs text-[var(--text-secondary)]">Inc. IGV (18%)</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[var(--color-surface-1)] p-4 text-xs">
        <pre className="font-mono text-gray-300">
          <code>{placeholderXml}</code>
        </pre>
      </div>
    </div>
  );
};
