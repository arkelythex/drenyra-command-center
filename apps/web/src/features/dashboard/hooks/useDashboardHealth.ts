import { useDashboardData } from "./useDashboardData";

export function useDashboardHealth() {
	const { health, isLoading } = useDashboardData();

	return {
		health,
		isLoading,
	};
}
