import type { LucideIcon } from "lucide-react";
import {
	AlertTriangle,
	ArrowUpRight,
	ShieldCheck,
	TrendingUp,
} from "lucide-react";
import type {
	CountryAssistantQuickAction,
	CountryCode,
} from "@/lib/latam-country-packs";
import { getCountryPack } from "@/lib/latam-country-packs";
import type { AssistantAccountingJob } from "../../hooks/useAccountingJobsCatalog";

export type QuickCommandEmphasis = "high" | "medium";

export interface QuickCommand {
	label: string;
	icon: LucideIcon;
	command: string;
	emphasis: QuickCommandEmphasis;
	jobId?: string;
	surfaceId?: string;
	approvalRequired?: boolean;
}

const COMMAND_ICONS: LucideIcon[] = [
	ArrowUpRight,
	ShieldCheck,
	AlertTriangle,
	TrendingUp,
];

export function buildQuickCommands(
	actions: ReadonlyArray<CountryAssistantQuickAction>,
): ReadonlyArray<QuickCommand> {
	return actions.map((action, index) => ({
		label: action.label,
		command: action.command,
		emphasis: action.emphasis,
		icon: COMMAND_ICONS[index % COMMAND_ICONS.length],
	}));
}

export function buildQuickCommandsFromJobs(
	jobs: ReadonlyArray<AssistantAccountingJob>,
): ReadonlyArray<QuickCommand> {
	return jobs
		.slice()
		.sort(
			(left, right) =>
				Number(Boolean(right.surfaceId)) - Number(Boolean(left.surfaceId)),
		)
		.slice(0, 4)
		.map((job, index) => ({
			label: job.title,
			command: job.prompt,
			emphasis: job.approvalRequired ? "high" : "medium",
			icon: COMMAND_ICONS[index % COMMAND_ICONS.length],
			jobId: job.id,
			surfaceId: job.surfaceId,
			approvalRequired: job.approvalRequired,
		}));
}

export function getQuickCommands(
	countryCode?: CountryCode | string | null,
): ReadonlyArray<QuickCommand> {
	const pack = getCountryPack(countryCode);

	return buildQuickCommands(pack.assistantQuickActions);
}

/** Default hints for predictive row / palette (Peru pack). */
export const QUICK_COMMANDS: ReadonlyArray<QuickCommand> =
	getQuickCommands("PE");
