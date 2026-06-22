import { CheckCircle2, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { captureError } from "@/lib/monitoring";
import { cn } from "@/lib/utils";
import { ConversationBubble } from "./conversation-bubble";
import { DemoMetricChip } from "./demo-metric-chip";
import type {
  ConversationStep,
  DemoId,
  DemoOutcome,
} from "./demo-showcase.types";
import { tokensToClasses } from "@/lib/design-tokens";

interface DemoPlayerProps {
	demoId: DemoId;
	onClose: () => void;
}

interface ParsedSseEvent {
	eventName: string;
	payload: Record<string, unknown>;
}

function parseSseLines(lines: string[]): ParsedSseEvent[] {
	const events: ParsedSseEvent[] = [];
	let eventName = "";
	let dataParts: string[] = [];

	for (const line of lines) {
		if (line.startsWith("event: ")) {
			eventName = line.slice(7).trim();
			dataParts = [];
			continue;
		}

		if (line.startsWith("data: ")) {
			dataParts.push(line.slice(6));
			continue;
		}

		if (line !== "" || !eventName || dataParts.length === 0) continue;

		try {
			const payload = JSON.parse(dataParts.join("\n")) as Record<
				string,
				unknown
			>;
			events.push({ eventName, payload });
		} catch {
			// Ignore malformed demo events.
		}

		eventName = "";
		dataParts = [];
	}

	return events;
}

export function shouldUseReducedMotion(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	);
}

export const DemoPlayer = ({ demoId, onClose }: DemoPlayerProps) => {
	const [steps, setSteps] = useState<ConversationStep[]>([]);
	const [visibleCount, setVisibleCount] = useState(0);
	const [outcome, setOutcome] = useState<DemoOutcome | null>(null);
	const [isDone, setIsDone] = useState(false);
	const [demoTitle, setDemoTitle] = useState("");
	const [elapsed, setElapsed] = useState(0);
	const scrollRef = useRef<HTMLDivElement>(null);
	const startRef = useRef<number>(Date.now());

	useEffect(() => {
		const interval = setInterval(() => {
			const nextElapsed = Math.floor((Date.now() - startRef.current) / 1000);
			setElapsed((currentElapsed) =>
				currentElapsed === nextElapsed ? currentElapsed : nextElapsed,
			);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: shouldUseReducedMotion() ? "auto" : "smooth",
		});
	}, [visibleCount]);

	const handleEvent = useCallback(
		(eventName: string, payload: Record<string, unknown>) => {
			switch (eventName) {
				case "demo_start":
					setDemoTitle((payload.title as string) ?? "Demo");
					break;
				case "conversation_step":
					setSteps((prev) => [...prev, payload as unknown as ConversationStep]);
					setVisibleCount((prev) => prev + 1);
					break;
				case "demo_outcome":
					setOutcome(payload as unknown as DemoOutcome);
					break;
				case "demo_done":
					setIsDone(true);
					break;
				default:
					break;
			}
		},
		[],
	);

	useEffect(() => {
		const abortController = new AbortController();

		(async () => {
			try {
				const response = await fetch(`/api/demos/${demoId}/play`, {
					method: "POST",
					signal: abortController.signal,
					headers: { Accept: "text/event-stream" },
				});

				if (!response.body) return;

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { value, done } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const parsedEvent of parseSseLines(lines)) {
						handleEvent(parsedEvent.eventName, parsedEvent.payload);
					}
				}
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					captureError(
						error instanceof Error
							? error
							: new Error("Demo player stream error"),
						{
							source: "onboarding.demo-player.stream",
							demoId,
						},
					);
				}
			}
		})();

		return () => {
			abortController.abort();
		};
	}, [demoId, handleEvent]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md">
			<div className={cn(tokensToClasses.borderRadius('card'), "flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden border border-border/40 bg-background shadow-xl")}>
				<div className="flex items-center justify-between border-b border-border/20 bg-foreground/[0.02] px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="h-2 w-2 motion-safe:animate-pulse rounded-full bg-[var(--premium-success)]" />
						<span className="text-sm font-black uppercase tracking-tight text-foreground">
							{demoTitle || "Cargando demo..."}
						</span>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Timer size={12} />
							<span className="text-2xs font-mono font-black tabular-nums">
								{elapsed}s
							</span>
						</div>

						<button
							onClick={onClose}
							className="rounded-lg border border-border/20 bg-foreground/5 px-3 py-1.5 text-2xs font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
						>
							Cerrar
						</button>
					</div>
				</div>

				<div
					ref={scrollRef}
					className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-foreground/10 flex-1 space-y-4 overflow-y-auto p-6"
				>
					{steps.map((step, index) => (
						<ConversationBubble
							key={`${step.index}-${index}`}
							step={step}
							visible={index < visibleCount}
						/>
					))}

					{!isDone && steps.length > 0 ? (
						<div className="flex gap-1.5 pl-10 motion-safe:animate-pulse">
							{[0, 1, 2].map((dotIndex) => (
								<div
									key={dotIndex}
									className="h-1.5 w-1.5 rounded-full bg-foreground/30"
									style={{ animationDelay: `${dotIndex * 0.15}s` }}
								/>
							))}
						</div>
					) : null}
				</div>

				{outcome && isDone ? (
					<div className="space-y-4 border-t border-border/20 bg-foreground/[0.02] p-6">
						<div className="flex items-center gap-2">
							<CheckCircle2
								size={14}
								className="text-[var(--premium-success)]"
							/>
							<span className="text-2xs font-black uppercase tracking-widest text-[var(--premium-success)]">
								Demo completado - {outcome.resolutionTimeSeconds}s
							</span>
						</div>

						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{outcome.metrics.map((metric, index) => (
								<DemoMetricChip
									key={`${metric.label}-${index}`}
									{...metric}
								/>
							))}
						</div>

						<p className="text-3xs font-mono uppercase tracking-wider text-muted-foreground/50">
							Base legal: {outcome.legalRef}
						</p>
					</div>
				) : null}
			</div>
		</div>
	);
};
