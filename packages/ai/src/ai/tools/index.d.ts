import { z } from "zod";
export declare const PCGEAccountParams: z.ZodObject<{
    description: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const IGVCalculationParams: z.ZodObject<{
    baseAmount: z.ZodNumber;
    includesIGV: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const DetractionParams: z.ZodObject<{
    amount: z.ZodNumber;
    serviceType: z.ZodEnum<{
        other: "other";
        construction: "construction";
        transport: "transport";
        rental: "rental";
    }>;
}, z.core.$strip>;
export declare const RUCValidationParams: z.ZodObject<{
    ruc: z.ZodString;
}, z.core.$strip>;
export declare function suggestPCGEAccount(_description: string): {
    cuenta: string;
    nombre: string;
    confidence: number;
};
export declare function calculateIGV(baseAmount: number, includesIGV?: boolean): {
    base: number;
    igv: number;
    total: number;
};
export declare function calculateDetraction(amount: number, serviceType: "construction" | "transport" | "rental" | "other"): {
    applies: boolean;
    rate: number;
    detractionAmount: number;
};
export declare function validateRUC(ruc: string): {
    valid: boolean;
    type?: string;
    error?: string;
};
export declare const fiscalTools: {
    readonly suggestPCGE: ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            description: string;
            amount?: number | undefined;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            description: string;
            amount?: number | undefined;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                description: string;
                amount?: number | undefined;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                description: string;
                amount?: number | undefined;
            };
            output: NoInfer<{
                cuenta: string;
                nombre: string;
                confidence: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            cuenta: string;
            nombre: string;
            confidence: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                description: string;
                amount?: number | undefined;
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type?: undefined | "function";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            description: string;
            amount?: number | undefined;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            description: string;
            amount?: number | undefined;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                description: string;
                amount?: number | undefined;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                description: string;
                amount?: number | undefined;
            };
            output: NoInfer<{
                cuenta: string;
                nombre: string;
                confidence: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            cuenta: string;
            nombre: string;
            confidence: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                description: string;
                amount?: number | undefined;
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type: "dynamic";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            description: string;
            amount?: number | undefined;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            description: string;
            amount?: number | undefined;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                description: string;
                amount?: number | undefined;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                description: string;
                amount?: number | undefined;
            };
            output: NoInfer<{
                cuenta: string;
                nombre: string;
                confidence: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            cuenta: string;
            nombre: string;
            confidence: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: false;
        supportsDeferredResults?: never;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            description: string;
            amount?: number | undefined;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            description: string;
            amount?: number | undefined;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                description: string;
                amount?: number | undefined;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                description: string;
                amount?: number | undefined;
            };
            output: NoInfer<{
                cuenta: string;
                nombre: string;
                confidence: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            cuenta: string;
            nombre: string;
            confidence: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: true;
        supportsDeferredResults?: boolean;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            description: string;
            amount?: number | undefined;
        }, {
            cuenta: string;
            nombre: string;
            confidence: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    });
    readonly calculateIGV: ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            baseAmount: number;
            includesIGV: boolean;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
            output: NoInfer<{
                base: number;
                igv: number;
                total: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            base: number;
            igv: number;
            total: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                baseAmount: number;
                includesIGV: boolean;
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type?: undefined | "function";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            baseAmount: number;
            includesIGV: boolean;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
            output: NoInfer<{
                base: number;
                igv: number;
                total: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            base: number;
            igv: number;
            total: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                baseAmount: number;
                includesIGV: boolean;
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type: "dynamic";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            baseAmount: number;
            includesIGV: boolean;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
            output: NoInfer<{
                base: number;
                igv: number;
                total: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            base: number;
            igv: number;
            total: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: false;
        supportsDeferredResults?: never;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            baseAmount: number;
            includesIGV: boolean;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                baseAmount: number;
                includesIGV: boolean;
            };
            output: NoInfer<{
                base: number;
                igv: number;
                total: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            base: number;
            igv: number;
            total: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: true;
        supportsDeferredResults?: boolean;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            baseAmount: number;
            includesIGV: boolean;
        }, {
            base: number;
            igv: number;
            total: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    });
    readonly calculateDetraction: ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
            output: NoInfer<{
                applies: boolean;
                rate: number;
                detractionAmount: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type?: undefined | "function";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
            output: NoInfer<{
                applies: boolean;
                rate: number;
                detractionAmount: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type: "dynamic";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
            output: NoInfer<{
                applies: boolean;
                rate: number;
                detractionAmount: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: false;
        supportsDeferredResults?: never;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                amount: number;
                serviceType: "other" | "construction" | "transport" | "rental";
            };
            output: NoInfer<{
                applies: boolean;
                rate: number;
                detractionAmount: number;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: true;
        supportsDeferredResults?: boolean;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            amount: number;
            serviceType: "other" | "construction" | "transport" | "rental";
        }, {
            applies: boolean;
            rate: number;
            detractionAmount: number;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    });
    readonly validateRUC: ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            ruc: string;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            ruc: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                ruc: string;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                ruc: string;
            };
            output: NoInfer<{
                valid: boolean;
                type?: string;
                error?: string;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            valid: boolean;
            type?: string;
            error?: string;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                ruc: string;
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type?: undefined | "function";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            ruc: string;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            ruc: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                ruc: string;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                ruc: string;
            };
            output: NoInfer<{
                valid: boolean;
                type?: string;
                error?: string;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            valid: boolean;
            type?: string;
            error?: string;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        description?: string | ((options: {
            context: NoInfer<import("@ai-sdk/provider-utils").Context>;
            experimental_sandbox?: import("ai").Experimental_SandboxSession;
        }) => string);
        strict?: boolean;
        inputExamples?: {
            input: NoInfer<{
                ruc: string;
            }>;
        }[];
        id?: never;
        isProviderExecuted?: never;
        args?: never;
        supportsDeferredResults?: never;
    } & {
        type: "dynamic";
    } & {
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            ruc: string;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            ruc: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                ruc: string;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                ruc: string;
            };
            output: NoInfer<{
                valid: boolean;
                type?: string;
                error?: string;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            valid: boolean;
            type?: string;
            error?: string;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: false;
        supportsDeferredResults?: never;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    }) | ({
        title?: string;
        providerOptions?: import("@ai-sdk/provider-utils").ProviderOptions;
        metadata?: import("@ai-sdk/provider").JSONObject;
        inputSchema: import("ai").FlexibleSchema<{
            ruc: string;
        }>;
        contextSchema?: import("ai").FlexibleSchema<import("@ai-sdk/provider-utils").Context>;
        needsApproval?: boolean | import("@ai-sdk/provider-utils").ToolNeedsApprovalFunction<{
            ruc: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
        onInputStart?: (options: import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputDelta?: (options: {
            inputTextDelta: string;
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        onInputAvailable?: (options: {
            input: {
                ruc: string;
            };
        } & import("ai").ToolExecutionOptions<NoInfer<import("@ai-sdk/provider-utils").Context>>) => void | PromiseLike<void>;
        toModelOutput?: (options: {
            toolCallId: string;
            input: {
                ruc: string;
            };
            output: NoInfer<{
                valid: boolean;
                type?: string;
                error?: string;
            }>;
        }) => import("@ai-sdk/provider-utils").ToolResultOutput | PromiseLike<import("@ai-sdk/provider-utils").ToolResultOutput>;
    } & {
        outputSchema?: import("ai").FlexibleSchema<{
            valid: boolean;
            type?: string;
            error?: string;
        }>;
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    } & {
        type: "provider";
        id: `${string}.${string}`;
        args: Record<string, unknown>;
        description?: never;
        strict?: never;
        inputExamples?: never;
    } & {
        isProviderExecuted: true;
        supportsDeferredResults?: boolean;
    } & {
        execute: import("ai").ToolExecuteFunction<{
            ruc: string;
        }, {
            valid: boolean;
            type?: string;
            error?: string;
        }, NoInfer<import("@ai-sdk/provider-utils").Context>>;
    });
};
//# sourceMappingURL=index.d.ts.map