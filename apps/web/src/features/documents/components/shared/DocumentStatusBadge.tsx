import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	hasCDR: boolean;
	className?: string;
}

export const DocumentStatusBadge = ({ hasCDR, className }: Props) => (
	<div
		className={cn(
			"flex items-center gap-2 rounded-full border px-3 py-1.5 text-3xs font-black uppercase tracking-widest transition-[background-color,border-color,color,box-shadow,opacity] duration-200",
			hasCDR
				? "bg-[rgba(var(--premium-success-rgb),0.10)] text-[var(--premium-success)] border-[rgba(var(--premium-success-rgb),0.20)]"
				: "bg-muted/50 text-muted-foreground/50 border-border/50 opacity-60",
			className,
		)}
	>
		{hasCDR && <ShieldCheck size={10} strokeWidth={3} />}
		{hasCDR ? "Validado (CDR)" : "Pendiente"}
	</div>
);
