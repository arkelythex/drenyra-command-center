import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string;
	icon: LucideIcon;
	color?: "emerald" | "orange" | "red" | "primary";
}

export const StatCard = ({
	label,
	value,
	icon: Icon,
	color,
}: StatCardProps) => (
	<Card className="border-none shadow-sm bg-card overflow-hidden">
		<CardContent className="p-5 flex flex-col gap-3">
			<div
				className={cn(
					"h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
					color === "emerald"
						? "bg-foreground/10 text-[var(--premium-success)]"
						: color === "orange"
							? "bg-foreground/10 text-orange-600"
							: color === "red"
								? "bg-red-500/10 text-red-600"
								: "bg-primary/5 text-primary",
				)}
			>
				<Icon size={20} />
			</div>
			<div>
				<p className="text-2xs font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
					{label}
				</p>
				<p className="text-lg lg:text-xl font-black font-mono tracking-tighter text-foreground">
					{value}
				</p>
			</div>
		</CardContent>
	</Card>
);
