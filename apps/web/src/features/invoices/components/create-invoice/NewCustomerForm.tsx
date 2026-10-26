import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customersApi } from "@/features/customers/api/customers.api";
import { lookupRuc } from "@/features/onboarding/services/company-onboarding";
import type { InvoiceCustomerOption } from "./types";

const RUC_PATTERN = /^\d{11}$/;

interface NewCustomerFormProps {
	companyId: string;
	/** What the person searched for: a RUC or a name. */
	initialQuery: string;
	onCreated: (customer: InvoiceCustomerOption) => void;
	onCancel: () => void;
}

/**
 * Registers a customer that the search did not find, right inside the
 * invoice form. A RUC is looked up in SUNAT to fill the business name.
 */
export function NewCustomerForm({
	companyId,
	initialQuery,
	onCreated,
	onCancel,
}: NewCustomerFormProps) {
	const searchedRuc = RUC_PATTERN.test(initialQuery.trim());
	const [taxId, setTaxId] = useState(searchedRuc ? initialQuery.trim() : "");
	const [legalName, setLegalName] = useState(
		searchedRuc ? "" : initialQuery.trim(),
	);
	const [lookingUp, setLookingUp] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fillFromSunat = async (ruc: string): Promise<void> => {
		if (!RUC_PATTERN.test(ruc)) return;
		setLookingUp(true);
		const found = await lookupRuc(ruc);
		setLookingUp(false);
		const name = found?.legalName;
		if (name) setLegalName((current) => current || name);
	};

	// Look up only the RUC the person searched for, once.
	useEffect(() => {
		if (searchedRuc) void fillFromSunat(taxId);
	}, []);

	const save = async (): Promise<void> => {
		setSaving(true);
		setError(null);
		try {
			const created = await customersApi.create({
				companyId,
				taxId,
				legalName: legalName.trim(),
			});
			onCreated({
				id: created.id,
				taxId: created.taxId,
				legalName: created.legalName,
			});
		} catch (caught: unknown) {
			setError(
				caught instanceof Error
					? caught.message
					: "No se pudo registrar el cliente",
			);
		} finally {
			setSaving(false);
		}
	};

	const canSave =
		RUC_PATTERN.test(taxId) && legalName.trim() !== "" && !lookingUp && !saving;

	return (
		<div className="space-y-3 p-4">
			<div className="space-y-1.5">
				<label htmlFor="new-customer-ruc" className="text-sm font-medium">
					RUC del cliente
				</label>
				<div className="relative">
					<Input
						id="new-customer-ruc"
						value={taxId}
						onChange={(e) => {
							setError(null);
							setTaxId(e.target.value.replace(/\D/g, ""));
						}}
						onBlur={(e) => void fillFromSunat(e.target.value)}
						inputMode="numeric"
						maxLength={11}
						placeholder="20XXXXXXXXX"
						className="h-11 tabular-nums"
					/>
					{lookingUp && (
						<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
					)}
				</div>
			</div>
			<div className="space-y-1.5">
				<label htmlFor="new-customer-name" className="text-sm font-medium">
					Razón social del cliente
				</label>
				<Input
					id="new-customer-name"
					value={legalName}
					onChange={(e) => {
						setError(null);
						setLegalName(e.target.value);
					}}
					placeholder="Como figura en SUNAT"
					className="h-11"
				/>
			</div>
			{error && (
				<p role="alert" className="text-xs text-destructive">
					{error}
				</p>
			)}
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="ghost"
					className="h-11"
					onClick={onCancel}
				>
					Cancelar
				</Button>
				<Button
					type="button"
					className="h-11"
					disabled={!canSave}
					onClick={() => void save()}
				>
					{saving ? "Guardando…" : "Guardar cliente"}
				</Button>
			</div>
		</div>
	);
}
