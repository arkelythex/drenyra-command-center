import {
	Landmark,
	CreditCard,
	Building2,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { cn, n } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHaptics } from "@/hooks/useHaptics";
import type { BankAccount } from "../../stores/banking.store.types";
import type { MouseEvent } from "react";

interface AccountCardProps {
	account: BankAccount;
	isSelected: boolean;
	unreconciledCount?: number;
	onSelect: (id: string) => void;
	onDelete?: (id: string) => void;
}

export const AccountCard = ({
	account,
	isSelected,
	unreconciledCount = 0,
	onSelect,
	onDelete,
}: AccountCardProps) => {
	const { trigger } = useHaptics();

	const formatMoney = (amount: string, currency: string) =>
		n(parseFloat(amount), currency as Parameters<typeof n>[1]);

	const getAccountIcon = () => {
		switch (account.accountType) {
			case "CREDIT":
				return <CreditCard size={18} strokeWidth={1.5} />;
			case "SAVINGS":
				return <Building2 size={18} strokeWidth={1.5} />;
			default:
				return <Landmark size={18} strokeWidth={1.5} />;
		}
	};

	const handleSelect = () => {
		trigger("medium");
		onSelect(account.id);
	};

	const handleDelete = (e: MouseEvent) => {
		e.stopPropagation();
		trigger("heavy");
		onDelete?.(account.id);
	};

	return (
		<div
			onClick={handleSelect}
			className={cn(
				"relative flex cursor-pointer items-center gap-4 rounded-[1.25rem] border p-4 transition-[background-color,border-color,box-shadow,transform,color] duration-200",
				isSelected
					? "z-10 scale-[1.01] border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-sm"
					: "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:bg-[var(--surface-2)] hover:-translate-y-0.5",
			)}
		>
			<div
				className={cn(
					"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner transition-[background-color,border-color,color,box-shadow,transform] duration-200",
					isSelected
						? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-sm"
						: "border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-tertiary)]/60",
				)}
			>
				{getAccountIcon()}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-3">
					<p
						className={cn(
							"text-sm font-bold uppercase tracking-tight truncate leading-none",
							isSelected
								? "text-[var(--accent)]"
								: "text-[var(--text-primary)]/80",
						)}
					>
						{account.accountName}
					</p>
					{account.isDefault && (
						<Badge variant="info" className="h-5 px-2 text-[8px]">
							Primary
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2 mt-2">
					<span className="text-2xs font-bold text-[var(--text-tertiary)]/40 uppercase tracking-widest leading-none">
						{account.bankName}
					</span>
					<span className="h-1 w-1 rounded-full bg-border/30" />
					<span className="text-2xs font-mono font-bold text-[var(--text-tertiary)]/60 tracking-tighter leading-none">
						****{account.accountNumber.slice(-4)}
					</span>
				</div>
			</div>

			<div className="flex flex-col items-end gap-1.5">
				<p
					className={cn(
						"text-sm font-mono font-bold tabular-nums tracking-tighter leading-none",
						parseFloat(account.currentBalance) < 0
							? "text-danger"
							: isSelected
								? "text-[var(--accent)]"
								: "text-[var(--text-primary)]",
					)}
				>
					{formatMoney(account.currentBalance, account.currency)}
				</p>
				{unreconciledCount > 0 && (
					<Badge
						variant="warning"
						className="h-5 px-2 text-[8px] animate-pulse"
					>
						{unreconciledCount} Ops
					</Badge>
				)}
			</div>

			{onDelete && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Más opciones"
							onClick={(e) => e.stopPropagation()}
							className="ml-1 h-8 w-8 text-[var(--text-tertiary)]/60 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
						>
							<MoreVertical size={14} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="border-[var(--border-subtle)] bg-[var(--surface-1)]"
					>
						<DropdownMenuItem
							onClick={handleDelete}
							className="cursor-pointer uppercase text-2xs font-bold tracking-widest text-danger focus:bg-danger-subtle focus:text-danger"
						>
							<Trash2 size={14} className="mr-2" />
							Eliminar Bóveda
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
};
