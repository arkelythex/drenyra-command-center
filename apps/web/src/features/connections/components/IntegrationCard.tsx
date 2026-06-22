import { CheckCircle2, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Integration } from "../hooks/useConnections";

interface IntegrationCardProps {
	app: Integration;
}

export const IntegrationCard = ({ app }: IntegrationCardProps) => {
	const isConnected = app.status === "connected";

	return (
		<div
			className={cn(
				"group overflow-hidden rounded-2xl border p-5 transition-all duration-200",
				isConnected
					? "border-[var(--color-success)]/22 bg-[var(--color-success)]/4"
					: "border-[var(--color-stroke-1)] bg-[var(--color-surface-1)] hover:border-[var(--color-stroke-2)] hover:bg-[var(--color-surface-2)]/50",
			)}
		>
			<div className="mb-4 flex items-start justify-between gap-4">
				<div
					className={cn(
						"flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border text-lg transition-all duration-200",
						isConnected
							? "border-[var(--color-success)]/20 bg-[var(--color-success)]/8"
							: "border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]",
					)}
				>
					{app.logo.startsWith("http") ? (
						<img
							src={app.logo}
							alt={app.name}
							className="h-8 w-8 object-contain grayscale opacity-70 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100"
						/>
					) : (
						<span className="text-base">{app.logo}</span>
					)}
				</div>
				{isConnected ? (
					<span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-success)]/22 bg-[var(--color-success)]/8 px-2.5 py-0.5 text-2xs font-bold text-[var(--color-success)]">
						<CheckCircle2 size={10} strokeWidth={2.5} /> Conectado
					</span>
				) : (
					<Button
						variant="ghost"
						size="iconSm"
						className="rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
					>
						<Plus size={16} strokeWidth={2.5} />
					</Button>
				)}
			</div>

			<div className="space-y-1.5">
				<h3 className="text-xs font-bold text-[var(--color-text-primary)]">
					{app.name}
				</h3>
				<p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
					{app.description}
				</p>
			</div>

			<div className="mt-4 flex items-center justify-between border-t border-[var(--color-stroke-1)] pt-3.5">
				<span className="rounded-full border border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]/50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
					{app.category}
				</span>
				{isConnected ? (
					<Button
						variant="outline"
						size="sm"
						className="h-7 rounded-lg px-2.5 text-2xs font-bold"
					>
						<Settings size={11} className="mr-1" /> Configurar
					</Button>
				) : (
					<Button size="sm" className="h-7 rounded-lg px-3 text-2xs font-bold">
						Conectar
					</Button>
				)}
			</div>
		</div>
	);
};
