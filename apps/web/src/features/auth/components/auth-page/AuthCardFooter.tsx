import { toast } from "sonner";
import { Text } from "@/components/atoms/text";

export function AuthCardFooter() {
	return (
		<div className="mt-8 border-t border-border pt-6">
			<div className="flex items-center justify-center gap-4 mb-4">
				<button
					onClick={() => {
						localStorage.clear();
						toast.success("Cache limpiado. Recarga la página.");
					}}
					className="rounded-md px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground underline decoration-1 underline-offset-2 transition-[background-color,color] duration-200 hover:bg-muted/60 hover:text-foreground"
				>
					Limpiar Cache
				</button>
			</div>
			<Text
				variant="label"
				className="block text-center text-sm font-medium text-muted-foreground"
			>
				Sistema Seguro • Encriptación AES-256
			</Text>
		</div>
	);
}
