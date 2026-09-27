import { z } from "zod";
export declare const CfoQuerySchema: z.ZodObject<{
    companyId: z.ZodString;
    currency: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"PEN">, z.ZodLiteral<"USD">]>>;
}, z.core.$strip>;
export declare const CfoDateRangeQuerySchema: z.ZodObject<{
    companyId: z.ZodString;
    currency: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"PEN">, z.ZodLiteral<"USD">]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CfoPeriodQuerySchema: z.ZodObject<{
    companyId: z.ZodString;
    currency: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"PEN">, z.ZodLiteral<"USD">]>>;
    period: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"monthly">, z.ZodLiteral<"quarterly">, z.ZodLiteral<"yearly">]>>;
}, z.core.$strip>;
export declare const SaveConfigSchema: z.ZodObject<{
    companyId: z.ZodString;
    name: z.ZodString;
    config: z.ZodObject<{
        widgets: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            position: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                w: z.ZodNumber;
                h: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        layout: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const GenerateReportSchema: z.ZodObject<{
    companyId: z.ZodString;
    type: z.ZodUnion<readonly [z.ZodLiteral<"financial">, z.ZodLiteral<"tax">, z.ZodLiteral<"client">, z.ZodLiteral<"custom">]>;
    period: z.ZodOptional<z.ZodString>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type CfoQuery = z.infer<typeof CfoQuerySchema>;
export type CfoDateRangeQuery = z.infer<typeof CfoDateRangeQuerySchema>;
export type CfoPeriodQuery = z.infer<typeof CfoPeriodQuerySchema>;
export type SaveConfigBody = z.infer<typeof SaveConfigSchema>;
export type GenerateReportBody = z.infer<typeof GenerateReportSchema>;
//# sourceMappingURL=schemas.d.ts.map