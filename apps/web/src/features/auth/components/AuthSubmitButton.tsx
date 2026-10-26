import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AuthSubmitButtonProps {
	isLoading: boolean;
	children: ReactNode;
}

/** Primary action of the auth forms: the brand color, 48px, sentence case. */
export function AuthSubmitButton({
	isLoading,
	children,
}: AuthSubmitButtonProps) {
	return (
		<Button
			type="submit"
			disabled={isLoading}
			aria-busy={isLoading}
			className="h-12 w-full rounded-lg border-transparent bg-brand text-base font-medium text-brand-foreground hover:bg-brand/90"
		>
			{isLoading ? (
				<Loader2
					aria-hidden="true"
					className="size-5 animate-spin motion-reduce:animate-none"
				/>
			) : null}
			{children}
		</Button>
	);
}
