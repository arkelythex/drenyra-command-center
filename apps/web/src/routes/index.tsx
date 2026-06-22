import { createFileRoute, redirect } from "@tanstack/react-router";

/** Canonical home: operational dashboard (not a duplicate command-center shell). */
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard" });
	},
});
