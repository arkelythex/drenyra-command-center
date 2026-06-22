import {
	MotionDiv,
	entranceVariants,
} from "@/components/ui/motion-primitives";

export function FormFooter() {
	return (
		<MotionDiv
			variants={entranceVariants}
			className="text-center pt-2 space-y-4"
		>
			<div className="flex items-center justify-center gap-3">
				<div className="h-px w-8 bg-white/10" />
				<p className="text-3xs font-black uppercase tracking-[0.28em] text-white/55">
					Workspace corporativo
				</p>
				<div className="h-px w-8 bg-white/10" />
			</div>

			<div className="space-y-2">
				<p className="text-3xs font-black uppercase tracking-[0.18em] text-white/75">
					¿No tiene acceso?{" "}
					<a
						href="/signup"
						className="ml-1 text-white hover:text-white/80 transition-colors border-b border-white/30 hover:border-white pb-0.5"
					>
						Crear Cuenta
					</a>
				</p>
				<a
					href="/onboarding/demos"
					className="inline-block text-3xs font-black uppercase tracking-[0.28em] text-white/65 hover:text-white transition-colors"
				>
					Ver ARKELYTHEX en acción →
				</a>
			</div>
		</MotionDiv>
	);
}
