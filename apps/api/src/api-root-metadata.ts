import { CANONICAL_SWAGGER_PATH } from "./swagger-docs-routes";

export interface ApiRootMetadata {
	status: "online";
	service: "Arkelythex API v2.0.0";
	profile: "standard";
	docs: typeof CANONICAL_SWAGGER_PATH;
}

export function getApiRootMetadata(): ApiRootMetadata {
	return {
		status: "online",
		service: "Arkelythex API v2.0.0",
		profile: "standard",
		docs: CANONICAL_SWAGGER_PATH,
	};
}
