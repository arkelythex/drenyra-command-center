import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { presentError } from "@/lib/error-messages";
import type { BankCsvFormat } from "../../api/banking.api";
import { useImportTransactionsMutation } from "../../hooks/useBankingQueries";

interface ImportTransactionsModalProps {
	accountId: string | null;
}

export const ImportTransactionsModal = ({
	accountId,
}: ImportTransactionsModalProps) => {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();
	const importTransactionsMutation = useImportTransactionsMutation(accountId);

	const [open, setOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [format, setFormat] = useState<BankCsvFormat>("GENERIC");

	const canSubmit = Boolean(accountId && file);

	const onSubmit = async () => {
		if (!accountId || !file) return;
		financialHaptics.onSubmit();

		try {
			const result = await importTransactionsMutation.mutateAsync({
				file,
				format,
			});
			if (result.errors > 0) {
				const extras = [
					`${result.errors} filas con error`,
					Array.isArray(result.warnings) && result.warnings.length > 0
						? `${result.warnings.length} observaciones`
						: null,
				].filter(Boolean);

				toast.error("El archivo necesita revisión antes de importarse", {
					description: extras.join(" • "),
				});
				return;
			}

			const extras = [
				typeof result.duplicates === "number" && result.duplicates > 0
					? `${result.duplicates} duplicados`
					: null,
				Array.isArray(result.warnings) && result.warnings.length > 0
					? `${result.warnings.length} warnings`
					: null,
			].filter(Boolean);

			toast.success("Importación completada", {
				description: `${result.imported} transacciones importadas${extras.length ? ` • ${extras.join(" • ")}` : ""}`,
			});
			setOpen(false);
			setFile(null);
		} catch (error) {
			const presentation = presentError(
				error,
				"No se pudo importar el archivo",
			);
			toast.error(presentation.title, {
				description: presentation.description,
			});
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				trigger("light");
				setOpen(v);
			}}
		>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={!accountId}
					className="h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-2)] px-5 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
				>
					<Upload size={14} className="mr-2" /> Importar CSV
				</Button>
			</DialogTrigger>
			<DialogContent className="border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-sm">
				<DialogHeader>
					<DialogTitle className="text-base font-bold uppercase tracking-widest">
						Importar movimientos
					</DialogTitle>
					<DialogDescription>
						Sube un CSV exportado del banco (BCP/BBVA/Interbank/Scotiabank) o un
						CSV genérico.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="format">Formato Banco (Perú)</Label>
						<Select
							value={format}
							onValueChange={(v) => setFormat(v as BankCsvFormat)}
						>
							<SelectTrigger
								id="format"
								className="ui-search-input border-[var(--border-subtle)]"
							>
								<SelectValue placeholder="Selecciona formato" />
							</SelectTrigger>
							<SelectContent className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
								<SelectItem value="GENERIC">Auto / Genérico</SelectItem>
								<SelectItem value="BCP">BCP</SelectItem>
								<SelectItem value="BBVA">BBVA</SelectItem>
								<SelectItem value="INTERBANK">Interbank</SelectItem>
								<SelectItem value="SCOTIABANK">Scotiabank</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="file">Archivo CSV</Label>
						<Input
							id="file"
							type="file"
							accept=".csv,text/csv"
							onChange={(e) => setFile(e.target.files?.[0] ?? null)}
							className="ui-search-input border-[var(--border-subtle)]"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => {
								trigger("light");
								setOpen(false);
							}}
							className="rounded-xl border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-hover)]"
						>
							Cancelar
						</Button>
						<Button
							onClick={onSubmit}
							disabled={!canSubmit || importTransactionsMutation.isPending}
							className="rounded-xl bg-[var(--accent)] text-[var(--text-on-accent)] shadow-sm hover:opacity-95"
						>
							{importTransactionsMutation.isPending
								? "Importando…"
								: "Importar"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
