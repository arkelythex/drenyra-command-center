import { useCallback, useEffect, useRef, useState } from "react";
import { getGovernanceAuditHeaders } from "@/lib/api";
import { runtimeConfig } from "@/lib/runtime-config";
import { type DrenyraApproval, drenyraApi } from "../api/drenyra.api";

interface UseDrenyraApprovalsReturn {
	approvals: DrenyraApproval[];
	isLoading: boolean;
	refresh: () => Promise<void>;
	approve: (id: string, userId: string, role: string) => Promise<void>;
	reject: (id: string, userId: string, rationale?: string) => Promise<void>;
}

export function useDrenyraApprovals(): UseDrenyraApprovalsReturn {
	const [approvals, setApprovals] = useState<DrenyraApproval[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const refreshRef = useRef<(() => Promise<void>) | undefined>(undefined);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await drenyraApi.getApprovals();
			setApprovals(result);
		} catch {
			setApprovals([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		refreshRef.current = refresh;
	}, [refresh]);

	useEffect(() => {
		const companyId = getGovernanceAuditHeaders()["x-company-id"] || "";
		if (!companyId) {
			setIsLoading(false);
			return;
		}

		const baseUrl = runtimeConfig.apiUrl.replace(/\/+$/, "");
		const url = `${baseUrl}/api/drenyra/approvals/stream?companyId=${encodeURIComponent(companyId)}`;

		let es: EventSource | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout>;

		function connect() {
			es?.close();
			es = new EventSource(url);

			es.addEventListener("connected", () => {
				setIsLoading(false);
			});

			es.addEventListener("snapshot", (e: MessageEvent) => {
				try {
					const data = JSON.parse(e.data);
					setApprovals(Array.isArray(data) ? data : []);
				} catch {
					refreshRef.current?.();
				}
				setIsLoading(false);
			});

			es.addEventListener("approval.new", (e: MessageEvent) => {
				try {
					const approval = JSON.parse(e.data) as DrenyraApproval;
					setApprovals((prev) => [approval, ...prev]);
				} catch {
					/* ignore malformed event */
				}
			});

			es.addEventListener("approval.updated", (e: MessageEvent) => {
				try {
					const updated = JSON.parse(e.data) as DrenyraApproval;
					setApprovals((prev) =>
						prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
					);
				} catch {
					/* ignore malformed event */
				}
			});

			es.addEventListener("approval.resolved", (e: MessageEvent) => {
				try {
					const { id } = JSON.parse(e.data);
					setApprovals((prev) => prev.filter((a) => a.id !== id));
				} catch {
					/* ignore malformed event */
				}
			});

			es.addEventListener("heartbeat", () => {});

			es.onerror = () => {
				es?.close();
				es = null;
				reconnectTimer = setTimeout(connect, 3000);
			};
		}

		connect();

		const fallbackInterval = setInterval(() => {
			if (!es || es.readyState === EventSource.CLOSED) {
				refreshRef.current?.();
			}
		}, 30000);

		return () => {
			es?.close();
			clearTimeout(reconnectTimer);
			clearInterval(fallbackInterval);
		};
	}, []);

	const handleApprove = useCallback(
		async (id: string, userId: string, role: string) => {
			await drenyraApi.approve(id, userId, role);
			setApprovals((prev) => prev.filter((a) => a.id !== id));
		},
		[],
	);

	const handleReject = useCallback(
		async (id: string, userId: string, rationale?: string) => {
			await drenyraApi.reject(id, userId, rationale);
			setApprovals((prev) => prev.filter((a) => a.id !== id));
		},
		[],
	);

	return {
		approvals,
		isLoading,
		refresh,
		approve: handleApprove,
		reject: handleReject,
	};
}
