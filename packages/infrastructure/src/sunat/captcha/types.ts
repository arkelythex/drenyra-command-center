export interface CaptchaRequest {
	type: "image" | "recaptcha_v2" | "recaptcha_v3" | "hcaptcha";
	imageBase64?: string;
	siteKey?: string;
	pageUrl?: string;
}

export interface CaptchaResult {
	success: boolean;
	solution?: string;
	taskId?: string;
	error?: string;
	timing?: {
		startedAt: string;
		completedAt: string;
		durationMs: number;
	};
}

export interface CaptchaProvider {
	name: string;
	solve(request: CaptchaRequest): Promise<CaptchaResult>;
}
