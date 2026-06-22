"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { DrenyraMacosChrome } from "@/components/drenyra/drenyra-macos-chrome";
import { DrenyraThoughtPulse } from "@/components/drenyra/drenyra-thought-pulse";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

const LOGS = [
	{
		id: 1,
		text: "> drenyra --orchestrate fiscal-closure",
		tone: "text-foreground",
	},
	{
		id: 2,
		text: "[drenyra] Iniciando orquestación RUC 2060…",
		tone: "text-[var(--drenyra-warm)]",
	},
	{
		id: 3,
		text: "[evidra] Rastreadas 1,245 facturas (SIRE vs OSE)",
		tone: "drenyra-text-accent",
	},
	{
		id: 4,
		text: "[vigia] Detectadas 3 discrepancias de IGV",
		tone: "text-foreground",
	},
	{
		id: 5,
		text: "[drenyra] Requiere revisión de compliance",
		tone: "text-[var(--drenyra-warm)]",
	},
	{
		id: 6,
		text: "[status] Awaiting human approval…",
		tone: "text-section-label",
	},
	{
		id: 7,
		text: "[user] Aprobado. TraceId: 8f2b-9a4c",
		tone: "drenyra-text-emerald",
	},
	{
		id: 8,
		text: "[nexa] Generando expediente fiscal auditable…",
		tone: "drenyra-text-accent",
	},
	{
		id: 9,
		text: "DONE. Fiscal truth established.",
		tone: "drenyra-text-emerald font-semibold",
	},
] as const;

export function DrenyraTerminalPreview(): ReactElement {
	const reduceMotion = useReducedMotion();
	const [visibleCount, setVisibleCount] = useState(
		reduceMotion ? LOGS.length : 0,
	);

	useEffect(() => {
		if (reduceMotion) return;
		let index = 0;
		const interval = setInterval(() => {
			index += 1;
			if (index <= LOGS.length) {
				setVisibleCount(index);
			} else {
				setVisibleCount(LOGS.length);
				clearInterval(interval);
				return;
			}
		}, 1200);
		return () => clearInterval(interval);
	}, [reduceMotion]);

	const visibleLogs = reduceMotion ? LOGS : LOGS.slice(0, visibleCount);
	const showCursor = !reduceMotion && visibleCount < LOGS.length;

	return (
		<DrenyraMacosChrome
			title="drenyra-sh"
			badge="CLI"
			modelBadge="DeepSeek V4 Flash"
		>
			<div className="flex items-center justify-end border-b border-[var(--drenyra-border-glass)] px-4 py-1.5">
				<DrenyraThoughtPulse />
			</div>
			<div className="min-h-[280px] flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed md:min-h-[360px]">
				<div className="space-y-1.5" aria-live="polite">
					<AnimatePresence mode="popLayout">
						{visibleLogs.map((log) => (
							<motion.div
								key={log.id}
								initial={reduceMotion ? false : { opacity: 0, x: -4 }}
								animate={{ opacity: 1, x: 0 }}
								className={`flex gap-2 ${log.tone}`}
							>
								<span className="select-none text-[var(--drenyra-warm)]/50">
									~
								</span>
								<span className="break-all">{log.text}</span>
							</motion.div>
						))}
					</AnimatePresence>
					{showCursor ? (
						<motion.span
							animate={{ opacity: [1, 0] }}
							transition={{ duration: 0.65, repeat: Infinity }}
							className="inline-block h-4 w-0.5 bg-[var(--drenyra-accent)] align-middle"
							aria-hidden
						/>
					) : null}
				</div>
			</div>
		</DrenyraMacosChrome>
	);
}
