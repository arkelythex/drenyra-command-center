/**
 * FEOS — API Routes
 *
 * Elysia routes for the Financial Engineering OS API.
 * Provides workspace management, attention rollups, tool contracts,
 * agent events, and evidence root endpoints.
 */

import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../../features/shared/api-response";
import { companyScopeGuard } from "../../shared/plugins";
import { feosController } from "./feos.controller";

export const feosRoutes = new Elysia({ prefix: "/api/v1/feos" })
  .use(companyScopeGuard({ allowHeaderFallback: true }))

  // ── Workspace CRUD ──────────────────────────────────────────────────────

  .post(
    "/workspaces",
    async ({ body }) => {
      try {
        const result = feosController.createWorkspace(body);
        return ok(result);
      } catch (error) {
        return fail("Failed to create workspace", "WORKSPACE_CREATE_ERROR", {
          details: getErrorMessage(error),
        });
      }
    },
    {
      body: t.Object({
        organizationId: t.String({ format: "uuid" }),
        companyId: t.String({ format: "uuid" }),
        companyRuc: t.String({ pattern: "^\\d{11}$" }),
        period: t.Object({
          year: t.Number({ minimum: 2020, maximum: 2100 }),
          month: t.Number({ minimum: 1, maximum: 12 }),
        }),
        intent: t.Enum({
          close: "close",
          reconcile: "reconcile",
          review: "review",
          investigate: "investigate",
          configure: "configure",
          report: "report",
          audit: "audit",
          submission: "submission",
        }),
        label: t.String({ minLength: 1, maxLength: 200 }),
        description: t.Optional(t.String({ maxLength: 1000 })),
        createdBy: t.Object({
          id: t.String(),
          type: t.Enum({ user: "user", agent: "agent", system: "system", automation: "automation" }),
          label: t.String(),
        }),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
    },
  )

  .get(
    "/workspaces/:id",
    async ({ params: { id } }) => {
      const result = feosController.getWorkspace(id);
      if ("error" in result) {
        return fail(result.error, result.code);
      }
      return ok(result);
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )

  .get(
    "/workspaces",
    async ({ query: { companyId } }) => {
      const result = feosController.listWorkspaces(companyId);
      return ok(result);
    },
    {
      query: t.Object({
        companyId: t.Optional(t.String({ format: "uuid" })),
      }),
    },
  )

  .post(
    "/workspaces/:id/transition",
    async ({ params: { id }, body }) => {
      const result = feosController.transitionWorkspace(id, body.action, body.params);
      if ("error" in result) {
        return fail(result.error, result.code);
      }
      return ok(result);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        action: t.String({ minLength: 1 }),
        params: t.Optional(t.Record(t.String(), t.Any())),
      }),
    },
  )

  // ── Portfolio / Attention ──────────────────────────────────────────────

  .get(
    "/portfolio/:organizationId",
    async ({ params: { organizationId } }) => {
      const result = feosController.getPortfolioStatus(organizationId);
      return ok(result);
    },
    {
      params: t.Object({ organizationId: t.String({ format: "uuid" }) }),
    },
  )

  .get(
    "/attention/:organizationId",
    async ({ params: { organizationId } }) => {
      const result = feosController.getAttentionInbox(organizationId);
      return ok(result);
    },
    {
      params: t.Object({ organizationId: t.String({ format: "uuid" }) }),
    },
  )

  // ── Tool Contracts ─────────────────────────────────────────────────────

  .get(
    "/tool-contracts",
    async () => {
      const result = feosController.listToolContracts();
      return ok(result);
    },
  )

  .get(
    "/tool-contracts/:name",
    async ({ params: { name } }) => {
      const result = feosController.getToolContract(name);
      if ("error" in result) {
        return fail(result.error, result.code);
      }
      return ok(result);
    },
    {
      params: t.Object({ name: t.String() }),
    },
  )

  .post(
    "/tool-contracts/validate",
    async ({ body }) => {
      const result = feosController.validateToolCall(body.toolName, body.riskLevel);
      return ok(result);
    },
    {
      body: t.Object({
        toolName: t.String({ minLength: 1 }),
        riskLevel: t.Enum({ R0: "R0", R1: "R1", R2: "R2", R3: "R3" }),
      }),
    },
  )

  // ── Agent Events ───────────────────────────────────────────────────────

  .post(
    "/events",
    async ({ body }) => {
      try {
        const result = feosController.publishEvent(body);
        return ok(result);
      } catch (error) {
        return fail("Failed to publish event", "EVENT_PUBLISH_ERROR", {
          details: getErrorMessage(error),
        });
      }
    },
    {
      body: t.Object({
        kind: t.String({ minLength: 1 }),
        title: t.String({ minLength: 1 }),
        description: t.String(),
        actor: t.Object({
          id: t.String(),
          type: t.Enum({ user: "user", agent: "agent", system: "system", automation: "automation" }),
          label: t.String(),
        }),
        scope: t.Object({
          organizationId: t.String(),
          companyId: t.String(),
          companyRuc: t.String(),
          fiscalPeriod: t.String(),
        }),
        traceId: t.String(),
        workspaceId: t.Optional(t.String()),
        toolName: t.Optional(t.String()),
      }),
    },
  )

  .get(
    "/events/workspace/:workspaceId",
    async ({ params: { workspaceId } }) => {
      const result = feosController.getWorkspaceEvents(workspaceId);
      return ok(result);
    },
    {
      params: t.Object({ workspaceId: t.String() }),
    },
  )

  .get(
    "/events/trace/:traceId",
    async ({ params: { traceId } }) => {
      const result = feosController.getEventTrace(traceId);
      return ok(result);
    },
    {
      params: t.Object({ traceId: t.String() }),
    },
  )

  .get(
    "/workflow/:workspaceId",
    async ({ params: { workspaceId } }) => {
      const result = feosController.projectWorkflow(workspaceId);
      if (!result) {
        return fail("No events found for workspace", "NO_EVENTS");
      }
      return ok(result);
    },
    {
      params: t.Object({ workspaceId: t.String() }),
    },
  )

  // ── Evidence Root ──────────────────────────────────────────────────────

  .post(
    "/evidence-root",
    async ({ body }) => {
      try {
        const result = feosController.computeEvidenceRoot(body.items);
        return ok(result);
      } catch (error) {
        return fail("Failed to compute evidence root", "EVIDENCE_ROOT_ERROR", {
          details: getErrorMessage(error),
        });
      }
    },
    {
      body: t.Object({
        items: t.Array(
          t.Object({
            id: t.String(),
            category: t.Enum({
              document: "document",
              calculation: "calculation",
              validation: "validation",
              approval: "approval",
              audit: "audit",
              external: "external",
              receipt: "receipt",
            }),
            title: t.String(),
            hash: t.String(),
            timestamp: t.String(),
            size: t.Optional(t.Number()),
            mimeType: t.Optional(t.String()),
            ref: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String())),
          }),
          { minItems: 1 },
        ),
      }),
    },
  )

  .get(
    "/evidence-root/:id/verify",
    async ({ params: { id } }) => {
      const result = feosController.verifyEvidenceRoot(id);
      return ok(result);
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )

  .post(
    "/receipts",
    async ({ body }) => {
      try {
        const result = feosController.createReceipt(body);
        return ok(result);
      } catch (error) {
        return fail("Failed to create receipt", "RECEIPT_CREATE_ERROR", {
          details: getErrorMessage(error),
        });
      }
    },
    {
      body: t.Object({
        action: t.String({ minLength: 1 }),
        actor: t.Object({
          id: t.String(),
          type: t.Enum({ user: "user", agent: "agent", system: "system", automation: "automation" }),
          label: t.String(),
        }),
        scope: t.Object({
          organizationId: t.String(),
          companyId: t.String(),
          companyRuc: t.String(),
          fiscalPeriod: t.String(),
        }),
        evidenceItems: t.Array(
          t.Object({
            id: t.String(),
            category: t.String(),
            title: t.String(),
            hash: t.String(),
            timestamp: t.String(),
          }),
          { minItems: 1 },
        ),
        actionInput: t.Any(),
        actionOutput: t.Any(),
        previousChainHash: t.Optional(t.String()),
      }),
    },
  )

  .post(
    "/receipts/verify",
    async ({ body }) => {
      const result = feosController.verifyReceipt(body);
      return ok(result);
    },
    {
      body: t.Any(),
    },
  );
