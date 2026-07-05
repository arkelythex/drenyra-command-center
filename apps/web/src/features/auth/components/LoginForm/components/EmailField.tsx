import { Mail } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entranceVariants, MotionDiv } from "@/components/ui/motion-primitives";
import { cn } from "@/lib/utils";
import { FIELD_IDS, LABELS, PLACEHOLDERS } from "../LoginForm.data";
import type { LoginFormData } from "../LoginForm.types";

export function EmailField() {
	const {
		register,
		formState: { errors },
	} = useFormContext<LoginFormData>();
	const id = FIELD_IDS.email;

	return (
		<MotionDiv variants={entranceVariants} className="space-y-3">
			<div className="flex justify-between items-end px-1">
				<Label
					htmlFor={id}
					className="text-3xs font-black uppercase tracking-[0.28em] text-white/90"
				>
					{LABELS.email}
				</Label>
			</div>
			<div className="relative group">
				<div className="absolute inset-0 rounded-full bg-white/10 opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100 pointer-events-none" />
				<Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/85 transition-all duration-300 group-focus-within:text-white" />
				<Input
					id={id}
					{...register("email")}
					type="email"
					autoComplete="email"
					placeholder={PLACEHOLDERS.email}
					aria-describedby={errors.email ? "email-error" : undefined}
					className={cn(
						"h-14 rounded-full border-white/85 bg-white/[0.035] pl-14 text-base font-bold text-white transition-all duration-300",
						"placeholder:text-white/35 focus:border-white focus:ring-2 focus:ring-white/15",
						errors.email &&
							"border-destructive/70 focus:ring-destructive/20 focus:border-destructive",
					)}
				/>
			</div>
			{errors.email && (
				<p
					id="email-error"
					className="ml-1 text-label font-bold uppercase tracking-wider text-destructive animate-in fade-in slide-in-from-left-1"
				>
					{errors.email.message}
				</p>
			)}
		</MotionDiv>
	);
}
