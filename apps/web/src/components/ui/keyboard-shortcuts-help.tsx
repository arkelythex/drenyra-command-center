"use client";

import { Keyboard } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	type KeyboardShortcut,
	useKeyboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
	children?: ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	hideTrigger?: boolean;
}

export function KeyboardShortcutsHelp({
	children,
	open,
	onOpenChange,
	hideTrigger = false,
}: KeyboardShortcutsHelpProps): React.JSX.Element {
	const [internalOpen, setInternalOpen] = useState(false);
	const { getAllShortcuts, getShortcutsByCategory } = useKeyboardShortcuts();

	const isControlled = typeof open === "boolean";
	const isOpen = isControlled ? open : internalOpen;
	const setIsOpen = useMemo(
		() => (nextOpen: boolean) => {
			if (!isControlled) {
				setInternalOpen(nextOpen);
			}
			onOpenChange?.(nextOpen);
		},
		[isControlled, onOpenChange],
	);

	const shortcuts = getAllShortcuts();
	const categories = [...new Set(shortcuts.map((s) => s.category))];

	const formatShortcut = (shortcut: KeyboardShortcut): string => {
		const parts: string[] = [];
		if (shortcut.ctrl) parts.push("Ctrl");
		if (shortcut.shift) parts.push("Shift");
		if (shortcut.alt) parts.push("Alt");
		if (shortcut.meta) parts.push("Cmd");
		parts.push(shortcut.key.toUpperCase());
		return parts.join(" + ");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{!hideTrigger ? (
				<DialogTrigger asChild>
					{children || (
						<Button variant="ghost" size="sm" className="gap-2">
							<Keyboard className="h-4 w-4" />
							<span className="hidden sm:inline">Atajos</span>
						</Button>
					)}
				</DialogTrigger>
			) : null}
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Keyboard className="h-5 w-5" />
						Atajos de Teclado
					</DialogTitle>
					<DialogDescription>
						Referencia rápida de acciones globales para navegar y operar Drenyra
						con menor fricción.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{categories.map((category) => {
						const categoryShortcuts = getShortcutsByCategory(category);
						if (categoryShortcuts.length === 0) return null;

						return (
							<Card key={category}>
								<CardHeader>
									<CardTitle className="text-lg">{category}</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid gap-3">
										{categoryShortcuts.map((shortcut, index) => (
											<div
												key={shortcut.description + shortcut.key + index}
												className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
											>
												<span className="text-sm font-medium">
													{shortcut.description}
												</span>
												<Badge
													variant="secondary"
													className="font-mono text-xs"
												>
													{formatShortcut(shortcut)}
												</Badge>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>

				<div className="mt-6 p-4 bg-muted/30 rounded-lg">
					<p className="text-sm text-muted-foreground">
						💡 <strong>Pro tip:</strong> Mantén presionado Ctrl (o Cmd en Mac)
						para activar la mayoría de los atajos.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
