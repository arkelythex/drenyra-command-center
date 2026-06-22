-- P5 Granular Permissions — AI Tool Permissions Table
--
-- Adds the ai_tool_permissions table for granular tool-level permission
-- control. Supports company-scoped ALLOW/DENY/REQUIRE_APPROVAL entries.
--
-- Related:
--   schema/ai-control-plane.schema.ts (aiToolPermissions table)
--   packages/ai/src/governance/permission-service.ts
--

CREATE TABLE IF NOT EXISTS "ai_tool_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_name" text NOT NULL,
	"effect" text NOT NULL,
	"company_id" uuid,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_tool_permissions_tool_company" ON "ai_tool_permissions" USING btree ("tool_name", "company_id");
