import { AnimatePresence, motion } from "framer-motion";
import { Fingerprint, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface DigitalSignaturePadProps {
	onConfirm: () => void;
	onCancel: () => void;
	title?: string;
}

export const DigitalSignaturePad = ({
	onConfirm,
	onCancel,
	title = "Autorización de Soberanía",
}: DigitalSignaturePadProps) => {
	const [_isSigning, _setIsSigning] = useState(false);
	const [progress, setProgress] = useState(0);
	const [status, setStatus] = useState<
		"idle" | "scanning" | "verifying" | "success"
	>("idle");

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const startScan = () => {
		setStatus("scanning");
		setProgress(0);
		timerRef.current = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(timerRef.current!);
					verifySignature();
					return 100;
				}
				return prev + 2;
			});
		}, 30);
	};

	const verifySignature = () => {
		setStatus("verifying");
		setTimeout(() => {
			setStatus("success");
			setTimeout(() => {
				onConfirm();
			}, 1000);
		}, 1500);
	};

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="absolute inset-0 bg-background/75 "
				onClick={onCancel}
			/>

			<motion.div
				initial={{ opacity: 0, scale: 0.9, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.9, y: 20 }}
				className={cn(
					tokensToClasses.borderRadius("modal"),
					"relative w-full max-w-md overflow-hidden border border-border bg-card/95 shadow-[0_0_60px_rgba(0,0,0,0.28)]",
				)}
			>
				<div className="p-8 border-b border-border/80 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Lock size={16} className="text-amber-500" />
						<span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
							{title}
						</span>
					</div>
					<button
						type="button"
						onClick={onCancel}
						className="text-muted-foreground/60 transition-colors hover:text-foreground"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-10 flex flex-col items-center text-center space-y-8">
					<div className="relative h-32 w-32 flex items-center justify-center">
						{/* Animated Rings */}
						<AnimatePresence>
							{status === "scanning" && (
								<motion.div
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1.2, opacity: 0.2 }}
									exit={{ scale: 1.5, opacity: 0 }}
									transition={{ repeat: Infinity, duration: 2 }}
									className="absolute inset-0 rounded-full border-2 border-amber-500"
								/>
							)}
						</AnimatePresence>

						<div
							className={cn(
								"flex h-24 w-24 items-center justify-center rounded-full border-2 transition-[background-color,border-color,color,box-shadow,transform] duration-300",
								status === "idle" &&
									"bg-muted/30 border-border text-muted-foreground/50",
								status === "scanning" &&
									"bg-amber-500/10 border-amber-500/50 text-amber-500",
								status === "verifying" &&
									"bg-[rgba(var(--premium-info-rgb),0.10)] border-[rgba(var(--premium-info-rgb),0.50)] text-[var(--premium-action-cyan)]",
								status === "success" &&
									"bg-[rgba(var(--premium-success-rgb),0.20)] border-[rgba(var(--premium-success-rgb),0.50)] text-[var(--premium-success)] shadow-[0_0_30px_rgba(var(--premium-success-rgb),0.2)]",
							)}
						>
							{status === "idle" && <Fingerprint size={48} strokeWidth={1.5} />}
							{status === "scanning" && (
								<Fingerprint
									size={48}
									strokeWidth={2}
									className="animate-pulse"
								/>
							)}
							{status === "verifying" && (
								<Loader2 size={48} className="animate-spin" />
							)}
							{status === "success" && (
								<ShieldCheck size={48} strokeWidth={2.5} />
							)}
						</div>

						{/* Progress Bar Circle */}
						{status === "scanning" && (
							<svg
								className="absolute inset-0 h-32 w-32 -rotate-90"
								aria-hidden="true"
							>
								<circle
									cx="64"
									cy="64"
									r="60"
									stroke="currentColor"
									strokeWidth="2"
									fill="transparent"
									className="text-amber-500/20"
								/>
								<motion.circle
									cx="64"
									cy="64"
									r="60"
									stroke="currentColor"
									strokeWidth="2"
									fill="transparent"
									strokeDasharray="377"
									strokeDashoffset={377 - (377 * progress) / 100}
									className="text-amber-500"
								/>
							</svg>
						)}
					</div>

					<div className="space-y-2">
						<h3 className="text-lg font-black uppercase tracking-tight text-foreground">
							{status === "idle" && "Requiere Identidad"}
							{status === "scanning" && "Escaneando Biometría"}
							{status === "verifying" && "Verificando Soberanía"}
							{status === "success" && "Acceso Autorizado"}
						</h3>
						<p className="mx-auto max-w-[240px] text-xs leading-relaxed text-muted-foreground">
							{status === "idle" &&
								"Mantenga presionado el sensor para autorizar el movimiento fiscal."}
							{status === "scanning" &&
								`Procesando hash neural... ${progress}%`}
							{status === "verifying" &&
								"Validando contra el núcleo de políticas ARKELYTHEX."}
							{status === "success" && "Firma digital estampada con éxito."}
						</p>
					</div>

					{status === "idle" && (
						<button
							type="button"
							onMouseDown={startScan}
							onTouchStart={startScan}
							className="w-full rounded-2xl bg-foreground py-4 text-label font-black uppercase tracking-[0.2em] text-background shadow-glow transition-[background-color,box-shadow,transform,opacity] hover:scale-[1.01] hover:bg-foreground/90 active:scale-95"
						>
							Iniciar Escaneo
						</button>
					)}
				</div>

				<div className="flex justify-center border-t border-border/80 bg-muted/20 px-8 py-4">
					<span className="text-[7px] font-mono uppercase tracking-[0.4em] text-muted-foreground/70">
						Arkelythex Sovereign Core v4.0
					</span>
				</div>
			</motion.div>
		</div>
	);
};
