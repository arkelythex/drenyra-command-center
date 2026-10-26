import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initMonitoring } from "./lib/monitoring";
import { applyPersistedTheme } from "./lib/ux-mode";
import { initWebVitals } from "./lib/web-vitals";
import { createRouter } from "./router";
import "./index.css";

applyPersistedTheme();
initMonitoring();
initWebVitals();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: { staleTime: 30_000, retry: 1 },
	},
});
const router = createRouter({ queryClient });

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(
		<StrictMode>
			{/* Honor prefers-reduced-motion for every framer-motion animation (DESIGN.md). */}
			<MotionConfig reducedMotion="user">
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</MotionConfig>
		</StrictMode>,
	);
}
