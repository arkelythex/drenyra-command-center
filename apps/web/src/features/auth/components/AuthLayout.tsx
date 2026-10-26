import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
	children: ReactNode;
	title: string;
	subtitle: string;
}

/**
 * Auth screens template (DESIGN.md "Fiscal Editorial"): flat dark canvas,
 * one surface panel, no gradients or blur. Full-bleed form on phones,
 * framed panel from `sm` up.
 */
export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
	return (
		<div className="force-dark min-h-dvh w-full bg-background font-sans text-foreground">
			<main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:justify-center sm:px-6">
				<p className="text-sm font-medium tracking-tight text-foreground">
					Drenyra
				</p>

				<header className="mt-10 space-y-2 sm:mt-8">
					<h1 className="text-3xl font-medium leading-tight tracking-tight">
						{title}
					</h1>
					<p className="text-base leading-relaxed text-muted-foreground">
						{subtitle}
					</p>
				</header>

				<section className="mt-8 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:p-8">
					{children}
				</section>

				<ul className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-8 text-sm text-muted-foreground sm:mt-6 sm:pt-0">
					<li className="flex items-center gap-2">
						<LockKeyhole aria-hidden="true" className="size-4" />
						Sesión cifrada
					</li>
					<li className="flex items-center gap-2">
						<ShieldCheck aria-hidden="true" className="size-4" />
						Datos aislados por empresa
					</li>
				</ul>
			</main>
		</div>
	);
};
