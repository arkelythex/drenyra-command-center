import { createFileRoute } from "@tanstack/react-router";
import { DrenyraCaseLayout } from "@/features/drenyra/components/DrenyraCaseLayout";
import { DrenyraFlexMain } from "@/components/agentic/DrenyraFlexMain";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { useThreadStore } from "@/stores/thread-store";

export const Route = createFileRoute("/drenyra/case/$threadId")({
	component: DrenyraCaseWrapper,
});

function DrenyraCaseWrapper() {
	const { threadId } = useParams({ from: "/drenyra/case/$threadId" });
	const setActiveThread = useThreadStore((s) => s.setActiveThread);

	useEffect(() => {
		setActiveThread(threadId);
	}, [threadId, setActiveThread]);

	return (
		<DrenyraCaseLayout>
			<DrenyraFlexMain />
		</DrenyraCaseLayout>
	);
}
