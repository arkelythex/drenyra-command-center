import { Landmark, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/motion-primitives";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface BankingDesktopHeaderProps {
	isLoading: boolean;
	balanceValue: number;
	balanceFormatter: (value: number) => string;
	onRegisterFunds: () => void;
	importAction: ReactNode;
}

export function BankingDesktopHeader({
	isLoading,
	balanceValue,
	balanceFormatter,
	onRegisterFunds,
	importAction,
}: BankingDesktopHeaderProps) {
	return (
		<header className="relative z-[40] hidden shrink-0 flex-col items-center justify-between gap-5 overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-5 shadow-sm sm:flex md:flex-row">
			<div className="relative z-10 flex w-full items-center gap-4 md:w-auto group">
				<div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--text-on-accent)] shadow-sm transition-[box-shadow,transform] group-hover:scale-[1.02] group-hover:rotate-2">
					<Landmark size={26} strokeWidth={2.5} />
				</div>
				<div>
					<h1 className="mb-2 text-xl font-bold leading-none text-[var(--text-primary)]">
						Extracto de Tesorería
					</h1>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3.5 py-1.5">
							<AnimatedNumber
								value={balanceValue}
								formatter={balanceFormatter}
								className="text-sm font-bold font-mono tracking-tight text-[var(--accent)] tabular-nums"
							/>
						</div>
						<Badge
							variant={isLoading ? "warning" : "info"}
							className="h-6 gap-2 px-2.5"
						>
							<span className="relative flex h-1.5 w-1.5">
								<span
									className={cn(
										"absolute inline-flex h-full w-full rounded-full opacity-75 bg-current",
										isLoading && "animate-ping",
									)}
								/>
								<span
									className={cn(
										"relative inline-flex rounded-full h-1.5 w-1.5 bg-current",
										tokensToClasses.shadow("dynamic"),
									)}
								/>
							</span>
							<span className="pt-0.5">
								{isLoading ? "Sincronizando" : "Integridad Verificada"}
							</span>
						</Badge>
					</div>
				</div>
			</div>

			<div className="relative z-10 flex w-full flex-col items-center gap-3 md:w-auto sm:flex-row">
				{importAction}
				<Button
					variant="default"
					size="lg"
					onClick={onRegisterFunds}
					className="h-12 w-full rounded-2xl bg-[var(--accent)] px-8 text-label font-bold uppercase tracking-[0.18em] text-[var(--text-on-accent)] shadow-sm transition-[background-color,box-shadow,transform] hover:-translate-y-px hover:opacity-90 active:scale-95 sm:w-auto"
				>
					<Plus size={16} strokeWidth={3} className="mr-2.5" /> Registrar Fondos
				</Button>
			</div>
		</header>
	);
}
