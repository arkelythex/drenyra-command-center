/**
 * DrenyraWorkspace
 *
 * Thin wrapper around DrenyraCommandCenter with PageShell.
 * Provides a back button to return to the launcher.
 */

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/PageShell";
import { DrenyraCommandCenter } from "./DrenyraCommandCenter";

interface DrenyraWorkspaceProps {
	onBack?: () => void;
}

export function DrenyraWorkspace({ onBack }: DrenyraWorkspaceProps) {
	return (
		<PageShell variant="board" padding="none" className="h-full relative">
			{onBack && (
				<div className="absolute left-4 top-4 z-20">
					<Button variant="ghost" size="sm" onClick={onBack}>
						<ArrowLeft className="h-4 w-4" />
						Volver
					</Button>
				</div>
			)}
			<DrenyraCommandCenter />
		</PageShell>
	);
}
