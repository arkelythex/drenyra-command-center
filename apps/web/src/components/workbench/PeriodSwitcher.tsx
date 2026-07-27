import { useState, useRef, useEffect } from "react";
import {
	CalendarDays,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PeriodRef } from "@drenyra/domain";
import { createPeriodRef } from "@drenyra/domain";

interface PeriodSwitcherProps {
	activePeriod: PeriodRef | null;
	onSelect: (period: PeriodRef) => void;
}

const MONTHS = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
];

/**
 * PeriodSwitcher — month/year selector with grid navigation.
 * Shows months in a grid. Navigate by year with arrows.
 */
export function PeriodSwitcher({
	activePeriod,
	onSelect,
}: PeriodSwitcherProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [viewYear, setViewYear] = useState(
		activePeriod?.year ?? new Date().getFullYear(),
	);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	useEffect(() => {
		if (activePeriod) setViewYear(activePeriod.year);
	}, [activePeriod]);

	const handleSelect = (month: number) => {
		onSelect(createPeriodRef(viewYear, month));
		setIsOpen(false);
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface-2)]"
				aria-haspopup="dialog"
				aria-expanded={isOpen}
			>
				<CalendarDays size={14} className="text-[var(--text-muted)] shrink-0" />
				<span className="font-medium text-[var(--text-primary)]">
					{activePeriod?.label ?? "Seleccionar período"}
				</span>
				<ChevronDown
					size={12}
					className={cn(
						"text-[var(--text-muted)] transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{isOpen && (
				<div className="absolute left-0 top-full z-50 mt-1 w-[280px] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-lg">
					{/* Year navigation */}
					<div className="mb-3 flex items-center justify-between">
						<button
							type="button"
							onClick={() => setViewYear((y) => y - 1)}
							className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
							aria-label="Año anterior"
						>
							<ChevronLeft size={16} />
						</button>
						<span className="text-sm font-semibold text-[var(--text-primary)]">
							{viewYear}
						</span>
						<button
							type="button"
							onClick={() => setViewYear((y) => y + 1)}
							className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
							aria-label="Año siguiente"
						>
							<ChevronRight size={16} />
						</button>
					</div>

					{/* Month grid */}
					<div className="grid grid-cols-3 gap-1">
						{MONTHS.map((month, i) => {
							const monthNum = i + 1;
							const isActive =
								activePeriod?.year === viewYear &&
								activePeriod?.month === monthNum;
							const isCurrent =
								viewYear === new Date().getFullYear() &&
								monthNum === new Date().getMonth() + 1;

							return (
								<button
									key={monthNum}
									type="button"
									onClick={() => handleSelect(monthNum)}
									className={cn(
										"rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
										isActive
											? "bg-[var(--color-primary)] text-white"
											: "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
										isCurrent &&
											!isActive &&
											"ring-1 ring-[var(--border-subtle)]",
									)}
								>
									{month.slice(0, 3)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
