import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { sanitizePersistedAuthState } from "./features/auth/lib/auth-storage";
import { captureError } from "./lib/monitoring";
import { createAppQueryClient } from "./lib/query-client";
import {
	bootstrapPersistedTheme,
	subscribeToSystemTheme,
	syncThemeDocumentState,
} from "./lib/ux-mode";
import { createRouter } from "./router";
import { useUIStore } from "./store/ui-store";
import "./index.css";
import "./styles/view-transitions.css";

const devSearchParams =
	typeof window !== "undefined"
		? new URLSearchParams(window.location.search)
		: null;
const enableReactQueryDevtools =
	import.meta.env.DEV && devSearchParams?.get("rqdevtools") === "1";
const enableApiMock =
	import.meta.env.DEV && import.meta.env.VITE_ENABLE_API_MOCK === "true";

if (enableApiMock) {
	void import("./lib/api-mock").then(({ installApiMock }) => {
		installApiMock();
	});
}

const ReactQueryDevtoolsPanel = enableReactQueryDevtools
	? lazy(async () => {
			try {
				const mod = await import("@tanstack/react-query-devtools");
				return { default: mod.ReactQueryDevtools };
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("React Query Devtools unavailable"),
					{
						source: "client.devtools-loader",
					},
				);
				return { default: () => null };
			}
		})
	: null;

sanitizePersistedAuthState();
const queryClient = createAppQueryClient();
const router = createRouter({ queryClient });

// Initialize monitoring:
// 1. Sentry (deferred — dynamic import to keep it out of critical bundle)
// 2. Legacy telemetry (Plausible + global error listeners)
// 3. Core Web Vitals
const sentryPromise = import("./lib/sentry").then(({ initSentry }) =>
	initSentry(router),
);
const initMonitoringPromise = import("./lib/monitoring").then(
	({ initMonitoring }) => initMonitoring(),
);

// Fire both — they run asynchronously after first paint
void sentryPromise;
void initMonitoringPromise;

bootstrapPersistedTheme();
subscribeToSystemTheme(() => {
	if (useUIStore.getState().themePreference === "system") {
		syncThemeDocumentState("system");
	}
});

const rootElement = document.getElementById("root");
if (rootElement) {
	const root = createRoot(rootElement);
	root.render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
				{enableReactQueryDevtools && ReactQueryDevtoolsPanel ? (
					<Suspense fallback={null}>
						<ReactQueryDevtoolsPanel initialIsOpen={false} />
					</Suspense>
				) : null}
			</QueryClientProvider>
		</StrictMode>,
	);
}

// Start Web Vitals tracking after the first render (deferred import)
if (typeof window !== "undefined") {
	const loadVitals = () =>
		import("./lib/web-vitals").then(({ initWebVitals }) => initWebVitals());

	if (window.requestIdleCallback) {
		window.requestIdleCallback(() => void loadVitals(), { timeout: 3000 });
	} else {
		setTimeout(() => void loadVitals(), 2000);
	}
}

// Register service worker for PWA support (static asset caching + offline fallback)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// Service worker registration failure is non-critical
		});
	});
}
