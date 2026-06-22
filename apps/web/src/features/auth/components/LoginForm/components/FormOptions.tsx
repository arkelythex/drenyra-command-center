import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
	MotionDiv,
	entranceVariants,
} from "@/components/ui/motion-primitives";
import type { LoginFormData } from "../LoginForm.types";

export function FormOptions() {
	const { setValue, watch } = useFormContext<LoginFormData>();
	const rememberMe = watch("rememberMe");

	return (
		<MotionDiv
			variants={entranceVariants}
			className="flex items-center justify-between px-1 pt-1"
		>
			<div
				className="flex items-center space-x-2.5 group cursor-pointer"
				onClick={() => setValue("rememberMe", !rememberMe)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setValue("rememberMe", !rememberMe); } }}
			>
				<Checkbox
					id="rememberMe"
					checked={rememberMe}
					onCheckedChange={(checked) =>
						setValue("rememberMe", checked as boolean)
					}
					className="h-4.5 w-4.5 rounded-full border-white/20 bg-black/20 data-[state=checked]:bg-[var(--color-success)] data-[state=checked]:border-[var(--color-success)] transition-colors"
				/>
				<label
					htmlFor="rememberMe"
					className="text-3xs font-black uppercase tracking-[0.24em] text-white/80 cursor-pointer group-hover:text-white transition-colors"
				>
					Persistir Sesión
				</label>
			</div>
			<a
				href="/forgot-password"
				className="text-3xs font-black uppercase tracking-[0.24em] text-white/85 hover:text-white transition-all border-b border-transparent hover:border-white/30 pb-0.5"
			>
				Recuperar
			</a>
		</MotionDiv>
	);
}
