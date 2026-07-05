import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";

type AsyncStatus = "pending" | "loading" | "success" | "error";

interface DataStateWrapperProps {
	status: AsyncStatus;
	data: unknown;
	emptyTitle?: string;
	emptyDescription?: string;
	emptyAction?: ReactNode;
	error?: Error | null;
	onAction?: () => void;
	actionLabel?: string;
	children: ReactNode;
}

/**
 * DataStateWrapper — renders the appropriate state component:
 * - loading: LoadingState spinner
 * - error: ErrorState with contextual action
 * - success+empty: EmptyState with optional CTA
 * - success+data: children
 */
export function DataStateWrapper({
	status,
	data,
	emptyTitle,
	emptyDescription,
	emptyAction,
	error,
	onAction,
	actionLabel,
	children,
}: DataStateWrapperProps) {
	if (status === "loading" || status === "pending") {
		return <LoadingState />;
	}

	if (status === "error") {
		return (
			<ErrorState
				message={error?.message ?? "Ocurrió un error inesperado."}
				onAction={onAction}
				actionLabel={actionLabel}
			/>
		);
	}

	if (status === "success" && !data) {
		return (
			<EmptyState
				title={emptyTitle ?? "Sin datos"}
				description={emptyDescription}
				action={emptyAction}
			/>
		);
	}

	return <>{children}</>;
}
