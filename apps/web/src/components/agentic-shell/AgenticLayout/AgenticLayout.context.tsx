import { createContext, useContext } from "react";
import type { AgenticLayoutContextValue } from "./AgenticLayout.types";

const AgenticLayoutContext = createContext<AgenticLayoutContextValue | null>(
	null,
);

export function useAgenticLayout(): AgenticLayoutContextValue {
	const ctx = useContext(AgenticLayoutContext);
	if (!ctx) {
		throw new Error(
			"useAgenticLayout must be used within an AgenticLayoutProvider",
		);
	}
	return ctx;
}

export { AgenticLayoutContext };
