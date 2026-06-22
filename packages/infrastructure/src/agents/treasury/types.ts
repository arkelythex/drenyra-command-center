/**
 * Treasury Agent Types
 *
 * Types for treasury monitoring, alerts, and notifications.
 */

export interface TreasuryMetrics {
	organizationId: number;
	consolidatedBalance: number; // in cents
	burnRate: number; // monthly burn rate in cents
	runway: number; // months remaining
	pendingPayables: number; // upcoming payments in cents
	pendingReceivables: number; // expected income in cents
}

export interface TreasuryAlert {
	type:
		| "runway_critical"
		| "runway_warning"
		| "burn_rate_spike"
		| "large_expense"
		| "positive_trend";
	severity: "info" | "warning" | "critical";
	title: string;
	message: string;
	suggestedActions: string[];
	metrics: {
		currentValue: number;
		threshold?: number;
		previousValue?: number;
		changePercent?: number;
	};
	createdAt: Date;
}

export interface TreasuryAlertConfig {
	/** Runway below this (in months) triggers critical alert */
	runwayCriticalMonths: number;
	/** Runway below this (in months) triggers warning */
	runwayWarningMonths: number;
	/** Burn rate increase % that triggers alert */
	burnRateSpikePercent: number;
	/** Single expense above this (in cents) triggers review */
	largeExpenseThreshold: number;
}

export interface NotificationPayload {
	channel: "email" | "whatsapp" | "in_app";
	recipient: string;
	subject: string;
	body: string;
	priority: "low" | "normal" | "high" | "urgent";
}
