/**
 * InlineAutocomplete — Menú flotante pegado al cursor del input.
 *
 * Cuando el usuario escribe @ o /, detecta el trigger y la query parcial,
 * y muestra un menú de opciones filtradas justo debajo del cursor.
 * Al seleccionar, reemplaza el texto trigger+query por el insertValue
 * estructurado con IDs explícitos.
 *
 * @since Jul 2026
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AutocompleteItem } from "./InlineAutocomplete.data";
import { filterItems } from "./InlineAutocomplete.data";

// ── Props ────────────────────────────────────────────────────────────────────

export interface InlineAutocompleteProps {
	/** El valor actual del input */
	inputValue: string;
	/** Posición del cursor (selectionStart o caret) */
	cursorPos: number;
	/** Callback para reemplazar el texto del input */
	onInsert: (insertValue: string, cursorTarget: number) => void;
	/** Callback para cerrar el menú */
	onClose: () => void;
}

// ── State ────────────────────────────────────────────────────────────────────

interface AutocompleteState {
	trigger: "@" | "/";
	query: string;
	startPos: number;
	items: AutocompleteItem[];
}

// ── Hook: detectar trigger y query ──────────────────────────────────────────

function useAutocompleteState(
	inputValue: string,
	cursorPos: number,
): AutocompleteState | null {
	return useMemo(() => {
		// Mirar hacia atrás desde el cursor para encontrar @ o /
		const before = inputValue.slice(0, cursorPos);
		const lastAtIndex = before.lastIndexOf("@");
		const lastSlashIndex = before.lastIndexOf("/");

		// Ignorar si ya hay un espacio después del trigger (palabra completada)
		const triggerPos = Math.max(lastAtIndex, lastSlashIndex);
		if (triggerPos === -1) return null;

		// Verificar que el trigger sea el último token (separado por espacio)
		const afterTrigger = before.slice(triggerPos);
		if (afterTrigger.includes(" ")) return null;

		const trigger = before[triggerPos] as "@" | "/";
		const query = afterTrigger.slice(1); // texto después de @ o /

		// No mostrar menú si el trigger está aislado sin nada después
		// pero sí mostrar si está vacío (recién tipeado)
		const items = filterItems(trigger, query);

		if (items.length === 0) return null;

		return { trigger, query, startPos: triggerPos, items };
	}, [inputValue, cursorPos]);
}

// ── Component ────────────────────────────────────────────────────────────────

export function InlineAutocomplete({
	inputValue,
	cursorPos,
	onInsert,
	onClose,
}: InlineAutocompleteProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const listRef = useRef<HTMLDivElement>(null);
	const autocompleteState = useAutocompleteState(inputValue, cursorPos);

	// ── Keyboard handler (Arrow keys + Enter) ──

	const handleKeyDown = useCallback(
		(e: KeyboardEvent): boolean => {
			if (!autocompleteState) return false;

			switch (e.key) {
				case "ArrowDown": {
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev < autocompleteState.items.length - 1 ? prev + 1 : 0,
					);
					return true;
				}
				case "ArrowUp": {
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev > 0 ? prev - 1 : autocompleteState.items.length - 1,
					);
					return true;
				}
				case "Enter":
				case "Tab": {
					e.preventDefault();
					const selected = autocompleteState.items[selectedIndex];
					if (selected) {
						// Reemplazar desde startPos hasta cursor con el insertValue
						onInsert(
							selected.insertValue,
							autocompleteState.startPos + selected.insertValue.length,
						);
					}
					return true;
				}
				case "Escape": {
					e.preventDefault();
					onClose();
					return true;
				}
			}
			return false;
		},
		[autocompleteState, selectedIndex, onInsert, onClose],
	);

	// Register global keyboard listener when open
	useEffect(() => {
		if (!autocompleteState) return;
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [autocompleteState, handleKeyDown]);

	// Reset selected index when items change
	useEffect(() => {
		setSelectedIndex(0);
	}, [autocompleteState?.items.length]);

	// Scroll selected into view
	useEffect(() => {
		if (!listRef.current) return;
		const selected = listRef.current.children[selectedIndex] as HTMLElement;
		if (selected) {
			selected.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	if (!autocompleteState) return null;

	const { trigger, query, items } = autocompleteState;

	return (
		<div
			className="absolute bottom-full left-0 right-0 z-50 mx-2 mb-2"
			role="listbox"
			aria-label={
				trigger === "@" ? "Referencias fiscales" : "Comandos fiscales"
			}
		>
			<div
				ref={listRef}
				className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1 shadow-xl"
			>
				{/* Header */}
				<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
					{trigger === "@"
						? `Referencias (${query || "todas"})`
						: `Comandos (${query || "todos"})`}
				</div>

				{items.map((item, index) => (
					<button
						key={`${item.trigger}:${item.label}`}
						type="button"
						role="option"
						aria-selected={index === selectedIndex}
						className={cn(
							"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
							index === selectedIndex
								? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
								: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
						)}
						onClick={() => {
							onInsert(
								item.insertValue,
								autocompleteState.startPos + item.insertValue.length,
							);
						}}
						onMouseEnter={() => setSelectedIndex(index)}
					>
						<span className="font-mono font-medium shrink-0">
							{item.trigger}
							{item.label}
						</span>
						<span
							className={cn(
								"flex-1 truncate",
								index === selectedIndex
									? "text-[var(--color-primary)]/70"
									: "text-[var(--text-muted)]",
							)}
						>
							{item.description}
						</span>
						{/* Tag visual */}
						<span
							className={cn(
								"shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase",
								item.category === "reference" &&
									"bg-[var(--color-info)]/10 text-[var(--color-info)]",
								item.category === "command" &&
									"bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
							)}
						>
							{item.trigger}
							{item.category === "reference" ? "ref" : "cmd"}
						</span>
					</button>
				))}

				{/* Footer hint */}
				<div className="border-t border-[var(--border-subtle)] mt-1 px-2 pt-1 pb-0.5 text-[10px] text-[var(--text-tertiary)]">
					Tab/Enter para insertar · Esc para cerrar · ↑↓ para navegar
				</div>
			</div>
		</div>
	);
}

export { useAutocompleteState };
export type { AutocompleteState };
