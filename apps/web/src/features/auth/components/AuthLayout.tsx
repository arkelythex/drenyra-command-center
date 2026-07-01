import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
	children: ReactNode;
	title: string;
	subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
	return (
		<div className="min-h-screen w-full overflow-hidden bg-[#050606] font-sans selection:bg-primary/30">
			<div className="pointer-events-none fixed inset-0">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_84%,rgba(15,42,57,0.5),transparent_34%),radial-gradient(circle_at_35%_12%,rgba(255,255,255,0.045),transparent_28%)]" />
				<div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.035),transparent_22%,transparent_70%,rgba(255,255,255,0.025))]" />
				<div className="absolute left-1/2 top-0 h-full w-px -rotate-[28deg] bg-white/[0.035] blur-sm" />
				<div className="absolute right-[18%] top-[-10%] h-[42rem] w-24 rotate-[28deg] bg-white/[0.025] blur-2xl" />
			</div>

			<main className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
				<section className="w-full max-w-[440px] space-y-8 sm:max-w-[460px]">
					<div className="space-y-5 text-center">
						<div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] border border-white/80 bg-black/20 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10">
								<ShieldCheck size={21} strokeWidth={2.2} />
							</div>
						</div>
						<div className="space-y-3">
							<p className="text-3xs font-black uppercase tracking-[0.42em] text-white/85">
								Acceso corporativo
							</p>
							<h3 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.08em] text-white sm:text-5xl">
								{title}
							</h3>
							<p className="mx-auto max-w-md text-sm font-bold leading-6 text-white/80">
								{subtitle}
							</p>
						</div>
					</div>

					<div className="relative">
						<div className="absolute -inset-px rounded-[1.65rem] bg-gradient-to-br from-white/20 via-white/5 to-[color:rgb(from_var(--color-info)_r_g_b_/_0.1)] opacity-90" />
						<div
							className={cn(
								tokensToClasses.borderRadius("card"),
								"relative overflow-hidden border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(9,16,22,0.82))] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.55)]  sm:p-10",
							)}
						>
							<div className="pointer-events-none absolute bottom-[-18%] right-[-20%] h-72 w-72 rounded-full bg-[color:rgb(from_var(--color-info)_r_g_b_/_0.1)] blur-3xl" />
							<div className="pointer-events-none absolute right-7 top-6 text-white/90">
								<Lock size={42} strokeWidth={1.9} />
							</div>
							{children}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[color:rgb(from_var(--color-info)_r_g_b_/_0.12)] px-4 py-3">
							<Lock size={13} className="text-[var(--color-success)]" />
							<span className="text-3xs font-black uppercase tracking-[0.18em] text-white/80">
								Sesión cifrada
							</span>
						</div>
						<div className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[color:rgb(from_var(--color-info)_r_g_b_/_0.12)] px-4 py-3">
							<CheckCircle2 size={13} className="text-white/85" />
							<span className="text-3xs font-black uppercase tracking-[0.18em] text-white/80">
								Tenant seguro
							</span>
						</div>
					</div>
				</section>
			</main>
		</div>
	);
};
