import { motion } from "framer-motion";
import { CheckCircle2, FileText, History, Trash2, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
	containerVariants,
	entranceVariants,
	MotionDiv,
} from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";
import type { AuditEvent } from "../api/audit.api";

interface AuditTableProps {
	events: AuditEvent[];
	isLoading: boolean;
}

function getTypeStyles(type: string) {
	switch (type) {
		case "create":
			return "bg-info-muted text-info border-info-subtle";
		case "update":
			return "bg-warning-muted text-warning border-warning-subtle";
		case "delete":
			return "bg-danger-muted text-danger border-danger-subtle";
		case "system":
			return "bg-info-muted text-info border-info-subtle";
		default:
			return "bg-muted text-muted-foreground border-border";
	}
}

function getTypeIcon(type: string) {
	switch (type) {
		case "create":
			return <CheckCircle2 size={10} strokeWidth={3} />;
		case "update":
			return <History size={10} strokeWidth={3} />;
		case "delete":
			return <Trash2 size={10} strokeWidth={3} />;
		case "system":
			return <History size={10} strokeWidth={3} />;
		default:
			return null;
	}
}

export function AuditTable({ events, isLoading }: AuditTableProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
			</div>
		);
	}

	return (
		<MotionDiv
			variants={containerVariants}
			initial="hidden"
			animate="visible"
			className="max-w-[1920px] mx-auto pb-20"
		>
			<Card className="overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-xl">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse min-w-[1000px]">
						<thead className="bg-muted/20">
							<tr className="border-b border-border/50">
								<th className="px-8 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/70 w-56">
									Timestamp
								</th>
								<th className="px-6 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/70">
									Acción Realizada
								</th>
								<th className="px-6 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/70">
									Usuario Responsable
								</th>
								<th className="px-6 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/70">
									Documento ID
								</th>
								<th className="px-8 py-5 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/70 text-right w-32">
									Tipo
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/30">
							{events.map((log) => (
								<motion.tr
									key={log.id}
									variants={entranceVariants}
									initial="hidden"
									animate="visible"
									className="hover:bg-muted/40 transition-colors duration-300 group"
								>
									<td className="px-8 py-5 font-mono text-sm font-bold text-muted-foreground uppercase opacity-80 group-hover:opacity-100 transition-opacity">
										{log.timestamp}
									</td>
									<td className="px-6 py-5">
										<span className="text-xs font-black text-foreground uppercase tracking-tight group-hover:text-foreground/90 transition-colors">
											{log.action}
										</span>
									</td>
									<td className="px-6 py-5">
										<div className="flex items-center gap-2.5">
											<div className="h-6 w-6 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground">
												<User size={12} strokeWidth={2.5} />
											</div>
											<span className="text-label font-bold text-foreground/80 uppercase tracking-wide">
												{log.user}
											</span>
										</div>
									</td>
									<td className="px-6 py-5">
										<div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-label font-mono font-bold uppercase text-muted-foreground shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200 group-hover:border-info-subtle group-hover:text-foreground">
											<FileText size={10} className="opacity-70" />
											{log.document}
										</div>
									</td>
									<td className="px-8 py-5 text-right">
										<span
											className={cn(
												"inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-wider shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-200",
												getTypeStyles(log.type),
											)}
										>
											{getTypeIcon(log.type)}
											{log.type}
										</span>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</MotionDiv>
	);
}
