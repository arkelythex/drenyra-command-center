import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Upload } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	createBankAccount,
	fetchBankAccounts,
	importStatement,
	type NewBankAccount,
} from "../../services/bank-statement-import";
import {
	type ParsedStatement,
	parseStatementCsv,
} from "../../services/statement-csv";

const NEW_ACCOUNT = "new";
const MAX_ROWS = 5000;
const PREVIEW_ROWS = 8;
const SHOWN_ERRORS = 5;
const EMPTY_ACCOUNT: NewBankAccount = {
	bankName: "",
	accountName: "",
	accountNumber: "",
	currency: "PEN",
};

/** Integer cents → `S/ 1,234.56` without going through a float. */
export function formatCents(cents: number): string {
	const abs = Math.abs(cents);
	const units = Math.trunc(abs / 100).toLocaleString("en-US");
	const sign = cents < 0 ? "-" : "";
	return `${sign}S/ ${units}.${String(abs % 100).padStart(2, "0")}`;
}

function canCreate(account: NewBankAccount): boolean {
	return (
		account.bankName.trim() !== "" &&
		account.accountName.trim() !== "" &&
		account.accountNumber.trim().length >= 6
	);
}

/**
 * "Importar extracto": pick (or create) the bank account, read the CSV in the
 * browser, preview what will be sent, then post it in cents. Re-importing
 * the same file only adds what is new.
 */
