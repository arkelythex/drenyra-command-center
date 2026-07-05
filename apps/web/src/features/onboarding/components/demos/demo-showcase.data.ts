import { AlertTriangle, BrainCircuit, ShieldCheck } from "lucide-react";
import type { DemoCard } from "./demo-showcase.types";

export const DEMO_CARDS: DemoCard[] = [
	{
		id: "igv-error",
		title: "Evité una multa de S/ 15,000",
		tagline:
			"IGV al 19% detectado antes de declarar. Corregido en 37 segundos.",
		category: "IGV",
		amountSaved: 15_000,
		resolutionTimeSeconds: 37,
		icon: AlertTriangle,
		accentColor: "text-amber-400",
	},
	{
		id: "sire-auto",
		title: "SIRE en piloto automático",
		tagline: "47 comprobantes de enero listos para SUNAT en 11 segundos.",
		category: "SIRE",
		amountSaved: 0,
		resolutionTimeSeconds: 11,
		icon: BrainCircuit,
		accentColor: "text-[var(--premium-success)]",
	},
	{
		id: "detraccion-omitida",
		title: "Detracción omitida: S/ 8,400 rescatados",
		tagline: "SPOT 12% detectado antes de perder el crédito fiscal.",
		category: "SPOT",
		amountSaved: 16_800,
		resolutionTimeSeconds: 23,
		icon: ShieldCheck,
		accentColor: "text-[var(--premium-action-cyan)]",
	},
];
