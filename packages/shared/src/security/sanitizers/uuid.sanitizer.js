const UUID_PATTERNS = {
	4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
	5: /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
	7: /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};
function detectUuidVersion(uuid) {
	const versionChar = uuid.charAt(14);
	switch (versionChar) {
		case "4":
			return 4;
		case "5":
			return 5;
		case "7":
			return 7;
		default:
			return null;
	}
}
export function sanitizeUuid(uuid, allowedVersions = [4, 5, 7]) {
	if (typeof uuid !== "string") {
		return {
			value: null,
			isValid: false,
			version: null,
			normalized: null,
		};
	}
	const trimmed = uuid.trim();
	if (!trimmed) {
		return {
			value: null,
			isValid: false,
			version: null,
			normalized: null,
		};
	}
	const normalized = trimmed.toLowerCase();
	const detectedVersion = detectUuidVersion(normalized);
	if (!detectedVersion || !allowedVersions.includes(detectedVersion)) {
		return {
			value: null,
			isValid: false,
			version: detectedVersion,
			normalized,
		};
	}
	const pattern = UUID_PATTERNS[detectedVersion];
	const isValid = pattern.test(normalized);
	return {
		value: isValid ? normalized : null,
		isValid,
		version: detectedVersion,
		normalized,
	};
}
export function sanitizeUuidBatch(uuids, allowedVersions) {
	return uuids.map((uuid) => sanitizeUuid(uuid, allowedVersions));
}
export function isValidUuid(value, version) {
	if (typeof value !== "string") return false;
	const result = sanitizeUuid(value, version ? [version] : undefined);
	return result.isValid;
}
