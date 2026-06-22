import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AgentPulse } from "@/components/agentic/AgentPulse";

interface ActivityCardProps {
	agentName: string;
	message: string;
	icon: LucideIcon;
	status: "active" | "success" | "error";
	timestamp: string;
}

export function ActivityCard({
	agentName,
	message,
	icon: Icon,
	status,
	timestamp,
}: ActivityCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			className="group rounded-xl border border-border/20 bg-card/50 p-3 transition-[background-color,border-color] duration-150 hover:border-border/30"
		>
			<div className="flex items-start gap-3">
				<div className="mt-1">
					<AgentPulse status={status} size="sm" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="mb-1 flex items-center justify-between">
						<span className="text-2xs font-medium text-foreground/80">
							{agentName}
						</span>
						<span className="text-3xs font-medium text-muted-foreground/60">
							{timestamp}
						</span>
					</div>
					<p className="text-[12px] font-medium leading-relaxed text-foreground/85">
						{message}
					</p>
				</div>
				<Icon size={12} className="text-muted-foreground/30" />
			</div>
		</motion.div>
	);
}
