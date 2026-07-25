import type React from "react";

/**
 * @fileoverview HubMessage - Mensajes con diseño Elite Binary 2026
 * @module features/cognitive-hub/components/message/HubMessage
 */

import type { CognitiveMessage } from "@drenyra/shared/messaging";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles, User } from "lucide-react";
import { trackEvent } from "@/lib/monitoring";
import { cn } from "@/lib/utils";
import { useHubState } from "../../hooks/useHubState";
import { ArtifactRenderer } from "../artifacts/ArtifactRenderer";
import { SwarmTrace } from "./SwarmTrace";

interface HubMessageProps {
	message: CognitiveMessage;
}

/**
 * HubMessage - High Fidelity Binary System
 */
export const HubMessage = ({ message }: HubMessageProps) => {
	const isAssistant = message.role === "assistant";
	const { isAuditMode, setActiveArtifact } = useHubState();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.98 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ type: "spring", damping: 25, stiffness: 300 }}
			className={cn(
				"flex w-full gap-3 @md:gap-6",
				isAssistant
					? "max-w-[95%] @md:max-w-5xl mr-auto"
					: "max-w-[90%] @md:max-w-2xl ml-auto flex-row-reverse",
			)}
		>
			<MessageAvatar isAssistant={isAssistant} />

			<div
				className={cn(
					"flex-1 space-y-2 @md:space-y-3",
					!isAssistant && "text-right",
				)}
			>
				<MessageHeader
					isAssistant={isAssistant}
					timestamp={message.timestamp}
					isConsensus={
						message.swarmTrace && message.swarmTrace.steps.length > 1
					}
				/>

				<MessageBody isAssistant={isAssistant}>{message.content}</MessageBody>

				{/* Artifacts - Grid Layout */}
				{isAssistant && message.artifacts && message.artifacts.length > 0 && (
					<div className="mt-6 space-y-4">
						{message.artifacts.map((art) => (
							<div
								key={art.id}
								onClick={() => setActiveArtifact(art)}
								className="cursor-pointer hover:scale-[1.01] transition-transform"
							>
								<ArtifactRenderer artifact={art} />
							</div>
						))}
					</div>
				)}

				{/* Neural Trace - Visual Timeline */}
				{isAssistant && (message.swarmTrace || isAuditMode) && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						className="mt-4"
					>
						<SwarmTrace
							steps={
								message.swarmTrace?.steps || [
									{
										agentId: "system",
										agentName: "Sync",
										status: "completed",
										message: "Core integrity verified.",
										timestamp: "now",
									},
								]
							}
						/>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
};

// ==================== SUB-COMPONENTES ELITE ====================

function MessageAvatar({ isAssistant }: { isAssistant: boolean }) {
	return (
		<div
			className={cn(
				"relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 @md:h-10 @md:w-10 @md:rounded-xl",
				isAssistant
					? "bg-[var(--surface-1)] text-[var(--text-primary)] border-[var(--stroke-1)]"
					: "bg-[var(--surface-2)] border-[var(--stroke-1)] text-[var(--text-primary)]",
			)}
		>
			{isAssistant ? (
				<Sparkles size={16} className="@md:w-5 @md:h-5 relative z-10" />
			) : (
				<User size={16} className="@md:w-5 @md:h-5" />
			)}
		</div>
	);
}

function MessageHeader({
	isAssistant,
	timestamp,
	isConsensus,
}: {
	isAssistant: boolean;
	timestamp: Date;
	isConsensus?: boolean;
}) {
	return (
		<header className="flex items-center gap-2 @md:gap-4 px-1">
			<div className="flex items-center gap-2">
				<span
					className={cn(
						"text-[8px] @md:text-3xs font-black uppercase tracking-[0.2em] @md:tracking-[0.3em] antialiased",
						isAssistant
							? "text-[var(--text-primary)]"
							: "text-[var(--text-tertiary)]",
					)}
				>
					{isAssistant ? "Drenyra Core" : "Authorized Operator"}
				</span>
				{isAssistant && isConsensus && (
					<div className="px-1 py-0.5 rounded-md bg-[rgba(var(--premium-success-rgb),0.10)] border border-[rgba(var(--premium-success-rgb),0.20)] flex items-center gap-1">
						<ShieldCheck
							size={7}
							className="@md:w-2 @md:h-2 text-[var(--premium-success)]"
						/>
						<span className="text-[6px] @md:text-[7px] font-black text-[var(--premium-success)] uppercase tracking-widest antialiased">
							Consensus
						</span>
					</div>
				)}
			</div>
			<div className="h-[1px] flex-1 bg-[var(--stroke-1)]" />
			<span className="text-[8px] @md:text-3xs font-mono text-[var(--text-tertiary)] tabular-nums">
				{timestamp.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})}
			</span>
		</header>
	);
}

function MessageBody({
	isAssistant,
	children,
}: {
	isAssistant: boolean;
	children: React.ReactNode;
}) {
	// Logic to wrap currency or doc IDs in interactive links
	const processText = (text: string) => {
		if (typeof text !== "string") return text;

		const parts = text.split(
			/(\bS\/ \d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\bF\d{3}-\d+\b)/g,
		);

		return parts.map((part, i) => {
			const isMatch = part.match(
				/(\bS\/ \d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\bF\d{3}-\d+\b)/,
			);
			if (isMatch) {
				return (
					<span
						key={i}
						className="cursor-pointer border-b border-foreground/40 font-black text-foreground shadow-glow-sm transition-colors duration-200 hover:border-foreground"
						onClick={() => {
							trackEvent("cognitive_hub.deep_link_click", {
								token: part,
							});
						}}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								trackEvent("cognitive_hub.deep_link_click", { token: part });
							}
						}}
					>
						{part}
					</span>
				);
			}
			return part;
		});
	};

	return (
		<div
			className={cn(
				"group/msg relative overflow-hidden rounded-2xl border p-4 text-[14px] leading-relaxed transition-all duration-200 sm:p-5 sm:text-[15px]",
				isAssistant
					? "border-[var(--stroke-1)] bg-[var(--surface-1)] text-[var(--text-primary)]"
					: "border-[var(--stroke-1)] bg-[var(--surface-2)] text-[var(--text-primary)]",
			)}
		>
			<div className="relative z-10 font-medium tracking-tight">
				{typeof children === "string" ? processText(children) : children}
			</div>
		</div>
	);
}

export default HubMessage;
