// Stub — Company context utilities
export const DEMO_COMPANY_ID = "demo-1";
export const DEMO_COMPANY_NAME = "Demo Company";
export const DEMO_COMPANY_RUC = "20123456789";

export function clearActiveCompanyContext() {}
export function mergeUserWithStoredCompanyContext(user: unknown) {
	return user;
}
export function syncActiveCompanyContextFromUser(_user: unknown) {}
