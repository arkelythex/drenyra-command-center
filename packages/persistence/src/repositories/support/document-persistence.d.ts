import { Document } from "@drenyra/domain/entities/Document";
import type { documents } from "../../schema/documents.schema";
export declare function mapDocumentToInsert(document: Document): typeof documents.$inferInsert;
export declare function mapDocumentToUpdate(document: Document): Partial<typeof documents.$inferInsert>;
export declare function mapDocumentRowToEntity(row: typeof documents.$inferSelect): Document;
//# sourceMappingURL=document-persistence.d.ts.map