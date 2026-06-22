import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

const companySettingsKey = (companyId: string | null) =>
	["company-settings", companyId ?? "no-company"] as const;

interface CompanySettings {
	language: string;
	timezone: string;
	currency: string;
	companyName: string;
	companyRuc: string;
	autoClosePeriod: boolean;
	showAmountsInWords: boolean;
}

const defaultSettings: CompanySettings = {
	language: "es",
	timezone: "America/Lima",
	currency: "PEN",
	companyName: "",
	companyRuc: "",
	autoClosePeriod: true,
	showAmountsInWords: false,
};

async function fetchCompanySettings(
	companyId: string | null,
): Promise<CompanySettings> {
	if (!companyId) {
		return defaultSettings;
	}

	const response = await fetch(`/api/company/${companyId}/settings`, {
		credentials: "include",
	});

	if (!response.ok) {
		if (response.status === 404) return defaultSettings;
		throw new Error("Failed to fetch settings");
	}

	return response.json() as Promise<CompanySettings>;
}

async function updateCompanySettings(
	companyId: string | null,
	settings: Partial<CompanySettings>,
) {
	if (!companyId) {
		throw new Error("No company context");
	}

	const response = await fetch(`/api/company/${companyId}/settings`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(settings),
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error("Failed to update settings");
	}

	return response.json();
}

export function useSettingsGeneral() {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();
	const queryClient = useQueryClient();
	const settingsKey = companySettingsKey(companyId);

	const query = useQuery({
		queryKey: settingsKey,
		queryFn: () => fetchCompanySettings(companyId),
		staleTime: 1000 * 60 * 5,
	});

	const mutation = useMutation({
		mutationFn: (settings: Partial<CompanySettings>) =>
			updateCompanySettings(companyId, settings),
		onMutate: async (newSettings) => {
			await queryClient.cancelQueries({ queryKey: settingsKey });
			const previousSettings =
				queryClient.getQueryData<CompanySettings>(settingsKey);

			queryClient.setQueryData<CompanySettings>(settingsKey, (old) => ({
				...(old ?? defaultSettings),
				...newSettings,
			}));

			return { previousSettings };
		},
		onError: (_err, _newSettings, context) => {
			queryClient.setQueryData(settingsKey, context?.previousSettings);
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: settingsKey });
		},
	});

	return {
		language: query.data?.language ?? defaultSettings.language,
		timezone: query.data?.timezone ?? defaultSettings.timezone,
		currency: query.data?.currency ?? defaultSettings.currency,
		companyName: query.data?.companyName ?? defaultSettings.companyName,
		companyRuc: query.data?.companyRuc ?? defaultSettings.companyRuc,
		autoClosePeriod:
			query.data?.autoClosePeriod ?? defaultSettings.autoClosePeriod,
		showAmountsInWords:
			query.data?.showAmountsInWords ?? defaultSettings.showAmountsInWords,
		isLoading: query.isPending,
		isSaving: mutation.isPending,
		error: query.error || mutation.error,
		setLanguage: (value: string) => mutation.mutate({ language: value }),
		setTimezone: (value: string) => mutation.mutate({ timezone: value }),
		setCurrency: (value: string) => mutation.mutate({ currency: value }),
		setCompanyName: (value: string) => mutation.mutate({ companyName: value }),
		setCompanyRuc: (value: string) => mutation.mutate({ companyRuc: value }),
		setAutoClosePeriod: (value: boolean) =>
			mutation.mutate({ autoClosePeriod: value }),
		setShowAmountsInWords: (value: boolean) =>
			mutation.mutate({ showAmountsInWords: value }),
	};
}
