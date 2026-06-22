/**
 * Generate SPOT PDF — Command Handler
 *
 * Generates a SUNAT SPOT detraction certificate reference number
 * and stores the PDF URL on the inter-company transaction record.
 *
 * Production note: replace stub URL with actual PDF generation
 * (RUC emisor/receptor, monto, fecha, número SPOT).
 */

import { SecureLogger } from '@arkelythex/shared/secure-logger';
import type { IInterCompanyTransactionRepository } from '../../domain/inter-company-transaction.repository';
import type { SpotPdfResult } from '../../domain/inter-company-transaction.entity';

const logger = SecureLogger.namespace('GenerateSpotPdfHandler');

/**
 * GenerateSpotPdfHandler class.
 *
 * @example
 * ```ts
 * const value = new GenerateSpotPdfHandler();
 * console.log(value);
 * ```
 */
export class GenerateSpotPdfHandler {
  constructor(private readonly repository: IInterCompanyTransactionRepository) {}

  async execute(interCompanyId: string): Promise<SpotPdfResult> {
    logger.info('Generating SPOT PDF', { interCompanyId });

    const tx = await this.repository.findById(interCompanyId);
    if (!tx) throw new Error('Inter-company transaction not found');

    const timestamp = Date.now().toString().slice(-8);
    const referenceNumber = `SPOT-${timestamp}`;
    const url = `/api/pdfs/spot-${interCompanyId}.pdf`;

    await this.repository.updateSpotPdf(interCompanyId, url, referenceNumber);

    logger.info('SPOT PDF generated', { referenceNumber });
    return { url, referenceNumber };
  }
}
