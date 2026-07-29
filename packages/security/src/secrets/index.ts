/**
 * Secrets module — provider abstraction, inventory, and validation.
 */

export type {
	SecretProvider,
	ValidationResult,
	ValidationError,
	ValidationWarning,
} from "./provider";
export { SecretNotFoundError } from "./provider";
export { EnvProvider } from "./env-provider";
export { SECRETS_INVENTORY } from "./inventory";
export type { SecretMetadata } from "./inventory";
export { validateSecrets } from "./validation";

/** Default singleton: env-var backed provider. */
import { EnvProvider } from "./env-provider";
export const secrets = new EnvProvider();
