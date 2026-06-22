import {
	createRootRouteWithContext,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { SettingsProvider } from "../context/SettingsContext";
import { useAuthSession } from "../features/auth/hooks/useAuthSession";
import { PageTransition } from "../components/ui/page-transition";
import { lazy, useEffect, Suspense, type ReactNode } from "react";
import { SimulationProvider } from "../context/SimulationContext";
import { MotionProvider } from "../components/ui/motion-primitives";
import { Toaster } from "sonner";
import { ErrorBoundary } from "../components/error-boundary";
import { trackPageView } from "../lib/monitoring";
import { isPublicRoute, isStandaloneRoute } from "../lib/router/public-routes";
import { useSettings } from "../context/SettingsContext";
import { authSessionQueryOptions } from "../features/auth/lib/auth-session.query";
import { isAuthenticatedSessionSnapshot } from "../features/auth/lib/auth-session-snapshot";
import type { RouterContext } from "../router";

const MainLayout = lazy(async () => {
	const mod = await import("../components/layout/MainLayout");
	return { default: mod.MainLayout };
});

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context, location }) => {
		const sessionSnapshot = await context.queryClient.ensureQueryData(
			authSessionQueryOptions(),
		);
		if (
			!isAuthenticatedSessionSnapshot(sessionSnapshot) &&
			!isPublicRoute(location.pathname)
		) {
			throw redirect({
				to: "/login",
				search: { redirect: location.pathname },
			});
		}
	},
	component: RootComponent,
});

function RootComponent() {
	useAuthSession();
	const pathname = useLocation({
		select: (location) => location.pathname,
	});
	const publicRoute = isPublicRoute(pathname);
	const standaloneRoute = isStandaloneRoute(pathname);

	useEffect(() => {
		trackPageView(pathname);
	}, [pathname]);

	return (
		<ErrorBoundary>
			<SettingsProvider>
				<SimulationProvider enabled={!publicRoute}>
					<MotionProvider>
						<Suspense
							fallback={
								<RootLoadingFallback label="Cargando experiencia ARKELYTHEX" />
							}
						>
							{publicRoute ? (
								<>
									<PageTransition>
										<Outlet />
									</PageTransition>
									<ThemedToaster />
								</>
							) : standaloneRoute ? (
								<>
									<PageTransition>
										<Outlet />
									</PageTransition>
									<ThemedToaster />
								</>
							) : (
								<PrivateAppShell>
									<PageTransition>
										<Outlet />
									</PageTransition>
									<ThemedToaster />
								</PrivateAppShell>
							)}
						</Suspense>
					</MotionProvider>
				</SimulationProvider>
			</SettingsProvider>
		</ErrorBoundary>
	);
}

function PrivateAppShell({ children }: { children: ReactNode }) {
	return (
		<Suspense
			fallback={<RootLoadingFallback label="Cargando espacio de trabajo" />}
		>
			<MainLayout>{children}</MainLayout>
		</Suspense>
	);
}

function RootLoadingFallback({ label }: { label: string }) {
	return (
		<div
			className="h-screen w-full flex items-center justify-center bg-background"
			role="status"
			aria-live="polite"
		>
			<Loader2
				className="w-8 h-8 text-primary animate-spin"
				aria-hidden="true"
			/>
			<span className="sr-only">{label}</span>
		</div>
	);
}

function ThemedToaster() {
	const { resolvedTheme } = useSettings();

	return (
		<Toaster
			position="top-right"
			theme={resolvedTheme}
			toastOptions={{
				className:
					"bg-card border border-border shadow-2xl rounded-2xl text-foreground font-medium",
			}}
		/>
	);
}
