"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	COMMAND_PALETTE_COMMANDS,
	CATEGORY_CONFIG,
} from "./CommandPalette.data";
import type { PaletteCommand, CommandCategory } from "./CommandPalette.types";
import { usePaletteKeyboard } from "./CommandPalette.hooks";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
	const [filterText, setFilterText] = useState("");
	const [recentIds, setRecentIds] = useState<string[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when opened
	useEffect(() => {
		if (isOpen) {
			setFilterText("");
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	// Filter commands
	const filtered = useMemo(() => {
		if (!filterText.trim()) {
			// Show recent + all categorized
			return COMMAND_PALETTE_COMMANDS;
		}
		const q = filterText.toLowerCase();
		return COMMAND_PALETTE_COMMANDS.filter(
			(cmd) =>
				cmd.label.toLowerCase().includes(q) ||
				cmd.description?.toLowerCase().includes(q) ||
				cmd.keywords?.some((k) => k.includes(q)),
		);
	}, [filterText]);

	// Group by category
	const grouped = useMemo(() => {
		const groups = new Map<CommandCategory, PaletteCommand[]>();
		for (const cmd of filtered) {
			const existing = groups.get(cmd.category) ?? [];
			existing.push(cmd);
			groups.set(cmd.category, existing);
		}
		return groups;
	}, [filtered]);

	// If we have recents and no filter, put them first
	const orderedCategories = useMemo(() => {
		const cats = Array.from(grouped.keys()).sort(
			(a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order,
		);
		// Promote "recent" to front if it has items and no filter
		if (!filterText.trim() && recentIds.length > 0) {
			const recentCmds = COMMAND_PALETTE_COMMANDS.filter((c) =>
				recentIds.includes(c.id),
			);
			if (recentCmds.length > 0) {
				return [
					"recent" as CommandCategory,
					...cats.filter((c) => c !== "recent"),
				];
			}
		}
		return cats;
	}, [grouped, filterText, recentIds]);

	// Flatten for keyboard navigation
	const flatCommands = useMemo(
		() => orderedCategories.flatMap((cat) => grouped.get(cat) ?? []),
		[orderedCategories, grouped],
	);

	const handleSelect = (index: number) => {
		const cmd = flatCommands[index];
		if (!cmd) return;
		// Add to recents
		setRecentIds((prev) => {
			const next = [cmd.id, ...prev.filter((id) => id !== cmd.id)];
			return next.slice(0, 5);
		});
		cmd.action();
		onClose();
	};

	const { selectedIndex } = usePaletteKeyboard({
		isOpen,
		filteredCount: flatCommands.length,
		onSelect: handleSelect,
		onClose,
	});

	if (!isOpen) return null;

	// Flattened index map for keyboard nav
	const flatIndexMap = new Map<
		number,
		{ cmd: PaletteCommand; cat: CommandCategory }
	>();
	let flatIdx = 0;
	for (const cat of orderedCategories) {
		for (const cmd of grouped.get(cat) ?? []) {
			flatIndexMap.set(flatIdx, { cmd, cat });
			flatIdx++;
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
		>
			<div className="absolute inset-0 bg-black/40" aria-hidden="true" />
			<div
				className="relative w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
				role="document"
			>
				{/* Search input */}
				<div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
					<Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
					<input
						ref={inputRef}
						type="text"
						placeholder="Buscar comandos..."
						className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
						aria-label="Buscar comando"
						value={filterText}
						onChange={(e) => setFilterText(e.target.value)}
					/>
				</div>

				{/* Results */}
				<div className="max-h-[50vh] overflow-y-auto p-2">
					{flatCommands.length === 0 && (
						<div className="py-8 text-center text-sm text-[var(--text-muted)]">
							No commands match &quot;{filterText}&quot;
						</div>
					)}

					{orderedCategories.map((cat) => {
						const items = grouped.get(cat) ?? [];
						if (items.length === 0) return null;

						return (
							<div key={cat} className="mb-2">
								<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
									{CATEGORY_CONFIG[cat]?.label ?? cat}
								</div>
								{items.map((cmd) => {
									const globalIdx = flatCommands.indexOf(cmd);
									const isSelected = globalIdx === selectedIndex;

									return (
										<button
											key={cmd.id}
											type="button"
											className={cn(
												"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
												isSelected
													? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
													: "text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
											)}
											onClick={() => handleSelect(globalIdx)}
										>
											<cmd.icon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
											<div className="flex-1 text-left">
												<div className="text-sm font-medium">{cmd.label}</div>
												{cmd.description && (
													<div className="text-[11px] text-[var(--text-muted)]">
														{cmd.description}
													</div>
												)}
											</div>
											{cmd.shortcut && (
												<kbd className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
													{cmd.shortcut}
												</kbd>
											)}
										</button>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
