import { Pause, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentSessionStatusDTO } from "./agents.types";
import * as agentsApi from "./agents.api";

export interface AgentSessionControlsProps {
	session: AgentSessionStatusDTO;
	onAction?: () => void;
}

export function AgentSessionControls({
	session,
	onAction,
}: AgentSessionControlsProps) {
	const handlePause = async () => {
		try {
			await agentsApi.pauseSession(session.id);
			onAction?.();
		} catch {
			// Error handled by caller via toast
		}
	};

	const handleResume = async () => {
		try {
			await agentsApi.resumeSession(session.id);
			onAction?.();
		} catch {
			// Error handled by caller via toast
		}
	};

	const handleCancel = async () => {
		try {
			await agentsApi.cancelSession(session.id);
			onAction?.();
		} catch {
			// Error handled by caller via toast
		}
	};

	if (session.status === "running") {
		return (
			<div className="flex gap-2">
				<Button variant="secondary" size="sm" onClick={handlePause}>
					<Pause size={12} className="mr-1" />
					Pausar
				</Button>
				<Button variant="ghost" size="sm" onClick={handleCancel}>
					<XCircle size={12} className="mr-1" />
					Cancelar
				</Button>
			</div>
		);
	}

	if (session.status === "paused") {
		return (
			<div className="flex gap-2">
				<Button variant="primary" size="sm" onClick={handleResume}>
					<Play size={12} className="mr-1" />
					Reanudar
				</Button>
				<Button variant="ghost" size="sm" onClick={handleCancel}>
					<XCircle size={12} className="mr-1" />
					Cancelar
				</Button>
			</div>
		);
	}

	// completed, failed, awaiting_approval — no controls
	return null;
}
