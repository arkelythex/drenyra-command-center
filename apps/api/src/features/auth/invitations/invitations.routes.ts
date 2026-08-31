/**
 * Invitations routes.
 *
 * Elysia routes for invitation management.
 * Company-scoped routes require user:invite permission (checked in handlers).
 *
 * Routes:
 *   POST   /api/companies/:companyId/invitations        — Create invitation
 *   GET    /api/companies/:companyId/invitations        — List invitations
 *   DELETE /api/companies/:companyId/invitations/:id    — Cancel invitation
 *   POST   /api/invitations/:token/accept               — Accept invitation
 *   POST   /api/invitations/:token/reject               — Reject invitation
 *
 * @module invitations/invitations.routes
 */

import { type Context, Elysia, t } from "elysia";
import { acceptInvitation } from "./application/commands/accept-invitation.command";
import { cancelInvitation } from "./application/commands/cancel-invitation.command";
import { createInvitation } from "./application/commands/create-invitation.command";
import { rejectInvitation } from "./application/commands/reject-invitation.command";
import { listInvitations } from "./application/queries/list-invitations.query";

function toApplicationContext(ctx: Pick<Context, "headers" | "set">) {
	const headers = Object.fromEntries(
		Object.entries(ctx.headers).filter(
			(entry): entry is [string, string] => entry[1] !== undefined,
		),
	);

	return {
		headers,
		set: {
			get status(): number {
				return typeof ctx.set.status === "number" ? ctx.set.status : 200;
			},
			set status(status: number) {
				ctx.set.status = status;
			},
		},
	};
}

export const invitationRoutes = new Elysia({ prefix: "/api" })
	// ── Company-scoped (firm admin) ──
	.post(
		"/companies/:companyId/invitations",
		(ctx) =>
			createInvitation(
				{
					companyId: ctx.params.companyId,
					body: ctx.body as { email: string; role: string },
				},
				toApplicationContext(ctx),
			),
		{
			body: t.Object({
				email: t.String({ format: "email" }),
				role: t.String(),
			}),
			params: t.Object({
				companyId: t.String(),
			}),
		},
	)
	.get(
		"/companies/:companyId/invitations",
		(ctx) =>
			listInvitations(
				{ companyId: ctx.params.companyId },
				toApplicationContext(ctx),
			),
		{
			params: t.Object({
				companyId: t.String(),
			}),
		},
	)
	.delete(
		"/companies/:companyId/invitations/:id",
		(ctx) =>
			cancelInvitation(
				{ companyId: ctx.params.companyId, invitationId: ctx.params.id },
				toApplicationContext(ctx),
			),
		{
			params: t.Object({
				companyId: t.String(),
				id: t.String(),
			}),
		},
	)

	// ── Token-scoped (invitee) ──
	.post(
		"/invitations/:token/accept",
		(ctx) =>
			acceptInvitation({ token: ctx.params.token }, toApplicationContext(ctx)),
		{
			params: t.Object({
				token: t.String(),
			}),
		},
	)
	.post(
		"/invitations/:token/reject",
		(ctx) =>
			rejectInvitation({ token: ctx.params.token }, toApplicationContext(ctx)),
		{
			params: t.Object({
				token: t.String(),
			}),
		},
	);
