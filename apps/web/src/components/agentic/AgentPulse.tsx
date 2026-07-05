import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AgentPulseProps {
	status: "idle" | "active" | "success" | "error";
	size?: "sm" | "md" | "lg";
	className?: string;
}

export const AgentPulse = ({
	status,
	size = "md",
	className,
}: AgentPulseProps) => {
	const colors = {
		idle: "bg-muted-foreground/30",
		active: "bg-primary shadow-glow",
		success: "bg-success shadow-success-glow",
		error: "bg-destructive shadow-[0_0_15px_var(--color-destructive)]",
	};

	const sizes = {
		sm: "h-1.5 w-1.5",
		md: "h-2 w-2",
		lg: "h-3 w-3",
	};

	return (
		<div className={cn("relative flex items-center justify-center", className)}>
			{status === "active" && (
				<motion.div
					animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
					transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
					className={cn("absolute rounded-full", sizes[size], colors[status])}
				/>
			)}
			<div
				className={cn(
					"rounded-full transition-colors duration-500",
					sizes[size],
					colors[status],
				)}
			/>
		</div>
	);
};
