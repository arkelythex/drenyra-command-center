import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";
import { DrenyraCaseLayout } from "@/features/drenyra/components/DrenyraCaseLayout";
import { DrenyraFlexMain } from "@/components/agentic/DrenyraFlexMain";
import { useThreadStore } from "@/stores/thread-store";

export default function DrenyraCaseWrapper() {
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
