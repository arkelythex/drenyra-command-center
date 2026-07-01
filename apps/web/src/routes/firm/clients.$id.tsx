import { createFileRoute, useParams } from "@tanstack/react-router";
import { ClientDetail } from "../../features/firm/ClientDetail";

export const Route = createFileRoute("/firm/clients/$id")({
	component: ClientDetailWrapper,
});

function ClientDetailWrapper() {
	const { id } = useParams({ from: "/firm/clients/$id" });
	return <ClientDetail clientId={id} />;
}
