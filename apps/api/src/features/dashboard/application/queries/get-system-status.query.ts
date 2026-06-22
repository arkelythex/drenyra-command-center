import { OverviewService } from "../services/overview.service";

export async function getSystemStatus() {
	return OverviewService.getSystemStatus();
}
