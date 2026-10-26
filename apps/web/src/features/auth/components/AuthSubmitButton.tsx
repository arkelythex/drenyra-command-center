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
			variant="brand"
			type="submit"
			disabled={isLoading}
			aria-busy={isLoading}
			className="h-12 w-full rounded-lg text-base font-medium"
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
