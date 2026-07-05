"use client";

import { motion } from "framer-motion";
import { Check, Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SendFeedback } from "./useSendFeedback";

interface ComposerSendButtonProps {
	hasMessage: boolean;
	isSending: boolean;
	sendFeedback: SendFeedback;
	onSend: () => void;
}

export function ComposerSendButton({
	hasMessage,
	isSending,
	sendFeedback,
	onSend,
}: ComposerSendButtonProps) {
	return (
		<div className="flex items-center gap-2">
			{hasMessage && (
				<span className="hidden text-xs text-[var(--text-muted)] sm:inline">
					Cmd+Enter to send
				</span>
			)}

			<button
				disabled
				aria-label="Voice input (coming soon)"
				className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-40"
				title="Voice input (coming soon)"
			>
				<Mic size={16} />
			</button>

			<motion.button
				aria-label="Send message"
				onClick={onSend}
				disabled={!hasMessage || isSending}
				whileHover={hasMessage && !isSending ? { scale: 1.05 } : {}}
				whileTap={hasMessage && !isSending ? { scale: 0.95 } : {}}
				animate={sendFeedback === "shake" ? { x: [0, -4, 4, -4, 4, 0] } : {}}
				transition={{ type: "spring", stiffness: 400, damping: 17 }}
				className={cn(
					"flex h-8 w-8 items-center justify-center rounded-lg transition-all",
					hasMessage && !isSending && sendFeedback !== "success"
						? "bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary)]/90"
						: sendFeedback === "success"
							? "bg-[var(--premium-success)] text-white shadow-sm"
							: "bg-[var(--surface-2)] text-[var(--text-muted)]",
					"disabled:opacity-40",
				)}
			>
				{isSending ? (
					<span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
				) : sendFeedback === "success" ? (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1, rotate: [0, 10, 0] }}
						transition={{ type: "spring", stiffness: 500, damping: 15 }}
					>
						<Check size={16} />
					</motion.span>
				) : (
					<Send size={16} />
				)}
			</motion.button>
		</div>
	);
}
