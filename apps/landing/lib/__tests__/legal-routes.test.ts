import { describe, expect, it } from "vitest";

import { metadata as cookiesMetadata } from "@/app/cookies/page";
import { metadata as legalMetadata } from "@/app/legal/page";
import { metadata as privacyMetadata } from "@/app/privacy/page";
import { metadata as termsMetadata } from "@/app/terms/page";

describe("legal route metadata", () => {
	it("exposes canonical legal routes", () => {
		expect(privacyMetadata.alternates?.canonical).toBe("/privacy");
		expect(termsMetadata.alternates?.canonical).toBe("/terms");
		expect(cookiesMetadata.alternates?.canonical).toBe("/cookies");
		expect(legalMetadata.alternates?.canonical).toBe("/legal");
	});
});
