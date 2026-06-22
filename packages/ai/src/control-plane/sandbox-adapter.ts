import { z } from "zod";

const SandboxCapabilitySchema = z.enum([
	"read-sdd-artifacts",
	"list-safe-checks",
	"review-redacted-fixtures",
	"draft-proposal-spec-tasks",
]);

const ForbiddenSandboxCategorySchema = z.enum([
	"production-data-access",
	"sunat-ose-credential-access",
	"fiscal-mutation",
	"db-mutation",
	"raw-shell-execution",
	"wildcard-permissions",
]);

const DataClassificationSchema = z.enum([
	"synthetic",
	"redacted",
	"production",
	"unknown",
]);

const ExecutionEnvironmentSchema = z.enum([
	"engineering-sandbox",
	"production",
	"staging",
]);

const nonEmpty = z.string().min(1);

const CodexSandboxOperationRequestSchema = z.object({
	operation: nonEmpty,
	dataClassification: DataClassificationSchema,
	environment: ExecutionEnvironmentSchema,
	capabilityScope: z.array(nonEmpty).min(1),
});

export type SandboxCapabilityName = z.infer<typeof SandboxCapabilitySchema>;
export type ForbiddenSandboxCategory = z.infer<
	typeof ForbiddenSandboxCategorySchema
>;
export type DataClassification = z.infer<typeof DataClassificationSchema>;
export type ExecutionEnvironment = z.infer<typeof ExecutionEnvironmentSchema>;
export type CodexSandboxOperationRequest = z.infer<
	typeof CodexSandboxOperationRequestSchema
>;

export type SandboxDenyReasonCode =
	| "INVALID_REQUEST"
	| "PRODUCTION_CONTEXT_FORBIDDEN"
	| "DATA_CLASSIFICATION_NOT_ALLOWED"
	| "CAPABILITY_NOT_ALLOWED"
	| "WILDCARD_PERMISSION_FORBIDDEN"
	| "RAW_SHELL_EXECUTION_BLOCKED"
	| "SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED"
	| "FISCAL_MUTATION_BLOCKED"
	| "DB_MUTATION_BLOCKED"
	| "PRODUCTION_DATA_ACCESS_BLOCKED";

export interface SandboxAdvisoryMetadata {
	sandboxOnly: true;
	advisoryOnly: true;
	allowedCapabilities: readonly SandboxCapabilityName[];
	forbiddenCategories: readonly ForbiddenSandboxCategory[];
	executableCommand: null;
}

export type SandboxValidationResult =
	| {
			allowed: true;
			metadata: SandboxAdvisoryMetadata;
	  }
	| {
			allowed: false;
			reasonCode: SandboxDenyReasonCode;
			metadata: SandboxAdvisoryMetadata;
	  };

const ALLOWED_CAPABILITIES: readonly SandboxCapabilityName[] =
	SandboxCapabilitySchema.options;

const FORBIDDEN_CATEGORIES: readonly ForbiddenSandboxCategory[] =
	ForbiddenSandboxCategorySchema.options;

const PRODUCTION_ONLY_DATA: readonly DataClassification[] = [
	"production",
	"unknown",
];

const SAFE_DATA_CLASSIFICATIONS: readonly DataClassification[] = [
	"synthetic",
	"redacted",
];

const advisoryMetadata = (): SandboxAdvisoryMetadata => ({
	sandboxOnly: true,
	advisoryOnly: true,
	allowedCapabilities: ALLOWED_CAPABILITIES,
	forbiddenCategories: FORBIDDEN_CATEGORIES,
	executableCommand: null,
});

const hasWildcardPermissionPattern = (value: string): boolean =>
	value === "*" || value.includes("*");

const hasRawShellPattern = (value: string): boolean => {
	const normalized = value.toLowerCase();
	return (
		normalized.includes("bash") ||
		normalized.includes("shell") ||
		normalized.includes("sh:") ||
		normalized.includes("cmd:")
	);
};

