import { Link, useLocation, useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSettingsShell } from "../hooks/use-settings-shell";
import { SettingsDesktopNav } from "./settings-shell/desktop-nav";
import { SettingsMobileNav } from "./settings-shell/mobile-nav";

interface SettingsShellProps {
	title: string;
	description: string;
	icon: LucideIcon;
	badge?: string;
	actions?: ReactNode;
	children: ReactNode;
}

export const SettingsShell = ({
	title,
	description,
	icon: Icon,
	badge,
	actions,
	children,
}: SettingsShellProps) => {
	const location = useLocation();
	const router = useRouter();
	const { visibleItems } = useSettingsShell({ router });

	return (
		<div className="flex h-screen w-full overflow-hidden bg-[var(--surface-1)] font-sans text-[var(--text-primary)]">
			{/* --- SETTINGS SIDEBAR (Desktop) --- */}
			<aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-2)]/50 lg:flex">
				<div className="p-6">
					<Link
						to="/"
						className="group mb-8 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
					>
						<ArrowLeft
							size={16}
							strokeWidth={2}
							className="transition-transform group-hover:-translate-x-0.5"
						/>
						<span>Volver a Drenyra</span>
					</Link>

					<SettingsDesktopNav
						pathname={location.pathname}
						visibleItems={visibleItems}
					/>
				</div>
			</aside>

			{/* --- SETTINGS CONTENT --- */}
			<div className="min-h-0 flex-1 overflow-hidden">
				<PageShell
					as="main"
					variant="focal"
					padding="none"
					className="h-full max-w-none custom-scrollbar px-6 py-8 lg:px-16 lg:py-12"
				>
					<div className="flex flex-col gap-4 mb-12">
						<Link
							to="/"
							className="group flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] lg:hidden"
						>
							<ArrowLeft
								size={16}
								strokeWidth={2}
								className="transition-transform group-hover:-translate-x-0.5"
							/>
							<span>Volver a Drenyra</span>
						</Link>

						<PageHeader
							title={title}
							description={description}
							icon={<Icon size={18} strokeWidth={1.75} />}
							badge={
								badge ? (
									<StatusBadge status="neutral" label={badge} dot={false} />
								) : null
							}
							actions={actions}
						/>

						<SettingsMobileNav pathname={location.pathname} />
					</div>

					<div className="pb-20">{children}</div>
				</PageShell>
			</div>
		</div>
	);
};
