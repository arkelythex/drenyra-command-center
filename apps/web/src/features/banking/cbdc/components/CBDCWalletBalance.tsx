import {
	ArrowDownLeft,
	ArrowUpRight,
	RefreshCw,
	ShieldCheck,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn, n } from "@/lib/utils";
import { useCBDCWallet } from "../hooks/useCBDCWallet";

interface CBDCWalletBalanceProps {
	walletId?: string;
	showActions?: boolean;
	onReceive?: () => void;
	onSend?: () => void;
	className?: string;
}

export const CBDCWalletBalance: React.FC<CBDCWalletBalanceProps> = ({
	walletId,
	showActions = true,
	onReceive,
	onSend,
	className,
}) => {
	const {
		balance,
		pendingBalance,
		currency,
		syncStatus,
		isLoading,
		refetch,
		lastSync,
	} = useCBDCWallet({ walletId });

	const formatMoney = n;

	return (
		<Card
			className={cn(
				"overflow-hidden border border-border/60 bg-[var(--surface-1)]/92 shadow-[var(--shadow-sm)]",
				className,
			)}
		>
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start">
					<div>
						<CardTitle className="text-lg font-medium text-foreground">
							CBDC Wallet
						</CardTitle>
						<CardDescription className="flex items-center gap-1 text-xs mt-1">
							<ShieldCheck className="h-3 w-3 text-success" />
							Sovereign BCRP Node
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"flex h-2 w-2 rounded-full",
								syncStatus === "synced"
									? "bg-success shadow-[0_0_8px_rgba(var(--premium-success-rgb),0.32)]"
									: syncStatus === "syncing"
										? "bg-warning animate-pulse"
										: "bg-danger",
							)}
						/>
						{syncStatus === "syncing" && (
							<RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<div className="space-y-4">
					<div>
						<div className="mb-1 text-4xl font-black tracking-tighter text-foreground">
							{isLoading ? (
								<span className="animate-pulse">S/ ...</span>
							) : (
								formatMoney(balance)
							)}
						</div>
						<div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold ml-1">
							Disponible
						</div>
					</div>

					{!isLoading && pendingBalance > 0 && (
						<div className="flex items-center justify-between rounded-lg border border-border/50 bg-[var(--surface-2)]/68 p-2 text-xs">
							<span className="text-muted-foreground">En proceso</span>
							<span className="font-mono font-bold text-foreground">
								{formatMoney(pendingBalance)}
							</span>
						</div>
					)}

					{showActions && (
						<div className="grid grid-cols-2 gap-3 mt-4">
							<Button
								variant="outline"
								className="w-full rounded-xl border border-border/70 bg-[var(--surface-2)]/60 text-foreground hover:bg-[var(--surface-2)]/82"
								onClick={onReceive}
							>
								<ArrowDownLeft className="mr-2 h-4 w-4 text-success" />
								Recibir
							</Button>
							<Button
								className="w-full rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/15 transition-[opacity,transform,box-shadow] duration-200 hover:opacity-95 hover:shadow-primary/20 hover:scale-[1.01]"
								onClick={onSend}
							>
								<ArrowUpRight className="mr-2 h-4 w-4" />
								Enviar
							</Button>
						</div>
					)}

					<div className="text-2xs text-muted-foreground text-center pt-2 opacity-50">
						{lastSync
							? `Sincronizado: ${lastSync.toLocaleTimeString()}`
							: "Iniciando conexión..."}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
