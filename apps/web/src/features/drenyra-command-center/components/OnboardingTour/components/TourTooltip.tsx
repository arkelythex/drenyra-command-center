/**
 * TourTooltip — Step card with header, content, progress dots, and nav buttons
 */
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TourStep } from "../OnboardingTour.types";

interface TourTooltipProps {
	step: number;
	totalSteps: number;
	currentStep: TourStep;
	tooltipStyle: CSSProperties;
	fadeIn: boolean;
	isFirst: boolean;
	isLast: boolean;
	onNext: () => void;
	onPrev: () => void;
	onSkip: () => void;
	onGoTo: (index: number) => void;
}

export function TourTooltip({
	step,
	totalSteps,
	currentStep,
	tooltipStyle,
	fadeIn,
	isFirst,
	isLast,
	onNext,
	onPrev,
	onSkip,
	onGoTo,
}: TourTooltipProps) {
	return (
		<div
			className="fixed z-50"
			style={{
				...tooltipStyle,
				transition: "opacity 250ms ease, transform 250ms ease",
				opacity: fadeIn ? 1 : 0,
				transform: fadeIn
					? `${tooltipStyle.transform || "none"} translateY(0)`
					: `${tooltipStyle.transform || "none"} translateY(6px)`,
			}}
		>
			<div className="w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl backdrop-blur-xl overflow-hidden">
				{/* Header */}
				<div className="flex items-start justify-between px-4 pt-4 pb-2">
					<span className="inline-flex items-center justify-center rounded-full bg-[var(--color-info)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-info)]">
						{step + 1}/{totalSteps}
					</span>
					<button
						onClick={onSkip}
						className="rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
						aria-label="Saltar tour"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Content */}
				<div className="px-4 pb-4">
					<h3 className="text-sm font-bold text-[var(--text-primary)] mb-1.5 leading-snug">
						{currentStep.title}
					</h3>
					<p className="text-xs text-[var(--text-secondary)] leading-relaxed">
						{currentStep.description}
					</p>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3">
					{/* Progress dots */}
					<div className="flex items-center gap-1.5">
						{Array.from({ length: totalSteps }, (_, i) => (
							<button
								key={i}
								type="button"
								onClick={() => onGoTo(i)}
								className={`h-1.5 rounded-full transition-all ${
									i === step
										? "w-4 bg-[var(--color-info)]"
										: "w-1.5 bg-[var(--border-default)] hover:bg-[var(--text-tertiary)]"
								}`}
								aria-label={`Paso ${i + 1}`}
							/>
						))}
					</div>

					{/* Navigation */}
					<div className="flex items-center gap-1.5">
						{!isFirst && (
							<button
								onClick={onPrev}
								className="inline-flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
							>
								<ChevronLeft className="h-3 w-3 mr-0.5" />
								Anterior
							</button>
						)}

						<button
							onClick={onNext}
							className="inline-flex items-center justify-center rounded-lg bg-[var(--color-info)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-info)]/90"
						>
							{isLast ? "Finalizar" : "Siguiente"}
							{!isLast && <ChevronRight className="h-3 w-3 ml-0.5" />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
