import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import { createRouter } from "./router";
import "./index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 30_000, retry: 1 },
	},
});
const router = createRouter({ queryClient });

// Sentry must be initialized BEFORE createRoot so the React 19 error
// handlers are available during the first render. Returns null when
// monitoring is disabled (no DSN) — the app then runs without it.
const sentry = initSentry(router);

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(
		rootElement,
		sentry
			? {
					onUncaughtError: sentry.reactErrorHandlers.onUncaughtError,
					onCaughtError: sentry.reactErrorHandlers.onCaughtError,
					onRecoverableError: sentry.reactErrorHandlers.onRecoverableError,
				}
			: undefined,
	).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>,
	);
}
