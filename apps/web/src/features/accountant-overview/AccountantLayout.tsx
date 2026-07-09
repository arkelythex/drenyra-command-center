import { useState } from "react";

interface NavItem {
	path: string;
	label: string;
	icon: string;
}

const navItems: NavItem[] = [
	{ path: "/accountant", label: "Dashboard", icon: "📊" },
	{ path: "/consulta", label: "Consultar", icon: "🔍" },
	{ path: "/approval", label: "Aprobaciones", icon: "⏳" },
];

export function AccountantLayout({ children }: { children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(false);
	const currentPath = window.location.pathname;

	return (
		<div className="flex h-full">
			{/* Sidebar */}
			<aside
				className="flex flex-col border-r transition-all duration-200"
				style={{
					width: collapsed ? "56px" : "200px",
					borderColor: "var(--border)",
					backgroundColor: "var(--surface-2)",
				}}
			>
				{/* Header */}
				<div
					className="flex items-center gap-2 px-3 py-4 border-b"
					style={{ borderColor: "var(--border)" }}
				>
					<span className="text-lg">📋</span>
					{!collapsed && (
						<span
							className="text-sm font-semibold truncate"
							style={{ color: "var(--text-primary)" }}
						>
							Panel Contable
						</span>
					)}
				</div>

				{/* Navigation */}
				<nav className="flex-1 py-2 space-y-0.5 px-2">
					{navItems.map((item) => {
						const isActive =
							currentPath === item.path ||
							currentPath.startsWith(item.path + "/");
						return (
							<a
								key={item.path}
								href={item.path}
								className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
								style={{
									backgroundColor: isActive
										? "var(--accent-bg, #dbeafe)"
										: "transparent",
									color: isActive ? "var(--accent)" : "var(--text-secondary)",
								}}
								onClick={(e) => {
									e.preventDefault();
									window.history.pushState({}, "", item.path);
									window.dispatchEvent(
										new CustomEvent("navigate", { detail: item.path }),
									);
								}}
							>
								<span className="text-base">{item.icon}</span>
								{!collapsed && <span className="truncate">{item.label}</span>}
							</a>
						);
					})}
				</nav>

				{/* Collapse toggle */}
				<button
					type="button"
					onClick={() => setCollapsed(!collapsed)}
					className="border-t px-3 py-3 text-xs transition-colors"
					style={{
						borderColor: "var(--border)",
						color: "var(--text-secondary)",
					}}
				>
					{collapsed ? "→" : "← Colapsar"}
				</button>
			</aside>

			{/* Content */}
			<main className="flex-1 overflow-hidden">{children}</main>
		</div>
	);
}
