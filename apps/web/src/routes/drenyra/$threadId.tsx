import { createFileRoute, useParams } from "@tanstack/react-router";
import { useThreadStore } from "../../stores/thread-store";
import { useEffect } from "react";
import { DrenyraFlexMain } from "../../components/agentic/DrenyraFlexMain";

export const Route = createFileRoute("/drenyra/$threadId")({
  component: DrenyraThread,
});

function DrenyraThread() {
  const { threadId } = useParams({ from: "/drenyra/$threadId" });
  const setActiveThread = useThreadStore((s) => s.setActiveThread);

  useEffect(() => {
    setActiveThread(threadId);
  }, [threadId, setActiveThread]);

  return <DrenyraFlexMain />;
}
