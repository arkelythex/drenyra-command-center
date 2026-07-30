import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AgenticLayout } from "@/components/agentic-shell/AgenticLayout/AgenticLayout";

const PUBLIC_ROUTES = new Set([
	"/login",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/auth",
]);

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const { pathname } = useLocation();
	const isPublicRoute = PUBLIC_ROUTES.has(pathname) || pathname === "/";

	return (
		<>
			<Suspense
				fallback={
					<div className="flex h-screen items-center justify-center bg-[var(--color-bg-0)]">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
					</div>
				}
			>
				{isPublicRoute ? (
					<div className="min-h-screen bg-[var(--color-bg-0)]">
						<Outlet />
					</div>
				) : (
					<AgenticLayout />
				)}
			</Suspense>
			<Toaster
				position="bottom-right"
				theme="dark"
				toastOptions={{
					style: {
						background: "var(--surface-1)",
						border: "1px solid var(--border-subtle)",
						color: "var(--text-primary)",
					},
				}}
			/>
		</>
	);
}
