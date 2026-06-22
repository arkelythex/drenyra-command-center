import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	MotionDiv,
	entranceVariants,
} from "@/components/ui/motion-primitives";
import { SUBMIT_TEXT, SUBMIT_LOADING_TEXT } from "../LoginForm.data";

interface SubmitButtonProps {
	isLoading: boolean;
}

export function SubmitButton({ isLoading }: SubmitButtonProps) {
	return (
		<MotionDiv variants={entranceVariants} className="pt-2">
			<Button
				type="submit"
				disabled={isLoading}
				className={cn(
					"group relative h-16 w-full overflow-hidden rounded-full bg-transparent text-label font-black uppercase tracking-[0.35em] text-white transition-all duration-300",
					"hover:bg-white/[0.035] disabled:opacity-70 motion-reduce:transition-none",
				)}
			>
				{isLoading ? (
					<span className="flex items-center gap-3">
						<Loader2 className="h-4 w-4 animate-spin" />
						{SUBMIT_LOADING_TEXT}
					</span>
				) : (
					<span className="flex items-center gap-3 relative z-10 transition-[gap] duration-150 group-hover:gap-4 motion-reduce:transition-none">
						{SUBMIT_TEXT}
						<ArrowRight
							size={16}
							strokeWidth={3}
							className="transition-colors"
						/>
					</span>
				)}
			</Button>
		</MotionDiv>
	);
}
