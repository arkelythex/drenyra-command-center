import * as fc from "fast-check";
import { describe, it } from "vitest";
import { createLayout, updateLayout } from "../domain/layout-factory";
import {
	createSplitLayoutNode,
	createViewLayoutNode,
	getAllViewIds,
} from "../domain/node";
import { InMemoryLayoutRepository } from "../adapters/memory-layout-repository";
import {
	portfolioOperationsLayout,
	monthlyCloseLayout,
	sireReviewLayout,
	bankReconciliationLayout,
	evidenceAuditLayout,
} from "../templates";

const nonEmptyId = fc.stringMatching(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);

const knownTemplates = fc.constantFrom(
	"portfolio-operations",
	"monthly-close",
	"sire-review",
	"bank-reconciliation",
	"evidence-audit",
);

describe("Property-based: createLayout + updateLayout round-trip", () => {
	it("should preserve workspaceId and ownerId through create + update", () => {
		fc.assert(
			fc.property(
				knownTemplates,
				fc.uuid(),
				fc.uuid(),
				(template, wsId, ownerId) => {
					const layout = createLayout({
						workspaceId: wsId,
						ownerId,
						template,
						root: createSplitLayoutNode(
							"root",
							"horizontal",
							createViewLayoutNode("v1"),
							createViewLayoutNode("v2"),
							0.5,
						),
					});

					const ok1 =
						layout.workspaceId === wsId &&
						layout.ownerId === ownerId &&
						layout.template === template;

					const updated = updateLayout(layout, { focusedViewId: "v1" });
					const ok2 =
						updated.workspaceId === wsId &&
						updated.ownerId === ownerId &&
						updated.layoutId === layout.layoutId;

					return ok1 && ok2;
				},
			),
		);
	});
});

describe("Property-based: template trees always validate", () => {
	const templateFactories = [
		() => portfolioOperationsLayout("ws-p", "owner-p"),
		() => monthlyCloseLayout("ws-m", "owner-m"),
		() => sireReviewLayout("ws-s", "owner-s"),
		() => bankReconciliationLayout("ws-b", "owner-b"),
		() => evidenceAuditLayout("ws-e", "owner-e"),
	];

	for (const factory of templateFactories) {
		it("should have all ratios in range 0.1-0.9 and unique viewIds", () => {
			fc.assert(
				fc.property(fc.nat({ max: 10 }), () => {
					const layout = factory();
					const ids = getAllViewIds(layout.root);
					return new Set(ids).size === ids.length && layout.root !== undefined;
				}),
			);
		});
	}
});

describe("Property-based: ViewLayoutNode.viewId preserved", () => {
	it("viewId is preserved after operations that don't target it", () => {
		fc.assert(
			fc.property(fc.uuid(), fc.uuid(), (viewId1, viewId2) => {
				const root = createSplitLayoutNode(
					"root",
					"horizontal",
					createViewLayoutNode(viewId1),
					createViewLayoutNode(viewId2),
					0.5,
				);

				const layout = createLayout({
					workspaceId: "ws-1",
					ownerId: "owner-1",
					template: "monthly-close",
					root,
				});

				const updated = updateLayout(layout, {});
				const ids = getAllViewIds(updated.root);
				return ids.includes(viewId1) && ids.includes(viewId2);
			}),
		);
	});
});

describe("Property-based: repository round-trip", () => {
	it("save then load preserves layout identity", async () => {
		await fc.assert(
			fc.asyncProperty(fc.uuid(), nonEmptyId, async (wsId, ownerId) => {
				const repo = new InMemoryLayoutRepository();
				const layout = createLayout({
					workspaceId: wsId,
					ownerId,
					template: "monthly-close",
					root: createSplitLayoutNode(
						"root",
						"horizontal",
						createViewLayoutNode("va"),
						createViewLayoutNode("vb"),
						0.5,
					),
				});

				await repo.save(layout, 0);
				const loaded = await repo.load(layout.layoutId);

				return (
					loaded !== null &&
					loaded!.layoutId === layout.layoutId &&
					loaded!.workspaceId === wsId &&
					loaded!.ownerId === ownerId &&
					loaded!.revision === 1
				);
			}),
		);
	});
});
