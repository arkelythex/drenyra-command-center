import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Building2, LayoutDashboard, Users } from "lucide-react";

const NAV_ITEMS = [
	{ to: "/firm", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/firm/clients", label: "Clientes", icon: Users },
] as const;

export default function FirmLayout() {
	const { pathname } = useLocation();

	return (
		<div className="flex-1 flex flex-col bg-[var(--surface-1)]">
			<header className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]">
				<div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
					<div className="flex items-center h-14 gap-4">
						<div className="flex items-center gap-2 mr-6">
							<Building2 size={18} className="text-[var(--color-info)]" />
							<span className="text-sm font-bold text-[var(--text-primary)]">
								Firma
							</span>
						</div>
						<nav className="flex items-center gap-1">
							{NAV_ITEMS.map((item) => {
								const Icon = item.icon;
								const isActive =
									item.to === "/firm"
										? pathname === "/firm"
										: pathname.startsWith(item.to);
								return (
									<Link
										key={item.to}
										to={item.to}
										className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-colors ${
											isActive
												? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
												: "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
										}`}
									>
										<Icon size={14} />
										{item.label}
									</Link>
								);
							})}
						</nav>
					</div>
				</div>
			</header>
			<div className="flex-1 overflow-auto custom-scrollbar">
				<div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-10">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
