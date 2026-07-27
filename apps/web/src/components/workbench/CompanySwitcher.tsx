import { useState, useRef, useEffect, useCallback } from "react";
import { Building2, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyRef } from "@drenyra/domain";

interface CompanySwitcherProps {
	companies: CompanyRef[];
	activeCompany: CompanyRef | null;
	onSelect: (company: CompanyRef) => void;
	compact?: boolean;
}

/**
 * CompanySwitcher — searchable company dropdown.
 *
 * Shows current company with RUC. Dropdown includes search input.
 * Keyboard: ↑↓ arrows, Enter to select, Esc to close.
 */
export function CompanySwitcher({
	companies,
	activeCompany,
	onSelect,
	compact = false,
}: CompanySwitcherProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const filtered = query
		? companies.filter(
				(c) =>
					c.name.toLowerCase().includes(query.toLowerCase()) ||
					c.ruc.includes(query),
			)
		: companies;

	// Reset selected index when filtered list changes
	useEffect(() => {
		setSelectedIndex(0);
	}, [filtered.length]);

	// Close on click outside
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
				setQuery("");
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	// Focus search input when opening
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((i) => Math.max(i - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (filtered[selectedIndex]) {
						onSelect(filtered[selectedIndex]);
						setIsOpen(false);
						setQuery("");
					}
					break;
				case "Escape":
					setIsOpen(false);
					setQuery("");
					break;
			}
		},
		[filtered, selectedIndex, onSelect],
	);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-2)]",
					compact ? "text-xs" : "text-sm",
				)}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
			>
				<Building2 size={14} className="text-[var(--text-muted)] shrink-0" />
				<span className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
					{activeCompany?.name ?? "Seleccionar empresa"}
				</span>
				{activeCompany && (
					<span className="text-[var(--text-muted)] text-xs hidden sm:inline">
						RUC {activeCompany.ruc}
					</span>
				)}
				<ChevronDown
					size={12}
					className={cn(
						"text-[var(--text-muted)] transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{isOpen && (
				<div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-lg">
					<div className="border-b border-[var(--border-subtle)] p-2">
						<div className="flex items-center gap-2 rounded-md bg-[var(--surface-2)] px-2 py-1.5">
							<Search size={14} className="text-[var(--text-muted)] shrink-0" />
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Buscar empresa..."
								className="w-full bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
								aria-label="Buscar empresa"
							/>
						</div>
					</div>

					<ul
						role="listbox"
						className="max-h-[240px] overflow-y-auto p-1"
						aria-label="Empresas disponibles"
					>
						{filtered.length === 0 ? (
							<li className="px-2 py-3 text-center text-xs text-[var(--text-muted)]">
								No se encontraron empresas
							</li>
						) : (
							filtered.map((company, index) => (
								<li
									key={company.id}
									role="option"
									aria-selected={index === selectedIndex}
								>
									<button
										type="button"
										className={cn(
											"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors",
											index === selectedIndex && "bg-[var(--surface-2)]",
											activeCompany?.id === company.id &&
												"text-[var(--color-primary)]",
											"hover:bg-[var(--surface-2)]",
										)}
										onClick={() => {
											onSelect(company);
											setIsOpen(false);
											setQuery("");
										}}
										onMouseEnter={() => setSelectedIndex(index)}
									>
										<Building2
											size={14}
											className="text-[var(--text-muted)] shrink-0"
										/>
										<div className="min-w-0 flex-1">
											<div className="truncate font-medium text-[var(--text-primary)]">
												{company.name}
											</div>
											<div className="truncate text-[10px] text-[var(--text-muted)]">
												RUC {company.ruc}
											</div>
										</div>
										{activeCompany?.id === company.id && (
											<span className="text-[10px] font-semibold text-[var(--color-primary)]">
												Activo
											</span>
										)}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
