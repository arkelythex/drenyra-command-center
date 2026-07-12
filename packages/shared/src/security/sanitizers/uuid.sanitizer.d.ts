export type UuidVersion = 4 | 5 | 7;
export interface UuidSanitizeResult {
	value: string | null;
	isValid: boolean;
	version: UuidVersion | null;
	normalized: string | null;
}
export declare function sanitizeUuid(
	uuid: unknown,
	allowedVersions?: UuidVersion[],
): UuidSanitizeResult;
export declare function sanitizeUuidBatch(
	uuids: unknown[],
	allowedVersions?: UuidVersion[],
): UuidSanitizeResult[];
export declare function isValidUuid(
	value: unknown,
	version?: UuidVersion,
): value is string;
//# sourceMappingURL=uuid.sanitizer.d.ts.map
