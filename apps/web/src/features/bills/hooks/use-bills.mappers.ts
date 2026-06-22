import { FALLBACK_APPROVER } from "./use-bills.constants";
import type {
	Bill,
	BillApprovalState,
	BillStatus,
	BillWorkflowEvent,
} from "./use-bills.types";

type BillApprover = NonNullable<Bill["approvers"]>[number];

const APPROVER_COLORS = [
	"bg-[var(--premium-action-blue)] text-[var(--premium-action-cyan)]",
	"bg-[var(--premium-action-blue)] text-[var(--premium-action-cyan)]",
	"bg-[var(--premium-success)] text-[var(--premium-success)]",
] as const;

interface ApiWorkflowEventLike {
	changedAt?: string;
	fromStatus?: string;
	toStatus?: string;
	actorId?: string;
	actorName?: string;
	reason?: string;
}

interface ApiAmountLike {
	amount?: string;
}

interface ApiBillLike {
	id: string;
	vendorId: string;
	status: string;
	dueDate: string;
	billNumber: string;
	totalAmount?: ApiAmountLike;
	currency: "PEN" | "USD" | "EUR";
	updatedAt: string;
	workflowEvents?: ApiWorkflowEventLike[];
}

function normalizeStatus(status: string): string {
	return status.toUpperCase();
}

function isWorkflowStatus(value: string): value is BillWorkflowEvent["to"] {
	return (
		value === "DRAFT" ||
		value === "SENT" ||
		value === "PAID" ||
		value === "OVERDUE" ||
		value === "CANCELLED"
	);
}

function toWorkflowStatus(
	value: string,
	fallback: BillWorkflowEvent["to"],
): BillWorkflowEvent["to"] {
	return isWorkflowStatus(value) ? value : fallback;
}

export function extractInitials(name: string): string {
	const compact = name.trim();
	if (!compact) return "??";

	return compact
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase() ?? "")
		.join("");
}

export function mapApiStatusToUiStatus(
	status: string,
	dueDate: string,
): BillStatus {
	const normalized = normalizeStatus(status);
	if (normalized === "PAID") return "paid";
	if (normalized === "DRAFT") return "review";
	if (normalized === "OVERDUE") return "payment";

	if (normalized === "SENT") {
		const dueAt = new Date(dueDate).getTime();
		const windowLimit = Date.now() + 3 * 24 * 60 * 60 * 1000;
		if (Number.isFinite(dueAt) && dueAt <= windowLimit) return "payment";
		return "approval";
	}

	return "approval";
}

export function mapApiStatusToApprovalState(status: string): BillApprovalState {
	const normalized = normalizeStatus(status);
	if (normalized === "SENT") return "PENDING";
	if (normalized === "OVERDUE" || normalized === "PAID") return "APPROVED";
	return "NOT_STARTED";
}

export function mapApiWorkflowEvents(
	events: ApiWorkflowEventLike[] | undefined,
): BillWorkflowEvent[] {
	if (!events || events.length === 0) return [];

	return events.map((event) => {
		const from = toWorkflowStatus(
			normalizeStatus(event.fromStatus ?? "DRAFT"),
			"DRAFT",
		);
		const to = toWorkflowStatus(normalizeStatus(event.toStatus ?? from), from);

		return {
			at: event.changedAt ?? new Date().toISOString(),
			from,
			to,
			actorId: event.actorId,
			actorName: event.actorName,
			reason: event.reason,
			approvalState: mapApiStatusToApprovalState(to),
		};
	});
}

export function buildApprovers(
	workflowEvents: BillWorkflowEvent[] | undefined,
	status: BillStatus,
): BillApprover[] {
	const actorNames = (workflowEvents ?? [])
		.map((event) => event.actorName?.trim())
		.filter((name): name is string => Boolean(name));

	const uniqueActorNames = Array.from(new Set(actorNames)).slice(-3);
	if (uniqueActorNames.length === 0) {
		return status === "review" ? [] : [...(FALLBACK_APPROVER ?? [])];
	}

	return uniqueActorNames.map((actorName, index) => ({
		initials: extractInitials(actorName),
		color: APPROVER_COLORS[index % APPROVER_COLORS.length],
		name: actorName,
	}));
}

export function mapApiBillToBill(
	apiBill: ApiBillLike,
	vendorName: string,
): Bill {
	const status = mapApiStatusToUiStatus(apiBill.status, apiBill.dueDate);
	const workflowEvents = mapApiWorkflowEvents(apiBill.workflowEvents);

	return {
		id: apiBill.id,
		vendor: {
			name: vendorName,
			initials: extractInitials(vendorName),
		},
		amount: Number.parseFloat(apiBill.totalAmount?.amount ?? "0"),
		invoiceNumber: apiBill.billNumber,
		dueDate: apiBill.dueDate,
		status,
		currency: apiBill.currency === "EUR" ? "USD" : apiBill.currency,
		paidDate: status === "paid" ? apiBill.updatedAt : undefined,
		approvalState: mapApiStatusToApprovalState(apiBill.status),
		workflowEvents,
		lastEvent:
			workflowEvents.length > 0
				? workflowEvents[workflowEvents.length - 1]
				: undefined,
		approvers: buildApprovers(workflowEvents, status),
	};
}
