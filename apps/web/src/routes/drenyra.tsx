import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const DrenyraLayout = lazyRouteComponent(
  () => import("../components/layout/CodexShell"),
  "CodexShell",
);

export const Route = createFileRoute("/drenyra")({
  component: DrenyraLayout,
});
