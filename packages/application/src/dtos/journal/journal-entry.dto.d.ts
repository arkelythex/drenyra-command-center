import { z } from "zod";
export declare const CreateJournalLineSchema: z.ZodObject<{
    accountId: z.ZodString;
    description: z.ZodString;
    debit: z.ZodDefault<z.ZodNumber>;
    credit: z.ZodDefault<z.ZodNumber>;
    documentType: z.ZodOptional<z.ZodString>;
    documentNumber: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export declare const CreateJournalEntrySchema: z.ZodObject<{
    organizationId: z.ZodNumber;
    date: z.ZodDate;
    gloss: z.ZodString;
    lines: z.ZodArray<z.ZodObject<{
        accountId: z.ZodString;
        description: z.ZodString;
        debit: z.ZodDefault<z.ZodNumber>;
        credit: z.ZodDefault<z.ZodNumber>;
        documentType: z.ZodOptional<z.ZodString>;
        documentNumber: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateJournalLineDTO = z.infer<typeof CreateJournalLineSchema>;
export type CreateJournalEntryDTO = z.infer<typeof CreateJournalEntrySchema>;
export declare const UpdateJournalEntrySchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodDate>;
    gloss: z.ZodOptional<z.ZodString>;
    lines: z.ZodOptional<z.ZodArray<z.ZodObject<{
        accountId: z.ZodString;
        description: z.ZodString;
        debit: z.ZodDefault<z.ZodNumber>;
        credit: z.ZodDefault<z.ZodNumber>;
        documentType: z.ZodOptional<z.ZodString>;
        documentNumber: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodOptional<z.ZodDate>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type UpdateJournalEntryDTO = z.infer<typeof UpdateJournalEntrySchema>;
export declare const JournalEntryFiltersSchema: z.ZodObject<{
    organizationId: z.ZodNumber;
    status: z.ZodOptional<z.ZodEnum<{
        borrador: "borrador";
        mayorizado: "mayorizado";
        declarado: "declarado";
        all: "all";
    }>>;
    dateFrom: z.ZodOptional<z.ZodDate>;
    dateTo: z.ZodOptional<z.ZodDate>;
    minAmount: z.ZodOptional<z.ZodNumber>;
    maxAmount: z.ZodOptional<z.ZodNumber>;
    documentNumber: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type JournalEntryFiltersDTO = z.infer<typeof JournalEntryFiltersSchema>;
export interface JournalLineResponseDTO {
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: number;
    credit: number;
    documentType?: string;
    documentNumber?: string;
    dueDate?: string;
}
export interface JournalEntryResponseDTO {
    id: string;
    organizationId: number;
    entryNumber: string;
    date: string;
    gloss: string;
    status: "borrador" | "mayorizado" | "declarado";
    totalDebit: number;
    totalCredit: number;
    lines: JournalLineResponseDTO[];
    postedBy?: string;
    postedAt?: string;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=journal-entry.dto.d.ts.map