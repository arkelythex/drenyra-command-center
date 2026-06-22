import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrainThreadTimeline } from "./brain-thread-timeline";

export function SmartInboxCard() {
	return (
		<section className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/80 p-4">
			<p className="text-sm font-semibold">Smart Inbox conversacional</p>
			<p className="mt-1 text-xs text-[var(--text-tertiary)]">
				Subí facturas, mirá el debate de agentes y dejá el batch listo para
				declarar en una sola pantalla.
			</p>
			<Button asChild className="mt-3" size="sm">
				<Link to="/inbox">Abrir Inbox Inteligente →</Link>
			</Button>
		</section>
	);
}

export function SharedBrainCard() {
	return (
		<section
			aria-labelledby="drenyra-brain-title"
			className="mt-5 rounded-xl border border-border/60 p-4"
		>
			<h2 id="drenyra-brain-title" className="text-lg font-semibold">
				Shared Brain
			</h2>
			<p className="text-sm text-muted-foreground">
				Threads started from CLI or UI will appear here as the Brain API rollout
				progresses.
			</p>
			<div className="mt-3">
				<BrainThreadTimeline items={[]} />
			</div>
		</section>
	);
}
