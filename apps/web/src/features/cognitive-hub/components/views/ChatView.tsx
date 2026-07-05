import { Bot, MessageSquare, Sparkles, User } from "lucide-react";

export const ChatView = () => {
	return (
		<div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
			{/* EJEMPLO DE DIÁLOGO (MOCK) */}
			<div className="flex flex-col gap-6">
				<div className="flex gap-4">
					<div className="h-8 w-8 rounded-lg bg-muted/70 flex items-center justify-center shrink-0 border border-border/80">
						<User size={16} className="text-muted-foreground" />
					</div>
					<p className="text-sm text-foreground/80 leading-relaxed pt-1">
						¿Cómo está mi ratio de liquidez para el cierre de febrero?
					</p>
				</div>

				<div className="flex gap-4">
					<div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
						<Sparkles size={16} className="text-primary" />
					</div>
					<div className="flex flex-col gap-2 pt-1">
						<span className="text-2xs font-black uppercase text-primary tracking-widest">
							Respuesta Enjambre
						</span>
						<p className="text-sm text-foreground leading-relaxed rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 shadow-inner">
							Tu ratio de liquidez actual es de **1.45**. Esto es un 12%
							superior al mes pasado. Sin embargo, detecto un pago de detracción
							de **S/ 12,400** programado para el día 20 que podría estresar tu
							flujo de caja.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
