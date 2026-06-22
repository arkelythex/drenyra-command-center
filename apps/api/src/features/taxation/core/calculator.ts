import { applyPercepcion } from "../application/commands/apply-percepcion.command";
import { applyRetention } from "../application/commands/apply-retention.command";
import { cancelPercepcion } from "../application/commands/cancel-percepcion.command";
import { cancelRetention } from "../application/commands/cancel-retention.command";
import { declarePercepcion } from "../application/commands/declare-percepcion.command";
import { declareRetention } from "../application/commands/declare-retention.command";
import { markPercepcionPaid } from "../application/commands/mark-percepcion-paid.command";
import { markRetentionPaid } from "../application/commands/mark-retention-paid.command";
import { getPendingPercepciones } from "../application/queries/get-pending-percepciones.query";
import { getPendingRetentions } from "../application/queries/get-pending-retentions.query";
import { getPercepcionSummary } from "../application/queries/get-percepcion-summary.query";
import { getRetentionSummary } from "../application/queries/get-retention-summary.query";
import { TaxationService } from "../application/services/taxation.service";

export const taxationService = new TaxationService();
export {
	applyPercepcion,
	applyRetention,
	cancelPercepcion,
	cancelRetention,
	declarePercepcion,
	declareRetention,
	getPendingPercepciones,
	getPendingRetentions,
	getPercepcionSummary,
	getRetentionSummary,
	markPercepcionPaid,
	markRetentionPaid,
};
