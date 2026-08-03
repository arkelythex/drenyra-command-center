/**
 * wireMonthlyCloseHandler — production wiring for the real monthly-close
 * pipeline (M2, already merged on main but dormant).
 *
 * The MonthlyCloseIntentHandler existed but was NEVER registered:
 * registerIntentHandler had zero call sites, so monthly-close missions ran
 * the default no-op handler and the 10-step orchestrator stayed dead code.
 * This wiring constructs the orchestrator with its real dependencies and
 * registers the handler.
 *
 * Fail closed: the pipeline stays dormant unless
 * MONTHLY_CLOSE_PIPELINE_ENABLED=true — enabling the real close is a
 * deliberate, explicit deployment decision, never an implicit default.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt
 * cents; no float is ever used for money. The pipeline's posting services
 * handle money as integer cents; this module only wires dependencies.
 */

import { FiscalNightlyRunUseCase } from "@drenyra/application/use-cases/fiscal-agent/fiscal-nightly-run.use-case";
import {
	CompensatingEntryGenerator,
	JournalEntryPostingService,
	MonthlyCloseOrchestrator,
	PeriodCloseService,
	TransactionalApplyUseCase,
} from "@drenyra/application/use-cases/monthly-close";
import type { MissionEventStore } from "../sse/mission-event-store";
import { registerIntentHandler } from "./intent-handlers.registry";
import { MissionEventStoreEmitter } from "./monthly-close-emitter";
import { MonthlyCloseIntentHandler } from "./monthly-close-intent.handler";

/** Env flag that turns the real pipeline on (fail closed: default off). */
export const MONTHLY_CLOSE_PIPELINE_FLAG = "MONTHLY_CLOSE_PIPELINE_ENABLED";

/**
 * Wire the monthly-close intent handler into the mission registry.
 *
 * @returns true when the handler was registered, false when the flag is off
 *          (pipeline stays dormant).
 */
export function wireMonthlyCloseHandler(
	db: unknown,
	eventStore: MissionEventStore,
): boolean {
	if (process.env[MONTHLY_CLOSE_PIPELINE_FLAG] !== "true") {
		return false;
	}

	const emitter = new MissionEventStoreEmitter(eventStore);
	const journalEntryPosting = new JournalEntryPostingService();
	const periodClose = new PeriodCloseService();
	const orchestrator = new MonthlyCloseOrchestrator(
		db,
		new FiscalNightlyRunUseCase(),
		journalEntryPosting,
		periodClose,
		new TransactionalApplyUseCase(db, journalEntryPosting, periodClose),
		new CompensatingEntryGenerator(db),
		emitter,
	);

	registerIntentHandler(
		"monthly-close",
		new MonthlyCloseIntentHandler(orchestrator, db),
	);
	return true;
}
