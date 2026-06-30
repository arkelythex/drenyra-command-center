import { Mail, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SurfacePanel } from "@/components/ui/SurfacePanel";
import { useHaptics } from "@/hooks/useHaptics";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";
import { useSendInvoiceEmail } from "../hooks/useEmailActions";

interface SendEmailModalProps {
	invoiceId: string;
	invoiceNumber: string;
	customerEmail: string;
	onClose: () => void;
}

export function SendEmailModal({
	invoiceId,
	invoiceNumber,
	customerEmail,
	onClose,
}: SendEmailModalProps) {
	const [customMessage, setCustomMessage] = useState("");
	const sendEmail = useSendInvoiceEmail();
	const { trigger } = useHaptics();

	const handleSend = () => {
		sendEmail.mutate(
			{ invoiceId, customMessage: customMessage || undefined },
			{
				onSuccess: () => {
					trigger("success");
					onClose();
				},
			},
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center ui-overlay">
			<SurfacePanel
				padding="none"
				variant="elevated"
				className="mx-4 w-full max-w-md overflow-hidden shadow-xl"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-border/60 bg-muted/60">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
							<Mail className="w-5 h-5 text-primary" />
						</div>
						<div>
							<h2
								className={cn(
									"text-lg font-black uppercase tracking-tight text-foreground",
									LEGIBILITY.textShadow.light,
								)}
							>
								Enviar Factura
							</h2>
							<p className="text-label font-bold text-muted-foreground uppercase tracking-widest font-mono">
								{invoiceNumber}
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => {
							trigger("light");
							onClose();
						}}
						className="rounded-full p-2 transition-[background-color,transform] hover:bg-muted active:scale-95"
					>
						<X className="w-5 h-5 text-muted-foreground" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Recipient */}
					<div>
						<p
							className={cn(
								"block text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 pl-1",
								LEGIBILITY.textShadow.light,
							)}
						>
							Destinatario
						</p>
						<div className="px-4 py-3 bg-muted/60 border border-border/60 rounded-xl shadow-inner">
							<p className="text-xs text-foreground font-mono font-bold">
								{customerEmail}
							</p>
						</div>
					</div>

					{/* Custom Message */}
					<div>
						<label
							htmlFor="send-email-custom-message"
							className={cn(
								"block text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 pl-1",
								LEGIBILITY.textShadow.light,
							)}
						>
							Mensaje personalizado (opcional)
						</label>
						<textarea
							id="send-email-custom-message"
							value={customMessage}
							onChange={(e) => setCustomMessage(e.target.value)}
							onFocus={() => trigger("light")}
							placeholder="Agregue un mensaje personalizado..."
							className="w-full resize-none rounded-xl border border-border/60 bg-muted/60 px-4 py-3 text-xs font-medium text-foreground transition-[background-color,border-color,box-shadow,color] placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40"
							rows={4}
						/>
					</div>

					{/* Preview Info */}
					<div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
						<p className="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
							<span className="w-1 h-1 rounded-full bg-primary" /> Se incluirá:
						</p>
						<ul className="text-label text-muted-foreground font-bold space-y-2 pl-1">
							<li className="flex items-center gap-2">
								<div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
								PDF {invoiceNumber}
							</li>
							<li className="flex items-center gap-2">
								<div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
								DETALLE DE ITEMS
							</li>
							<li className="flex items-center gap-2">
								<div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
								VENCIMIENTO Y PAGOS
							</li>
						</ul>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 p-6 border-t border-border/60 bg-muted/60">
					<Button
						variant="ghost"
						onClick={() => {
							trigger("light");
							onClose();
						}}
						disabled={sendEmail.isPending}
						className="h-10 px-5 text-label font-black uppercase tracking-widest hover:bg-muted rounded-xl"
					>
						Cancelar
					</Button>
					<Button
						onClick={() => {
							trigger("medium");
							handleSend();
						}}
						disabled={sendEmail.isPending}
						className="flex h-10 items-center gap-2 rounded-xl bg-foreground px-6 text-label font-black uppercase tracking-widest text-background shadow-lg shadow-black/15 transition-[background-color,box-shadow,transform] hover:bg-foreground/90 hover:shadow-xl active:scale-[0.99]"
					>
						{sendEmail.isPending ? (
							<>
								<div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />
								Enviando...
							</>
						) : (
							<>
								<Mail className="w-4 h-4" />
								Enviar Email
							</>
						)}
					</Button>
				</div>
			</SurfacePanel>
		</div>
	);
}
