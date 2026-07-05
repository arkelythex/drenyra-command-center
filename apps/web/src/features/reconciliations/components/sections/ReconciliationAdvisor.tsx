import { AlertCircle, ArrowRight } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion-primitives";

interface ReconciliationAdvisorProps {
	onIgnore: () => void;
	onSave: () => void;
}

export const ReconciliationAdvisor: React.FC<ReconciliationAdvisorProps> = ({
	onIgnore,
	onSave,
}) => {
	return (
		<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
			<MotionDiv
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				className="group relative"
			>
				<Card className="border-border/60 bg-card p-4 shadow-lg">
					<div className="flex items-center gap-5">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-warning/20 bg-warning/10 text-warning">
							<AlertCircle size={20} strokeWidth={2.25} />
						</div>

						<div className="flex-1 min-w-0">
							<h4 className="mb-1 text-sm font-semibold tracking-tight text-foreground">
								Movimiento sin registro contable
							</h4>
							<p className="text-sm leading-relaxed text-foreground/80">
								Hay un cargo de{" "}
								<strong className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
									S/ 50.00
								</strong>{" "}
								en el extracto que aún no figura en el libro auxiliar.
							</p>
						</div>

						<div className="flex items-center gap-3 shrink-0">
							<Button
								variant="ghost"
								size="sm"
								onClick={onIgnore}
								className="h-9 rounded-lg px-4 text-label font-medium tracking-wide text-muted-foreground"
							>
								Omitir
							</Button>
							<Button
								size="sm"
								onClick={onSave}
								className="h-9 rounded-lg px-5 text-label font-semibold tracking-wide shadow-sm"
							>
								Crear asiento{" "}
								<ArrowRight size={12} className="ml-2" strokeWidth={2.5} />
							</Button>
						</div>
					</div>
				</Card>
			</MotionDiv>
		</div>
	);
};
