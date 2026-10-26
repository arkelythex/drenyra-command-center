import { Mail } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FIELD_IDS, LABELS, PLACEHOLDERS } from "../LoginForm.data";
import type { LoginFormData } from "../LoginForm.types";
import {
	fieldErrorClass,
	fieldIconClass,
	fieldInputClass,
} from "./field-styles";

export function EmailField() {
	const {
		register,
		formState: { errors },
	} = useFormContext<LoginFormData>();
	const id = FIELD_IDS.email;

	return (
		<div className="space-y-2">
			<Label htmlFor={id} className="text-sm font-medium text-foreground">
				{LABELS.email}
			</Label>
			<div className="relative">
				<Mail aria-hidden="true" className={cn(fieldIconClass, "left-3.5")} />
				<Input
					id={id}
					{...register("email")}
					type="email"
					inputMode="email"
					autoComplete="email"
					placeholder={PLACEHOLDERS.email}
					aria-invalid={errors.email ? true : undefined}
					aria-describedby={errors.email ? "email-error" : undefined}
					className={cn(fieldInputClass, "pl-11")}
				/>
			</div>
			{errors.email && (
				<p id="email-error" className={fieldErrorClass}>
					{errors.email.message}
				</p>
			)}
		</div>
	);
}
