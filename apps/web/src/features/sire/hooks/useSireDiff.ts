import { useMutation } from "@tanstack/react-query";
import { extractOkData } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type { SireDiffApiPayload } from "../mapSireDiffResponseToArtifact";

export function useSireDiffMutation() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";

	return useMutation({
		mutationFn: async (input: {
			period: string;
			sireFile?: File;
			cpeFile?: File;
		}) => {
			const params = new URLSearchParams({
				companyId,
				period: input.period,
			});
			const formData = new FormData();
			if (input.sireFile) formData.append("sireFile", input.sireFile);
			if (input.cpeFile) formData.append("cpeFile", input.cpeFile);

			const response = await fetch(`/api/sire/diff?${params.toString()}`, {
				method: "POST",
				body: formData,
				credentials: "include",
				headers: { "X-Company-Id": companyId },
			});

			return extractOkData(
				await response.json(),
				"Failed to build SIRE diff",
			) as SireDiffApiPayload & {
				approvable: boolean;
				submitBlocked: boolean;
			};
		},
	});
}
