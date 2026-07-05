import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { primaryButtonClass } from "./styles";

interface AuthSubmitButtonProps {
	label: string;
	isLoading: boolean;
}

export function AuthSubmitButton({ label, isLoading }: AuthSubmitButtonProps) {
	return (
		<Button type="submit" disabled={isLoading} className={primaryButtonClass}>
			{isLoading ? (
				<div className="flex items-center justify-center gap-2">
					<Loader2 className="animate-spin h-4 w-4" />
					<span>Cargando...</span>
				</div>
			) : (
				<div className="flex items-center justify-center gap-3">
					<span>{label}</span>
					<ArrowRight size={18} strokeWidth={3} />
				</div>
			)}
		</Button>
	);
}
