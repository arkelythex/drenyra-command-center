/**
 * Domain: Microkernel
 *
 * HarmonyOS Microkernel fault isolation implementation
 */

export {
	executeWithIsolation,
	getAllModuleHealth,
	getFailedModules,
	getModuleHealth,
	isSystemDegraded,
	registerModule,
	resetModuleHealth,
} from "./fault-isolation-guard";
