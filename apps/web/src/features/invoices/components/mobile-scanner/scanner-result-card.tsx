import { CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ScanResult } from "./mobile-scanner.types";

interface ScannerResultCardProps {
	scanResult: ScanResult;
	onRetry: () => void;
	onConfirm: () => void;
}

export const ScannerResultCard = ({
	scanResult,
	onRetry,
	onConfirm,
}: ScannerResultCardProps) => (
	<div className="absolute inset-0 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm">
		<Card className="w-full max-w-md border-border/60 bg-card/95 p-6 text-foreground shadow-xl backdrop-blur-sm">
			<div className="mb-4 flex items-center gap-2">
				<CheckCircle className="h-6 w-6 text-[var(--text-success)]" />
				<h3 className="text-lg font-semibold">Factura Escaneada</h3>
			</div>

			<div className="mb-6 space-y-3">
				<div>
					<p className="text-sm text-muted-foreground">Número de Factura</p>
					<p className="font-mono font-semibold">{scanResult.invoiceNumber}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Proveedor</p>
					<p className="font-semibold">{scanResult.vendor}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Monto</p>
					<p className="text-lg font-semibold">
						S/ {scanResult.amount.toLocaleString()}
					</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Fecha</p>
					<p className="font-semibold">{scanResult.date}</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Confianza OCR</p>
					<p
						className={cn(
							"font-semibold",
							scanResult.confidence >= 95
								? "text-[var(--text-success)]"
								: scanResult.confidence >= 85
									? "text-[var(--text-warning)]"
									: "text-[var(--text-danger)]",
						)}
					>
						{scanResult.confidence}%
					</p>
				</div>
			</div>

			<div className="flex gap-2">
				<Button variant="outline" onClick={onRetry} className="flex-1">
					<RotateCcw className="mr-2 h-4 w-4" />
					Reintentar
				</Button>
				<Button onClick={onConfirm} className="flex-1">
					<CheckCircle className="mr-2 h-4 w-4" />
					Confirmar
				</Button>
			</div>
		</Card>
	</div>
);