export function StatementImportDialog() {
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId ?? "";
	const [open, setOpen] = React.useState(false);
	const [accountId, setAccountId] = React.useState("");
	const [newAccount, setNewAccount] = React.useState(EMPTY_ACCOUNT);
	const [fileName, setFileName] = React.useState("");
	const [parsed, setParsed] = React.useState<ParsedStatement>();

	const accounts = useQuery({
		queryKey: ["bank-accounts", companyId],
		queryFn: () => fetchBankAccounts(companyId),
		enabled: open && Boolean(companyId),
	});
	const accountList = accounts.data ?? [];
	const selected =
		accountId ||
		(accounts.isSuccess ? (accountList[0]?.id ?? NEW_ACCOUNT) : "");

	const reset = () => {
		setAccountId("");
		setNewAccount(EMPTY_ACCOUNT);
		setFileName("");
		setParsed(undefined);
	};

	const submit = useMutation({
		mutationFn: async (rows: ParsedStatement["rows"]) => {
			const targetId =
				selected === NEW_ACCOUNT
					? (await createBankAccount(companyId, newAccount)).id
					: selected;
			return importStatement(companyId, targetId, rows);
		},
		onSuccess: (result) => {
			toast.success(
				result.skipped > 0
					? `Se importaron ${result.imported} movimientos; ${result.skipped} ya estaban.`
					: `Se importaron ${result.imported} movimientos.`,
			);
			void queryClient.invalidateQueries({ queryKey: ["bank-reconciliation"] });
			void queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
			setOpen(false);
			reset();
		},
		onError: (cause) => {
			toast.error(
				cause instanceof Error ? cause.message : "No se pudo importar.",
			);
		},
	});

	const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setFileName(file.name);
		setParsed(parseStatementCsv(await file.text()));
	};

	const rows = parsed?.rows ?? [];
	const tooMany = rows.length > MAX_ROWS;
	const accountReady =
		selected !== "" && (selected !== NEW_ACCOUNT || canCreate(newAccount));
	const ready =
		Boolean(companyId) &&
		accountReady &&
		rows.length > 0 &&
		!tooMany &&
		!submit.isPending;

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) reset();
			}}
		>
			<DialogTrigger asChild>
				<Button
					disabled={!companyId}
					className="h-9 rounded-xl px-4 text-label font-semibold tracking-wide shadow-sm"
				>
					<Upload size={14} className="mr-2" /> Importar extracto
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Importar extracto bancario</DialogTitle>
					<DialogDescription>
						Sube el CSV que descargas de tu banco. Los movimientos que ya
						estaban importados no se duplican.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="statement-account">Cuenta bancaria</Label>
						<select
							id="statement-account"
							value={selected}
							onChange={(event) => setAccountId(event.target.value)}
							disabled={!accounts.isSuccess}
							className="h-9 rounded-md border border-border bg-background px-3 text-sm"
						>
							{!accounts.isSuccess && (
								<option value="">
									{accounts.isError
										? "No se pudieron cargar las cuentas"
										: "Cargando cuentas…"}
								</option>
							)}
							{accountList.map((account) => (
								<option key={account.id} value={account.id}>
									{account.bankName} · {account.accountName} ·{" "}
									{account.accountNumber} ({account.currency})
								</option>
							))}
							<option value={NEW_ACCOUNT}>Nueva cuenta…</option>
						</select>
					</div>

					{selected === NEW_ACCOUNT && (
						<NewAccountFields value={newAccount} onChange={setNewAccount} />
					)}

					<div className="grid gap-2">
						<Label htmlFor="statement-file">Archivo CSV</Label>
						<Input
							id="statement-file"
							type="file"
							accept=".csv,.txt,text/csv"
							onChange={(event) => void onFile(event)}
						/>
					</div>

					{parsed && (
						<StatementPreview
							fileName={fileName}
							parsed={parsed}
							tooMany={tooMany}
						/>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancelar
					</Button>
					<Button disabled={!ready} onClick={() => submit.mutate(rows)}>
						<FileUp size={14} className="mr-2" />
						{submit.isPending
							? "Importando…"
							: `Importar ${rows.length} movimientos`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function NewAccountFields({
	value,
	onChange,
}: {
	value: NewBankAccount;
	onChange: (next: NewBankAccount) => void;
}) {
	const field =
		(key: "bankName" | "accountName" | "accountNumber") =>
		(event: React.ChangeEvent<HTMLInputElement>) =>
			onChange({ ...value, [key]: event.target.value });
	return (
		<div className="grid gap-3 rounded-lg border border-border/60 p-3 sm:grid-cols-2">
			<div className="grid gap-1">
				<Label htmlFor="new-bank">Banco</Label>
				<Input
					id="new-bank"
					placeholder="BCP"
					value={value.bankName}
					onChange={field("bankName")}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="new-name">Nombre de la cuenta</Label>
				<Input
					id="new-name"
					placeholder="Cuenta corriente soles"
					value={value.accountName}
					onChange={field("accountName")}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="new-number">Número de cuenta</Label>
				<Input
					id="new-number"
					placeholder="191-1234567-0-12"
					value={value.accountNumber}
					onChange={field("accountNumber")}
				/>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="new-currency">Moneda</Label>
				<select
					id="new-currency"
					value={value.currency}
					onChange={(event) =>
						onChange({
							...value,
							currency: event.target.value === "USD" ? "USD" : "PEN",
						})
					}
					className="h-9 rounded-md border border-border bg-background px-3 text-sm"
				>
					<option value="PEN">Soles (PEN)</option>
					<option value="USD">Dólares (USD)</option>
				</select>
			</div>
		</div>
	);
}

function StatementPreview({
	fileName,
	parsed,
	tooMany,
}: {
	fileName: string;
	parsed: ParsedStatement;
	tooMany: boolean;
}) {
	const { rows, errors } = parsed;
	return (
		<div className="grid gap-3 text-sm">
			<p role="status">
				<span className="font-semibold">{fileName}</span>: {rows.length}{" "}
				movimientos · ingresos {formatCents(parsed.creditCents)} · egresos{" "}
				{formatCents(parsed.debitCents)}
			</p>
			{tooMany && (
				<p className="text-destructive">
					El archivo tiene más de {MAX_ROWS} movimientos; divídelo por mes.
				</p>
			)}
			{rows.length > 0 && (
				<div className="max-h-56 overflow-auto rounded-lg border border-border/60">
					<table className="w-full text-left text-xs">
						<thead className="bg-[var(--surface-1)] text-muted-foreground">
							<tr>
								<th className="px-3 py-2">Fecha</th>
								<th className="px-3 py-2">Descripción</th>
								<th className="px-3 py-2">Referencia</th>
								<th className="px-3 py-2 text-right">Monto</th>
							</tr>
						</thead>
						<tbody>
							{rows.slice(0, PREVIEW_ROWS).map((row, index) => (
								<tr
									// Rows have no id until imported; position is stable here.
									// biome-ignore lint/suspicious/noArrayIndexKey: preview only
									key={index}
									className="border-t border-border/40"
								>
									<td className="px-3 py-1.5 whitespace-nowrap">{row.date}</td>
									<td className="px-3 py-1.5">{row.description}</td>
									<td className="px-3 py-1.5">{row.reference ?? ""}</td>
									<td
										className={`px-3 py-1.5 text-right tabular-nums ${row.type === "CREDIT" ? "text-success" : ""}`}
									>
										{formatCents(
											row.type === "CREDIT"
												? row.amountCents
												: -row.amountCents,
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{rows.length > PREVIEW_ROWS && (
						<p className="px-3 py-2 text-xs text-muted-foreground">
							y {rows.length - PREVIEW_ROWS} más.
						</p>
					)}
				</div>
			)}
			{errors.length > 0 && (
				<div className="rounded-lg border border-warning/40 p-3 text-xs">
					<p className="font-semibold">
						{errors.length} líneas no se importarán:
					</p>
					<ul className="mt-1 list-disc pl-4">
						{errors.slice(0, SHOWN_ERRORS).map((error) => (
							<li key={error.line}>
								Línea {error.line}: {error.message}
							</li>
						))}
					</ul>
					{errors.length > SHOWN_ERRORS && (
						<p className="mt-1 text-muted-foreground">
							y {errors.length - SHOWN_ERRORS} más.
						</p>
					)}
				</div>
			)}
		</div>
	);
}
