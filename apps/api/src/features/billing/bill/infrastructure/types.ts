import type { billItems, bills } from "@arkelythex/persistence/schema";

export type BillRow = typeof bills.$inferSelect;
export type BillItemRow = typeof billItems.$inferSelect;
