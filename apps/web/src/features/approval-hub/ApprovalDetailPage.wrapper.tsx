import { useParams } from "@tanstack/react-router";
import { ApprovalDetailPage } from "./ApprovalDetailPage";

/**
 * Wrapper component that extracts the route param $id
 * and passes it to ApprovalDetailPage.
 */
export function ApprovalDetailPageWrapper() {
	const { id } = useParams({ from: "/approval/$id" });
	return <ApprovalDetailPage recId={id} />;
}
