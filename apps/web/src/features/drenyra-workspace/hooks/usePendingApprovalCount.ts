import { useEffect, useState } from "react";
import { drenyraApi } from "../api/drenyra.api";

export function usePendingApprovalCount(): number {
	const [count, setCount] = useState(0);

	useEffect(() => {
		let cancelled = false;
		const fetchCount = async () => {
			try {
				const approvals = await drenyraApi.getApprovals();
				if (!cancelled) {
					setCount(approvals.filter((a) => a.state === "proposed").length);
				}
			} catch {
				if (!cancelled) setCount(0);
			}
		};

		fetchCount();
		const interval = setInterval(fetchCount, 30000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);

	return count;
}
