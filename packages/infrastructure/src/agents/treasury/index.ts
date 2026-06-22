/**
 * Treasury Agent Barrel
 */

export type {
	NotificationPayload,
	TreasuryAlert,
	TreasuryAlertConfig,
	TreasuryMetrics,
} from "./types";

export {
	analyzeTreasuryHealth,
	formatAlertNotification,
	generateTreasuryRecommendations,
} from "./agent";
