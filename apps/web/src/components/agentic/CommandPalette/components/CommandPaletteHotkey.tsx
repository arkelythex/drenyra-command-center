import type { ReactNode } from "react";

interface CommandPaletteHotkeyProps {
	keys: string[];
	children?: ReactNode;
}

export function CommandPaletteHotkey({
	keys,
	children,
}: CommandPaletteHotkeyProps) {
	return (
		<kbd
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 2,
				marginLeft: "auto",
				padding: "2px 6px",
				fontSize: "var(--text-xs)",
				fontFamily: "inherit",
				borderRadius: 4,
				background: "var(--surface-2)",
				color: "var(--text-tertiary)",
				border: "1px solid var(--border-subtle)",
				lineHeight: 1.4,
			}}
		>
			{keys.map((key, i) => (
				<span key={i}>
					{i > 0 && <span style={{ marginRight: 2 }}>+</span>}
					{key}
				</span>
			))}
			{children}
		</kbd>
	);
}
