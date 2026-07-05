"use client";

import { Check, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn, n } from "@/lib/utils";
import type { EditableCellProps } from "./types";

export function EditableCell({
	value,
	type = "text",
	onSave,
}: EditableCellProps) {
	const [editing, setEditing] = useState(false);
	const [editValue, setEditValue] = useState(
		type === "money" && typeof value === "number"
			? value.toFixed(2)
			: String(value),
	);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [editing]);

	const handleSave = useCallback(() => {
		onSave(editValue);
		setEditing(false);
	}, [editValue, onSave]);

	const handleCancel = useCallback(() => {
		setEditValue(
			type === "money" && typeof value === "number"
				? value.toFixed(2)
				: String(value),
		);
		setEditing(false);
	}, [value, type]);

	if (editing) {
		return (
			<span className="inline-flex items-center gap-1">
				<input
					ref={inputRef}
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onBlur={handleSave}
					aria-label="Editar celda"
					onKeyDown={(e) => {
						if (e.key === "Enter") handleSave();
						if (e.key === "Escape") handleCancel();
					}}
					className={cn(
						"w-full rounded border border-[var(--border-default)] bg-[var(--surface-2)] px-1.5 py-1 text-xs outline-none",
						type === "money" && "text-right font-mono",
					)}
				/>
				<button
					onClick={handleSave}
					className="shrink-0 rounded p-0.5 text-[var(--color-success)] hover:bg-[var(--color-success)]/10"
				>
					<Check size={12} />
				</button>
				<button
					onClick={handleCancel}
					className="shrink-0 rounded p-0.5 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
				>
					<X size={12} />
				</button>
			</span>
		);
	}

	return (
		<span
			onClick={() => setEditing(true)}
			className={cn(
				"group cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-[var(--color-primary)]/5",
				type === "money" && "inline-flex items-center gap-1",
			)}
		>
			{type === "money" && typeof value === "number" ? (
				<>
					<span className="font-mono font-black text-sm tracking-tighter tabular-nums">
						{value === 0 ? "—" : n(value as number)}
					</span>
					<Pencil
						size={10}
						className="shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</>
			) : (
				<>
					<span>{value}</span>
					<Pencil
						size={10}
						className="ml-1 inline shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
					/>
				</>
			)}
		</span>
	);
}
