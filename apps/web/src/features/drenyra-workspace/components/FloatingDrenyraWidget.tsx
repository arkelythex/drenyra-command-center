import { Bot, Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDrenyraChat } from "../hooks/useDrenyraChat";

export function FloatingDrenyraWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const { messages, sendMessage, isLoading, streamingAgent } = useDrenyraChat();
	const [input, setInput] = useState("");
	const listRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const clickListenerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	useEffect(() => {
		listRef.current?.scrollTo(0, listRef.current.scrollHeight);
	}, [messages]);

	useEffect(() => {
		if (!isOpen) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		clickListenerTimeoutRef.current = setTimeout(() => {
			window.addEventListener("mousedown", handleClick);
			clickListenerTimeoutRef.current = null;
		}, 0);

		return () => {
			if (clickListenerTimeoutRef.current !== null) {
				clearTimeout(clickListenerTimeoutRef.current);
				clickListenerTimeoutRef.current = null;
			}
			window.removeEventListener("mousedown", handleClick);
		};
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
		const text = input.trim();
		setInput("");
		await sendMessage(text);
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed bottom-6 right-6 z-[200] flex size-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl active:scale-95"
				aria-label={isOpen ? "Cerrar Drenyra" : "Preguntar a Drenyra"}
			>
				{isOpen ? <X size={20} /> : <Bot size={20} />}
			</button>

			{isOpen && (
				<div
					ref={panelRef}
					className="fixed bottom-20 right-6 z-[200] flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--color-stroke-3)] bg-[var(--color-bg-0)] shadow-2xl"
				>
					<header className="flex items-center justify-between border-b border-[var(--color-stroke-2)] px-4 py-3">
						<div className="flex items-center gap-2">
							<Bot size={18} className="text-[var(--color-primary)]" />
							<span className="text-sm font-semibold text-[var(--color-text-primary)]">
								Ask Drenyra
							</span>
						</div>
						<button
							onClick={() => setIsOpen(false)}
							className="rounded-lg p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
						>
							<X size={16} />
						</button>
					</header>

					<div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
						{messages.length === 0 && (
							<div className="flex h-full items-center justify-center">
								<p className="text-sm text-[var(--color-text-muted)]">
									Preguntale a Drenyra sobre finanzas, compliance,
									operaciones...
								</p>
							</div>
						)}
						{messages.map((msg, i) => (
							<div
								key={i}
								className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
										msg.role === "user"
											? "bg-[var(--color-primary)] text-white"
											: msg.role === "tool"
												? "bg-amber-900/40 text-amber-300"
												: "bg-[var(--color-surface-2)] text-[var(--color-text-primary)]"
									}`}
								>
									{msg.content}
								</div>
							</div>
						))}
						{isLoading && (
							<div className="flex justify-start">
								<div className="rounded-xl bg-[var(--color-surface-2)] px-3 py-2">
									{streamingAgent ? (
										<p className="text-xs text-[var(--color-text-secondary)]">
											<span className="text-[var(--color-primary)]">
												{streamingAgent}
											</span>{" "}
											processing...
										</p>
									) : (
										<Loader2
											size={16}
											className="animate-spin text-[var(--color-text-secondary)]"
										/>
									)}
								</div>
							</div>
						)}
					</div>

					<form
						onSubmit={handleSubmit}
						className="border-t border-[var(--color-stroke-2)] p-3"
					>
						<div className="flex gap-2">
							<input
								aria-label="Mensaje para Drenyra"
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Escribí tu consulta..."
								disabled={isLoading}
								className="flex-1 rounded-lg border border-[var(--color-stroke-3)] bg-[var(--color-surface-1)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
							/>
							<button
								type="submit"
								disabled={!input.trim() || isLoading}
								className="rounded-lg bg-[var(--color-primary)] p-2 text-white hover:brightness-110 disabled:opacity-50"
							>
								<Send size={16} />
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
}
