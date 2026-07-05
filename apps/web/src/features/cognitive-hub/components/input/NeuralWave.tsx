import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NeuralWaveProps {
	amplitude: number[];
	isActive: boolean;
}

/**
 * NeuralWave: Visualización modular de la forma de la voz.
 * Binary Elite 2026 - Liquid Metal Style.
 */
export const NeuralWave = ({ amplitude, isActive }: NeuralWaveProps) => {
	return (
		<div className="flex items-center justify-center gap-1 h-8 px-4">
			{amplitude.map((val, i) => (
				<motion.div
					key={i}
					initial={{ height: 2 }}
					animate={{
						height: isActive ? `${Math.max(2, val)}%` : 2,
						opacity: isActive ? 1 : 0.2,
					}}
					transition={{ type: "spring", damping: 15, stiffness: 300 }}
					className={cn(
						"w-1 rounded-full bg-foreground transition-colors duration-500",
						isActive && "shadow-glow shadow-white/20",
					)}
				/>
			))}
		</div>
	);
};
