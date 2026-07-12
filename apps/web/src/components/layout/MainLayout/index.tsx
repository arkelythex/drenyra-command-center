import type { ReactNode } from "react";
import { MainLayoutView } from "./MainLayout";

interface MainLayoutProps {
	children: ReactNode;
}

/**
 * MainLayout — layout orchestrator.
 *
 * Providers globales ahora viven en AppProviders (client.tsx).
 * MainLayout solo se encarga del layout visual: sidebar, top bar, content.
 *
 * Import via: `import { MainLayout } from "@/components/layout/MainLayout"`
 */
export const MainLayout = ({ children }: MainLayoutProps) => (
	<MainLayoutView>{children}</MainLayoutView>
);
