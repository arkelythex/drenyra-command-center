/**
 * Ensures `JSX.Element` resolves under `tsc -p tsconfig.check.json` when
 * compilerOptions.types narrows ambient packages (React 19 + strict check).
 */
import type { ReactElement } from "react";

declare global {
	namespace JSX {
		type Element = ReactElement;
	}
}

export {};
