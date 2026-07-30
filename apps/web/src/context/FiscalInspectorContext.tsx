/**
 * @deprecated Use InspectorContext instead.
 * Import { InspectorProvider, useInspector } from "@/context/InspectorContext"
 */
export {
	InspectorProvider as FiscalInspectorProvider,
	useInspector as useFiscalInspector,
} from "./InspectorContext";
export type { InspectorSubject, InspectorSubject as AgentInspection } from "./InspectorContext";
