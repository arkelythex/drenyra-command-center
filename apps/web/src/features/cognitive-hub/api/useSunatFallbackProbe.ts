import { useCallback, useState } from "react";
import type { CpeFallbackProbeData } from "@/features/compliance/api/compliance-client";
import { postSunatFallbackProbe } from "./sunat-fallback-probe.api";

export type SunatFallbackProbeResult = CpeFallbackProbeData;

export function useSunatFallbackProbe() {
	const [result, setResult] = useState<SunatFallbackProbeResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const runProbe = useCallback(async (mode: "normal" | "hitl") => {
		setIsLoading(true);
		setError(null);

		try {
			const data = await postSunatFallbackProbe({
				mode,
				companyRuc: "20100070970",
				cpeNumber: "F001-00001234",
				issueDate: new Date().toISOString().slice(0, 10),
				totalAmount: 1180,
			});
			setResult(data);
			return data;
		} catch (probeError) {
			const message =
				probeError instanceof Error
					? probeError.message
					: "Error desconocido al probar fallback";
			setError(message);
			throw probeError;
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		runProbe,
		result,
		isLoading,
		error,
	};
}
