"use client";

import { motion } from "framer-motion";
import { AlertCircle, Bot, Pin, PinOff, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useThreadStore } from "@/stores/thread-store";
import { Composer } from "./Composer";
import { DEMO_MESSAGES } from "./ThreadView";

interface PopOutThreadProps {
	threadId: string;
}

export function PopOutThread({ threadId }: PopOutThreadProps) {
	const threads = useThreadStore((s) => s.threads);
	const [alwaysOnTop, setAlwaysOnTop] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [userScrolledUp, setUserScrolledUp] = useState(false);

	const thread = threads.find((t) => t.id === threadId);

	const displayMessages = DEMO_MESSAGES;

	function handleClose() {
		window.close();
	}

	function toggleAlwaysOnTop() {
		setAlwaysOnTop((prev) => !prev);
	}

	useEffect(() => {
		if (!alwaysOnTop) return;
		const id = setInterval(() => {
			window.focus();
		}, 2000);
		return () => clearInterval(id);
	}, [alwaysOnTop]);

	function handleScroll() {
		if (!scrollRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
		setUserScrolledUp(scrollHeight - scrollTop - clientHeight > 80);
	}

	useEffect(() => {
		if (userScrolledUp || !scrollRef.current) return;
		const raf = requestAnimationFrame(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		});
		return () => cancelAnimationFrame(raf);
	}, [displayMessages, userScrolledUp]);

	const isArchived = thread?.status === "archived";

	return (
		<div className="flex h-screen flex-col bg-[var(--surface-1)]">
			<header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
				<div className="flex min-w-0 items-center gap-3">
					<h1 className="truncate text-sm font-semibold text-[var(--text-primary)]">
						{thread?.title ?? "Thread"}
					</h1>
					{isArchived && (
						<span className="inline-flex items-center rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-3xs font-medium text-[var(--color-warning)]">
							Archived
						</span>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={toggleAlwaysOnTop}
						className={cn(
							"flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
							alwaysOnTop
								? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
								: "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]",
						)}
						title={alwaysOnTop ? "Disable stay on top" : "Stay on top"}
					>
						{alwaysOnTop ? <PinOff size={14} /> : <Pin size={14} />}
					</motion.button>

					<motion.button
						whileTap={{ scale: 0.95 }}
						onClick={handleClose}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
						title="Close"
					>
						<X size={14} />
					</motion.button>
				</div>
			</header>

			{isArchived ? (
				<div className="flex flex-1 items-center justify-center">
					<div className="text-center">
						<AlertCircle
							size={24}
							className="mx-auto mb-2 text-[var(--color-warning)]"
						/>
						<p className="text-sm font-medium text-[var(--text-secondary)]">
							Thread archived
						</p>
						<p className="mt-1 text-xs text-[var(--text-muted)]">
							This thread is no longer active
						</p>
					</div>
				</div>
			) : (
				<>
					<ScrollArea
						ref={scrollRef}
						onScroll={handleScroll}
						className="flex-1"
					>
						<div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
							{displayMessages.map((msg) => (
								<div
									key={msg.id}
									className={cn(
										"flex gap-3",
										msg.role === "user" && "flex-row-reverse",
									)}
								>
									<div
										className={cn(
											"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
											msg.role === "user" && "bg-[var(--color-primary)]/10",
											msg.role === "system" && "bg-[var(--color-warning)]/10",
											msg.role === "agent" && "bg-[var(--premium-info)]/10",
										)}
									>
										{msg.role === "user" ? (
											<User size={14} className="text-[var(--color-primary)]" />
										) : msg.role === "system" ? (
											<AlertCircle
												size={14}
												className="text-[var(--color-warning)]"
											/>
										) : (
											<Bot size={14} className="text-[var(--premium-info)]" />
										)}
									</div>
									<div
										className={cn(
											"flex max-w-[80%] flex-col gap-2",
											msg.role === "user" && "items-end",
										)}
									>
										<div
											className={cn(
												"rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
												msg.role === "user" &&
													"rounded-br-sm bg-[var(--color-primary)]/10 text-[var(--text-primary)]",
												msg.role === "agent" &&
													"rounded-bl-sm bg-[var(--surface-2)] text-[var(--text-primary)]",
												msg.role === "system" &&
													"rounded-bl-sm bg-[var(--color-warning)]/5 text-[var(--text-secondary)] italic",
											)}
										>
											<div className="whitespace-pre-wrap">{msg.content}</div>
										</div>
										<span
											className={cn(
												"text-3xs text-[var(--text-muted)]",
												msg.role === "user" ? "text-right" : "text-left",
											)}
										>
											{new Date(msg.timestamp).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</div>
								</div>
							))}

							<div className="h-px" />
						</div>
					</ScrollArea>

					<Composer onSend={(_message, _mode) => {}} />
				</>
			)}
		</div>
	);
}

PopOutThread.displayName = "PopOutThread";
