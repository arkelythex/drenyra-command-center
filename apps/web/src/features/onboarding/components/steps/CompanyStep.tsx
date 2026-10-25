"use client";

import { Building2, Loader2, MapPin, Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
	CompanySetupDraft,
	RucLookupResult,
} from "../../types/onboarding.types";

interface CompanyStepProps {
	data: CompanySetupDraft;
	onUpdate: (data: CompanySetupDraft) => void;
	onSubmit: () => void;
	fetchRuc: (ruc: string) => Promise<RucLookupResult | null>;
	isSubmitting: boolean;
	error: string | null;
}

export function CompanyStep({
	data,
	onUpdate,
	onSubmit,
	fetchRuc,
	isSubmitting,
	error,
}: CompanyStepProps): JSX.Element {
	const [loading, setLoading] = useState(false);

	const lookUp = async (ruc: string): Promise<void> => {
		if (ruc.length !== 11) return;
		setLoading(true);
		const found = await fetchRuc(ruc);
		setLoading(false);
		if (!found) return;
		// Fill only what SUNAT returned; never wipe what the user typed.
		onUpdate({
			...(found.legalName ? { legalName: found.legalName } : {}),
			...(found.address ? { address: found.address } : {}),
		});
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		onSubmit();
	};

	const canSubmit =
		data.ruc?.length === 11 && Boolean(data.legalName?.trim()) && !loading;

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500"
		>
			<div className="space-y-2">
				<h3 className="text-lg font-black uppercase tracking-tight">
					Tu empresa
				</h3>
				<p className="text-sm text-muted-foreground">
					Ingresa el RUC de la empresa que vas a gestionar. Quedarás como su
					administrador.
				</p>
			</div>

			<div className="space-y-4">
				<div className="space-y-2">
					<label
						htmlFor="onboarding-ruc"
						className="text-2xs font-black uppercase tracking-widest text-muted-foreground"
					>
						RUC
					</label>
					<div className="relative group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
						<Input
							id="onboarding-ruc"
							value={data.ruc || ""}
							onChange={(e) =>
								onUpdate({ ruc: e.target.value.replace(/\D/g, "") })
							}
							onBlur={(e) => void lookUp(e.target.value)}
							placeholder="20XXXXXXXXX"
							className="pl-10 font-mono"
							inputMode="numeric"
							maxLength={11}
						/>
						{loading && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
						)}
					</div>
				</div>

				<div className="space-y-2">
					<label
						htmlFor="onboarding-legal-name"
						className="text-2xs font-black uppercase tracking-widest text-muted-foreground"
					>
						Razón social
					</label>
					<div className="relative">
						<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							id="onboarding-legal-name"
							value={data.legalName || ""}
							onChange={(e) => onUpdate({ legalName: e.target.value })}
							placeholder="Como figura en SUNAT"
							className="pl-10"
							readOnly={loading}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<label
						htmlFor="onboarding-address"
						className="text-2xs font-black uppercase tracking-widest text-muted-foreground"
					>
						Dirección fiscal (opcional)
					</label>
					<div className="relative">
						<MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							id="onboarding-address"
							value={data.address || ""}
							onChange={(e) => onUpdate({ address: e.target.value })}
							placeholder="Dirección fiscal"
							className="pl-10"
						/>
					</div>
				</div>
			</div>

			{error && (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			)}

			<Button
				type="submit"
				disabled={!canSubmit || isSubmitting}
				className="w-full font-black uppercase tracking-widest"
			>
				{isSubmitting ? "Registrando…" : "Registrar empresa"}
			</Button>
		</form>
	);
}
