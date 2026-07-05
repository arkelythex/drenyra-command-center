import { useCallback, useRef, useSyncExternalStore } from "react";

export function useLocalStorageThreads(companyId: string) {
	const snapshotCache = useRef<{
		key: string;
		data: Array<{ id: string; name: string; createdAt: number }>;
	} | null>(null);
	const getSnapshot = useCallback(() => {
		const key = companyId;
		if (snapshotCache.current?.key === key) {
			return snapshotCache.current.data;
		}
		let data: Array<{ id: string; name: string; createdAt: number }>;
		try {
			const raw = localStorage.getItem(`drenyra:threads:${companyId}`);
			data = raw ? Object.values(JSON.parse(raw)) : [];
		} catch {
			data = [];
		}
		snapshotCache.current = { key, data };
		return data;
	}, [companyId]);

	const threads = useSyncExternalStore((cb) => {
		window.addEventListener("storage", cb);
		return () => window.removeEventListener("storage", cb);
	}, getSnapshot);
	return threads as Array<{ id: string; name: string; createdAt: number }>;
}
