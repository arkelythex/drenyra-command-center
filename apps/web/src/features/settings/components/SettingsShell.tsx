import { useLocation, useRouter } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useSettingsShell } from "../hooks/use-settings-shell";
import { SettingsDesktopNav } from "./settings-shell/desktop-nav";
import { SettingsMobileNav } from "./settings-shell/mobile-nav";

interface SettingsShellProps {
	title: string;
	description: string;
	icon: LucideIcon;
	/** Short context label shown next to the description (e.g. scope of the page). */
	badge?: string;
	actions?: ReactNode;
	children: ReactNode;
}

/**
 * Settings page template. Lives inside the app layout (the app sidebar stays),
 * so it scrolls as one column with its own section nav instead of a second
 * full-height sidebar.
 */
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
		<div className="h-full overflow-y-auto bg-background text-foreground">
			<div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
				<aside className="hidden w-56 shrink-0 lg:block">
					<div className="sticky top-0">
						<p className="mb-3 px-3 text-xs font-medium text-muted-foreground">
							Configuración
						</p>
						<SettingsDesktopNav
							pathname={location.pathname}
							visibleItems={visibleItems}
						/>
					</div>
				</aside>

				<main className="min-w-0 max-w-2xl flex-1">
					<header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-1.5">
							<h1 className="flex items-center gap-2 text-2xl font-medium tracking-tight">
								<Icon
									aria-hidden="true"
									className="size-5 text-muted-foreground"
								/>
								{title}
							</h1>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{description}
								{badge ? (
									<span className="ml-2 text-xs text-muted-foreground/80">
										· {badge}
									</span>
								) : null}
							</p>
						</div>
						{actions ? <div className="shrink-0">{actions}</div> : null}
					</header>

					<SettingsMobileNav pathname={location.pathname} />

					<div className="space-y-10 pb-16">{children}</div>
				</main>
			</div>
		</div>
	);
};
