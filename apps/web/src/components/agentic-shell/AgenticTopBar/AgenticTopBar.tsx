import type { FC } from "react";
import type { AgenticTopBarProps } from "./AgenticTopBar.types";

export const AgenticTopBar: FC<AgenticTopBarProps> = ({
	onMenuToggle,
	isMenuOpen,
}) => {
	return (
		<header className="flex h-12 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 xl:hidden">
			<button
				type="button"
				className="rounded p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
				onClick={onMenuToggle}
				aria-label={isMenuOpen ? "Close menu" : "Open menu"}
			>
				{isMenuOpen ? "✕" : "☰"}
			</button>
			<span className="text-sm font-medium">Drenyra</span>
			<div className="w-8" />
		</header>
	);
};
