import { type FC, useCallback, useState } from "react";
import { COMMAND_CATEGORIES } from "./CommandPalette.data";
import { useCommandPalette, usePaletteKeyboard } from "./CommandPalette.hooks";
import type { CommandPaletteProps } from "./CommandPalette.types";

export const CommandPalette: FC<CommandPaletteProps> = ({
	isOpen,
	onClose,
	registry = COMMAND_CATEGORIES,
}) => {
	const { query, setQuery, filtered, selectedIndex, execute, onKeyDown } =
		useCommandPalette(isOpen, onClose, registry);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
		>
			<div className="fixed inset-0 bg-black/50" />
			<div
				className="relative w-full max-w-xl rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={onKeyDown}
			>
				<div className="flex items-center border-b border-[var(--border-subtle)] px-4">
					<span className="mr-2 text-[var(--text-tertiary)]">⌘</span>
					<input
						autoFocus
						className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-tertiary)]"
						placeholder="Buscar comandos, rutas, acciones..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
				<div className="max-h-[60vh] overflow-y-auto p-2">
					{filtered.map((category) => (
						<div key={category.id}>
							<div className="px-2 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
								{category.label}
							</div>
							{category.commands.map((cmd, i) => {
								const flatIndex = filtered
									.flatMap((c) => c.commands)
									.indexOf(cmd);
								return (
									<button
										key={cmd.id}
										className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
											flatIndex === selectedIndex
												? "bg-[var(--accent-bg)] text-[var(--accent-text)]"
												: "hover:bg-[var(--surface-2)]"
										}`}
										onClick={() => execute(cmd)}
										type="button"
									>
										<div className="flex-1">
											<div className="font-medium">{cmd.label}</div>
											<div className="text-xs text-[var(--text-tertiary)]">
												{cmd.description}
											</div>
										</div>
										<span className="text-xs text-[var(--text-tertiary)]">
											{cmd.category === "navigation" ? "→" : "↵"}
										</span>
									</button>
								);
							})}
						</div>
					))}
					{filtered.length === 0 && (
						<div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
							Sin resultados para "{query}"
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
