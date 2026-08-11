/** U1b.2 — minimal fail-closed, deterministic schema validator; semantic checks (traversal, duplicate IDs, owner mismatch, stale writes) arrive in U1c/U2. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import { parse as parseYaml } from "yaml";
import { dedupeSorted } from "./validation-utils.js";
export interface SchemaValidationResult {
	valid: boolean;
	errors: string[];
}
const SCHEMA_PATH = fileURLToPath(
	new URL("../ledger.schema.json", import.meta.url),
);
const ajv = new Ajv2020({
	strict: true,
	allErrors: true,
	validateSchema: true,
});
interface AjvErrorLike {
	instancePath?: string;
	keyword?: string;
	message?: string;
	params?: Record<string, unknown>;
}
let validateLedger: ReturnType<Ajv2020["compile"]> | null = null;
try {
	const schema: unknown = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
	if (schema !== null && typeof schema === "object" && !Array.isArray(schema)) {
		validateLedger = ajv.compile(schema as Record<string, unknown>);
	}
} catch {
	validateLedger = null;
}
function formatAjvErrors(
	errors: readonly AjvErrorLike[] | null | undefined,
): string[] {
	if (!errors || errors.length === 0) return ["schema validation failed"];
	const lines = errors.map((err) => {
		const where =
			err.instancePath && err.instancePath.length > 0
				? err.instancePath
				: "(root)";
		const detail =
			err.params && typeof err.params.additionalProperty === "string"
				? ` unknown key "${err.params.additionalProperty}"`
				: "";
		return `${where} ${err.keyword ?? "error"}: ${err.message ?? "invalid"}${detail}`;
	});
	return dedupeSorted(lines);
}
export function validateLedgerYaml(yamlText: string): SchemaValidationResult {
	let data: unknown;
	try {
		data = parseYaml(yamlText);
	} catch (error) {
		return { valid: false, errors: [`yaml parse error: ${String(error)}`] };
	}
	if (data === null || typeof data !== "object" || Array.isArray(data)) {
		return { valid: false, errors: ["ledger root must be a YAML mapping"] };
	}
	if (validateLedger === null)
		return {
			valid: false,
			errors: [
				"schema validation unavailable: ledger.schema.json failed to compile",
			],
		};
	if (validateLedger(data)) return { valid: true, errors: [] };
	return { valid: false, errors: formatAjvErrors(validateLedger.errors) };
}
export function validateLedgerFile(filePath: string): SchemaValidationResult {
	try {
		return validateLedgerYaml(readFileSync(filePath, "utf8"));
	} catch (error) {
		return { valid: false, errors: [`read error: ${String(error)}`] };
	}
}
