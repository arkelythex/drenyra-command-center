import type { ReactNode } from "react";
import { SidebarWorkspaceProvider } from "@/context/SidebarWorkspaceContext";
import { ArtifactEventProvider } from "@/context/ArtifactEventContext";
import { FiscalInspectorProvider } from "@/context/FiscalInspectorContext";
import { AgentAwareProvider } from "@/context/AgentAwareContext";
import { PolicyGateProvider } from "@/features/artifacts/policy";
import { MainLayoutView } from "./MainLayout";

interface MainLayoutProps {
	children: ReactNode;
}

/**
 * MainLayout — top-level layout provider wrapper.
 *
 * Wraps the application in all required context providers and renders the
 * layout orchestrator (sidebar, top bar, content area, bottom nav, etc.).
 *
 * Import via: `import { MainLayout } from "@/components/layout/MainLayout"`
 */
export const MainLayout = ({ children }: MainLayoutProps) => (
	<SidebarWorkspaceProvider>
		<ArtifactEventProvider>
			<FiscalInspectorProvider>
				<AgentAwareProvider>
					<PolicyGateProvider>
						<MainLayoutView>{children}</MainLayoutView>
					</PolicyGateProvider>
				</AgentAwareProvider>
			</FiscalInspectorProvider>
		</ArtifactEventProvider>
	</SidebarWorkspaceProvider>
);
