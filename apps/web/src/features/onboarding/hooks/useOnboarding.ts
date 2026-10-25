"use client";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { authSessionKeys } from "@/features/auth/lib/auth-session.query";
import { readAuthSessionSnapshot } from "@/features/auth/lib/auth-session-snapshot";
import { syncActiveCompanyContextFromUser } from "@/lib/company-context";
import { getAppQueryClient } from "@/lib/query-client";
import {
	CompanyOnboardingError,
	lookupRuc,
	registerCompany,
} from "../services/company-onboarding";
import type {
	CompanySetupDraft,
	RucLookupResult,
} from "../types/onboarding.types";

/** Where a newly registered company lands. */
export const ONBOARDING_HOME = "/cierre-mensual";

interface UseOnboardingResult {
	formData: CompanySetupDraft;
	isSubmitting: boolean;
	error: string | null;
	updateData: (data: CompanySetupDraft) => void;
	submit: () => Promise<void>;
	fetchRuc: (ruc: string) => Promise<RucLookupResult | null>;
}

export function useOnboarding(): UseOnboardingResult {
	const { user, setSession } = useAuthStore();
	const navigate = useNavigate();
	// Start from the RUC typed at signup, when there is one.
	const [formData, setFormData] = useState<CompanySetupDraft>(() => {
		const ruc = user?.ruc ?? "";
		return /^\d{11}$/.test(ruc) ? { ruc } : {};
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateData = (data: CompanySetupDraft): void => {
		setError(null);
		setFormData((prev) => ({ ...prev, ...data }));
	};

	/** Reloads the session so it carries the new company as the active one. */
	const refreshSession = async (): Promise<void> => {
		const snapshot = await readAuthSessionSnapshot();
		if (!snapshot) return;
		setSession(snapshot);
		syncActiveCompanyContextFromUser(snapshot.user);
		getAppQueryClient()?.setQueryData(authSessionKeys.all, snapshot);
	};

	const submit = async (): Promise<void> => {
		setIsSubmitting(true);
		setError(null);
		try {
			const company = await registerCompany({
				ruc: formData.ruc ?? "",
				businessName: formData.legalName ?? "",
				address: formData.address || undefined,
			});
			await refreshSession();
			toast.success("Empresa registrada", {
				description: `${company.companyName} ya está lista para trabajar.`,
			});
			await navigate({ to: ONBOARDING_HOME });
		} catch (caught: unknown) {
			setError(
				caught instanceof CompanyOnboardingError
					? caught.message
					: "No se pudo registrar la empresa. Inténtalo de nuevo.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const fetchRuc = async (ruc: string): Promise<RucLookupResult | null> => {
		if (!/^\d{11}$/.test(ruc)) return null;
		return lookupRuc(ruc);
	};

	return { formData, isSubmitting, error, updateData, submit, fetchRuc };
}
