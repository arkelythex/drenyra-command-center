/**
 * Data Consistency Service — verifies XML data matches database records.
 * Extracted from ElectronicInvoicingService.verifyDataConsistency().
 */

import { SunatService } from "../../../../services/sunat.service";
import type {
	TransactionConsistencyRecord,
	ValidatedXmlInvoiceData,
} from "../../domain/cpe.types";
import { CpeRepository } from "../../infrastructure/cpe.repository";

export class DataConsistencyService {
	/**
	 * Verifies coherence between XML data and transaction records.
	 * Checks RUC match and amount tolerance (±0.01 for rounding).
	 */
	static async verify(
		transaction: TransactionConsistencyRecord,
		xmlData: ValidatedXmlInvoiceData,
	): Promise<void> {
		const partner = transaction.partnerId
			? await CpeRepository.findBusinessPartnerById(transaction.partnerId)
			: null;

		// Verify RUC
		if (xmlData.ruc !== partner?.taxId) {
			throw new Error(
				`Inconsistencia de RUC: XML=${xmlData.ruc}, BD=${partner?.taxId}`,
			);
		}

		// Verify amounts (with cent tolerance for rounding)
		const xmlAmount = xmlData.totalAmount;
		const dbAmount = parseFloat(transaction.totalAmount);

		if (Math.abs(xmlAmount - dbAmount) > 0.01) {
			throw new Error(
				`Inconsistencia de montos: XML=${xmlAmount}, BD=${dbAmount}`,
			);
		}

		// Validate RUC with Módulo 11 algorithm
		if (xmlData.ruc && !SunatService.isValidRucFormat(xmlData.ruc)) {
			throw new Error(`RUC inválido según algoritmo Módulo 11: ${xmlData.ruc}`);
		}
	}
}
