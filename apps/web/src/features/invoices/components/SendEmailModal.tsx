import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHaptics } from "@/hooks/useHaptics";
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
		trigger("medium");
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
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md gap-4">
				<DialogHeader className="text-left">
					<DialogTitle className="text-lg font-semibold">
						Enviar factura
					</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						{invoiceNumber} · se envía en PDF con el detalle y el vencimiento.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-1">
					<p className="text-sm font-medium">Destinatario</p>
					<p className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm">
						{customerEmail}
					</p>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="send-email-custom-message">
						Mensaje personalizado (opcional)
					</Label>
					<Textarea
						id="send-email-custom-message"
						value={customMessage}
						onChange={(e) => setCustomMessage(e.target.value)}
						placeholder="Agrega un mensaje para tu cliente"
						className="resize-none rounded-lg"
						rows={4}
					/>
				</div>

				<DialogFooter className="gap-2 sm:gap-2">
					<Button
						type="button"
						variant="ghost"
						onClick={onClose}
						disabled={sendEmail.isPending}
						className="h-11"
					>
						Cancelar
					</Button>
					<Button
						type="button"
						onClick={handleSend}
						disabled={sendEmail.isPending}
						className="h-11 bg-brand text-brand-foreground hover:bg-brand/90"
					>
						{sendEmail.isPending ? "Enviando…" : "Enviar correo"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
