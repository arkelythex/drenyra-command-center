import type { ReactNode } from "react";
import { AgentAwareProvider } from "@/context/AgentAwareContext";
import { ArtifactEventProvider } from "@/context/ArtifactEventContext";
import { FiscalInspectorProvider } from "@/context/FiscalInspectorContext";
import { SidebarWorkspaceProvider } from "@/context/SidebarWorkspaceContext";
import { PolicyGateProvider } from "@/features/artifacts/policy";

/**
 * AppProviders — provider hierarchy unificado.
 *
 * Capas:
 *   0 (infra):   QueryClientProvider, RouterProvider (en client.tsx)
 *   1 (workspace): SidebarWorkspace, ArtifactEvent
 *   2 (feature):  FiscalInspector, AgentAware, PolicyGate
 *
 * Los providers de capa 1-2 se envuelven aquí para que estén disponibles
 * en TODAS las rutas sin necesidad de envolver manualmente.
 * Los providers de capa 4 (page-specific) van en la ruta correspondiente.
 */
export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<SidebarWorkspaceProvider>
			<ArtifactEventProvider>
				<FiscalInspectorProvider>
					<AgentAwareProvider>
						<PolicyGateProvider>
							{children}
						</PolicyGateProvider>
					</AgentAwareProvider>
				</FiscalInspectorProvider>
			</ArtifactEventProvider>
		</SidebarWorkspaceProvider>
	);
}
