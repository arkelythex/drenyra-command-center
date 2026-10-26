import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUBMIT_LOADING_TEXT, SUBMIT_TEXT } from "../LoginForm.data";

interface SubmitButtonProps {
	isLoading: boolean;
}

export function SubmitButton({ isLoading }: SubmitButtonProps) {
	return (
		<Button
			variant="brand"
			type="submit"
			disabled={isLoading}
			aria-busy={isLoading || undefined}
			className="h-12 w-full rounded-lg text-base font-medium disabled:opacity-70"
		>
			{isLoading ? (
				<>
					<Loader2
						aria-hidden="true"
						className="size-4 animate-spin motion-reduce:animate-none"
					/>
					{SUBMIT_LOADING_TEXT}
				</>
			) : (
				SUBMIT_TEXT
			)}
		</Button>
	);
}
