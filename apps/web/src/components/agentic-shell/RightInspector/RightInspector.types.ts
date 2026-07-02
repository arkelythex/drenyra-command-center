import type { InspectorPanel } from "@/stores/agentic-shell.store";

export interface RightInspectorProps {
	panel: InspectorPanel;
	onClose: () => void;
	onPin?: () => void;
}