const hasCredentialOrSecretPattern = (value: string): boolean => {
	const normalized = value.toLowerCase();
	return (
		normalized.includes("token") ||
		normalized.includes("secret") ||
		normalized.includes("api_key") ||
		normalized.includes("apikey") ||
		normalized.includes("credential")
	);
};

const hasProductionDataPattern = (value: string): boolean => {
	const normalized = value.toLowerCase();
	return (
		normalized.includes("erp.production") ||
		normalized.startsWith("postgresql://") ||
		normalized.startsWith("postgres://") ||
		normalized.startsWith("mysql://") ||
		normalized.startsWith("mongodb://")
	);
};

const reasonFromCapabilityScope = (
	capabilityScope: readonly string[],
): SandboxDenyReasonCode | null => {
	for (const capability of capabilityScope) {
		if (hasRawShellPattern(capability)) {
			return "RAW_SHELL_EXECUTION_BLOCKED";
		}

		if (hasWildcardPermissionPattern(capability)) {
			return "WILDCARD_PERMISSION_FORBIDDEN";
		}

		if (hasProductionDataPattern(capability)) {
			return "PRODUCTION_DATA_ACCESS_BLOCKED";
		}

		if (hasCredentialOrSecretPattern(capability)) {
			return "SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED";
		}
	}

	return null;
};

const isUnsafeOperation = (operation: string): SandboxDenyReasonCode | null => {
	if (operation === "execute-safe-check") {
		return "RAW_SHELL_EXECUTION_BLOCKED";
	}

	if (operation.startsWith("sunat.") || operation.startsWith("ose.")) {
		return "SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED";
	}

	if (operation.startsWith("fiscal.")) {
		return "FISCAL_MUTATION_BLOCKED";
	}

	if (operation.startsWith("db.")) {
		return "DB_MUTATION_BLOCKED";
	}

	if (operation.startsWith("erp.production.")) {
		return "PRODUCTION_DATA_ACCESS_BLOCKED";
	}

	return null;
};

export const validateCodexSandboxOperation = (
	request: unknown,
): SandboxValidationResult => {
	const metadata = advisoryMetadata();
	const parsed = CodexSandboxOperationRequestSchema.safeParse(request);

	if (!parsed.success) {
		return {
			allowed: false,
			reasonCode: "INVALID_REQUEST",
			metadata,
		};
	}

	const candidate = parsed.data;

	if (candidate.environment !== "engineering-sandbox") {
		return {
			allowed: false,
			reasonCode: "PRODUCTION_CONTEXT_FORBIDDEN",
			metadata,
		};
	}

	if (PRODUCTION_ONLY_DATA.includes(candidate.dataClassification)) {
		return {
			allowed: false,
			reasonCode: "DATA_CLASSIFICATION_NOT_ALLOWED",
			metadata,
		};
	}

	if (!SAFE_DATA_CLASSIFICATIONS.includes(candidate.dataClassification)) {
		return {
			allowed: false,
			reasonCode: "DATA_CLASSIFICATION_NOT_ALLOWED",
			metadata,
		};
	}

	const capabilityScopeReason = reasonFromCapabilityScope(
		candidate.capabilityScope,
	);
	if (capabilityScopeReason) {
		return {
			allowed: false,
			reasonCode: capabilityScopeReason,
			metadata,
		};
	}

	if (
		!ALLOWED_CAPABILITIES.includes(candidate.operation as SandboxCapabilityName)
	) {
		const unsafeReason = isUnsafeOperation(candidate.operation);
		if (unsafeReason) {
			return {
				allowed: false,
				reasonCode: unsafeReason,
				metadata,
			};
		}

		return {
			allowed: false,
			reasonCode: "CAPABILITY_NOT_ALLOWED",
			metadata,
		};
	}

	if (!candidate.capabilityScope.includes(candidate.operation)) {
		return {
			allowed: false,
			reasonCode: "CAPABILITY_NOT_ALLOWED",
			metadata,
		};
	}

	return {
		allowed: true,
		metadata,
	};
};

export const codexSandboxAdapter = {
	validate: validateCodexSandboxOperation,
};
