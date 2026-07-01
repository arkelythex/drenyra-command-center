import { createFileRoute } from "@tanstack/react-router";
import { ClientList } from "../../features/firm/ClientList";

export const Route = createFileRoute("/firm/clients")({
	component: ClientList,
});
