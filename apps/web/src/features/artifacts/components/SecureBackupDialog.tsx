import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SecureBackupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (passphrase: string) => Promise<void>;
}

export function SecureBackupDialog({
	open,
	onOpenChange,
	onConfirm,
}: SecureBackupDialogProps) {
	const [state, formAction, isSubmitting] = useActionState(
		async (_prev: { error: string | null }, formData: FormData) => {
			const passphrase = formData.get("passphrase") as string;

			if (passphrase.trim().length < 12) {
				return { error: "La contraseña debe tener al menos 12 caracteres." };
			}

			try {
				await onConfirm(passphrase);
				onOpenChange(false);
				return { error: null };
			} catch (cause) {
				return {
					error:
						cause instanceof Error
							? cause.message
							: "No se pudo generar backup cifrado.",
				};
			}
		},
		{ error: null as string | null },
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form action={formAction}>
					<DialogHeader>
						<DialogTitle className="text-base font-black uppercase tracking-widest">
							Backup cifrado
						</DialogTitle>
						<DialogDescription>
							Define una contraseña para generar el backup offline con AES-GCM
							256.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-1">
						<label
							className="text-label font-semibold uppercase tracking-wider text-muted-foreground"
							htmlFor="backup-passphrase"
						>
							Contraseña
						</label>
						<Input
							id="backup-passphrase"
							type="password"
							name="passphrase"
							placeholder="Minimo 12 caracteres"
						/>
					</div>

					{state.error ? (
						<p className="text-xs text-red-300">{state.error}</p>
					) : null}

					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Generando..." : "Generar backup"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
