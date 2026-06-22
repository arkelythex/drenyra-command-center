import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { presentError } from "@/lib/error-messages";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { useCreateAccountMutation } from "../../hooks/useBankingQueries";
import type { BankAccountType, Currency } from "../../api/banking.api.types";

function isBankAccountType(value: string): value is BankAccountType {
	return value === "CHECKING" || value === "SAVINGS" || value === "CREDIT";
}

function isCurrency(value: string): value is Currency {
	return value === "PEN" || value === "USD";
}

export const AddAccountModal = () => {
	const { trigger } = useHaptics();
	const financialHaptics = useFinancialHaptics();
	const createAccountMutation = useCreateAccountMutation();

	const [open, setOpen] = useState(false);
	const [accountName, setAccountName] = useState("");
	const [accountNumber, setAccountNumber] = useState("");
	const [bankName, setBankName] = useState("");
	const [accountType, setAccountType] = useState<BankAccountType>("CHECKING");
	const [currency, setCurrency] = useState<Currency>("PEN");
	const [currentBalance, setCurrentBalance] = useState("");

	const canSubmit =
		accountName.trim().length > 0 &&
		accountNumber.trim().length >= 6 &&
		bankName.trim().length > 0;

	const reset = () => {
		setAccountName("");
		setAccountNumber("");
		setBankName("");
		setAccountType("CHECKING");
		setCurrency("PEN");
		setCurrentBalance("");
	};

	const onSubmit = async () => {
		if (!canSubmit) return;
		financialHaptics.onSubmit();

		try {
			await createAccountMutation.mutateAsync({
				accountName: accountName.trim(),
				accountNumber: accountNumber.trim(),
				accountType,
				bankName: bankName.trim(),
				currency,
				currentBalance: currentBalance.trim().length
					? Number(currentBalance)
					: undefined,
			});

			toast.success("Cuenta creada");
			setOpen(false);
			reset();
		} catch (error) {
			const presentation = presentError(error, "No se pudo crear la cuenta");
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
					size="sm"
					className="h-10 px-4 rounded-xl bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90 text-xs font-bold uppercase tracking-widest"
				>
					<Plus size={14} className="mr-2" />
					Nueva cuenta
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-base font-bold uppercase tracking-widest">
						Nueva cuenta bancaria
					</DialogTitle>
					<DialogDescription>
						Configura la cuenta para importar movimientos y conciliar pagos.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="accountName">Nombre</Label>
						<Input
							id="accountName"
							value={accountName}
							onChange={(e) => setAccountName(e.target.value)}
							placeholder="BCP Cta. Corriente Soles"
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="bankName">Banco</Label>
						<Input
							id="bankName"
							value={bankName}
							onChange={(e) => setBankName(e.target.value)}
							placeholder="BCP"
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="accountNumber">Número de cuenta</Label>
						<Input
							id="accountNumber"
							value={accountNumber}
							onChange={(e) => setAccountNumber(e.target.value)}
							placeholder="191-2233445-0-01"
						/>
					</div>

					<div className="grid gap-2">
						<Label>Tipo</Label>
						<Select
							value={accountType}
							onValueChange={(v) => {
								if (isBankAccountType(v)) setAccountType(v);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecciona tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="CHECKING">Corriente</SelectItem>
								<SelectItem value="SAVINGS">Ahorros</SelectItem>
								<SelectItem value="CREDIT">Crédito</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Moneda</Label>
							<Select
								value={currency}
								onValueChange={(v) => {
									if (isCurrency(v)) setCurrency(v);
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Moneda" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PEN">PEN</SelectItem>
									<SelectItem value="USD">USD</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="currentBalance">Saldo inicial</Label>
							<Input
								id="currentBalance"
								value={currentBalance}
								onChange={(e) => setCurrentBalance(e.target.value)}
								placeholder="0"
								inputMode="decimal"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => {
								trigger("light");
								setOpen(false);
							}}
							className="rounded-xl"
						>
							Cancelar
						</Button>
						<Button
							onClick={onSubmit}
							disabled={!canSubmit || createAccountMutation.isPending}
							className="rounded-xl bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
						>
							{createAccountMutation.isPending ? "Guardando…" : "Crear"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
