/**
 * Captcha Solver Service
 *
 * Integrates with captcha solving services (2Captcha, Anti-Captcha)
 * for SUNAT RUC validation which requires captcha.
 *
 * @module infrastructure/sunat/captcha-solver
 * @example
 * ```ts
 * const value: CaptchaRequest = {} as CaptchaRequest;
 * console.log(value);
 * ```
 */

export interface CaptchaRequest {
	type: "image" | "recaptcha_v2" | "recaptcha_v3" | "hcaptcha";
	imageBase64?: string; // For image captcha
	siteKey?: string; // For reCAPTCHA/hCaptcha
	pageUrl?: string; // URL where captcha appears
}

/**
 * CaptchaResult interface.
 *
 * @example
 * ```ts
 * const value: CaptchaResult = {} as CaptchaResult;
 * console.log(value);
 * ```
 */
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

interface CaptchaProvider {
	name: string;
	solve(request: CaptchaRequest): Promise<CaptchaResult>;
}

// ============================================
// 2CAPTCHA PROVIDER
// ============================================

class TwoCaptchaProvider implements CaptchaProvider {
	name = "2captcha";
	private apiKey: string;
	private baseUrl = "http://2captcha.com";

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async solve(request: CaptchaRequest): Promise<CaptchaResult> {
		const startedAt = new Date();

		try {
			// Step 1: Submit captcha
			let submitParams: Record<string, string> = {
				key: this.apiKey,
				json: "1",
			};

			if (request.type === "image" && request.imageBase64) {
				submitParams = {
					...submitParams,
					method: "base64",
					body: request.imageBase64,
				};
			} else if (
				request.type === "recaptcha_v2" &&
				request.siteKey &&
				request.pageUrl
			) {
				submitParams = {
					...submitParams,
					method: "userrecaptcha",
					googlekey: request.siteKey,
					pageurl: request.pageUrl,
				};
			} else {
				throw new Error(`Unsupported captcha type: ${request.type}`);
			}

			// Submit to 2captcha
			const submitResponse = await fetch(`${this.baseUrl}/in.php`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams(submitParams),
			});

			const submitResult = await submitResponse.json();

			if (submitResult.status !== 1) {
				throw new Error(`2Captcha submit error: ${submitResult.request}`);
			}

			const taskId = submitResult.request;
			console.info(`[Captcha] Task submitted: ${taskId}`);

			// Step 2: Poll for result
			const maxAttempts = 30;
			const pollInterval = 5000; // 5 seconds

			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				await new Promise((resolve) => setTimeout(resolve, pollInterval));

				const resultResponse = await fetch(
					`${this.baseUrl}/res.php?key=${this.apiKey}&action=get&id=${taskId}&json=1`,
				);
				const result = await resultResponse.json();

				if (result.status === 1) {
					const completedAt = new Date();
					return {
						success: true,
						solution: result.request,
						taskId,
						timing: {
							startedAt: startedAt.toISOString(),
							completedAt: completedAt.toISOString(),
							durationMs: completedAt.getTime() - startedAt.getTime(),
						},
					};
				} else if (result.request !== "CAPCHA_NOT_READY") {
					throw new Error(`2Captcha error: ${result.request}`);
				}

				console.info(
					`[Captcha] Waiting for solution... (attempt ${attempt + 1}/${maxAttempts})`,
				);
			}

			throw new Error(
				"2Captcha timeout: solution not ready after max attempts",
			);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// ============================================
// ANTI-CAPTCHA PROVIDER
// ============================================

class AntiCaptchaProvider implements CaptchaProvider {
	name = "anticaptcha";
	private apiKey: string;
	private baseUrl = "https://api.anti-captcha.com";

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async solve(request: CaptchaRequest): Promise<CaptchaResult> {
		const startedAt = new Date();

		try {
			// Step 1: Create task
			let task: Record<string, unknown>;

			if (request.type === "image" && request.imageBase64) {
				task = {
					type: "ImageToTextTask",
					body: request.imageBase64,
				};
			} else if (
				request.type === "recaptcha_v2" &&
				request.siteKey &&
				request.pageUrl
			) {
				task = {
					type: "RecaptchaV2TaskProxyless",
					websiteURL: request.pageUrl,
					websiteKey: request.siteKey,
				};
			} else {
				throw new Error(`Unsupported captcha type: ${request.type}`);
			}

			const createResponse = await fetch(`${this.baseUrl}/createTask`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					clientKey: this.apiKey,
					task,
				}),
			});

			const createResult = await createResponse.json();

			if (createResult.errorId !== 0) {
				throw new Error(`Anti-Captcha error: ${createResult.errorDescription}`);
			}

			const taskId = createResult.taskId;
			console.info(`[Captcha] Task created: ${taskId}`);

			// Step 2: Poll for result
			const maxAttempts = 30;
			const pollInterval = 5000;

			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				await new Promise((resolve) => setTimeout(resolve, pollInterval));

				const resultResponse = await fetch(`${this.baseUrl}/getTaskResult`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						clientKey: this.apiKey,
						taskId,
					}),
				});

				const result = await resultResponse.json();

				if (result.status === "ready") {
					const completedAt = new Date();
					return {
						success: true,
						solution:
							result.solution?.text || result.solution?.gRecaptchaResponse,
						taskId: String(taskId),
						timing: {
							startedAt: startedAt.toISOString(),
							completedAt: completedAt.toISOString(),
							durationMs: completedAt.getTime() - startedAt.getTime(),
						},
					};
				} else if (result.errorId !== 0) {
					throw new Error(`Anti-Captcha error: ${result.errorDescription}`);
				}

				console.info(
					`[Captcha] Waiting for solution... (attempt ${attempt + 1}/${maxAttempts})`,
				);
			}

			throw new Error(
				"Anti-Captcha timeout: solution not ready after max attempts",
			);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// ============================================
// CAPTCHA SERVICE FACTORY
// ============================================

let solverInstance: CaptchaProvider | null = null;

/**
 * Get configured captcha solver
 * @returns Result of getCaptchaSolver.
 * @throws Error when getCaptchaSolver cannot complete successfully.
 * @example
 * ```ts
 * const result = getCaptchaSolver();
 * console.log(result);
 * ```
 */

export function getCaptchaSolver(): CaptchaProvider {
	if (solverInstance) return solverInstance;

	const service = process.env.CAPTCHA_SERVICE || "2captcha";
	const apiKey = process.env.CAPTCHA_API_KEY;

	if (!apiKey) {
		throw new Error("CAPTCHA_API_KEY is not configured");
	}

	switch (service.toLowerCase()) {
		case "2captcha":
			solverInstance = new TwoCaptchaProvider(apiKey);
			break;
		case "anticaptcha":
			solverInstance = new AntiCaptchaProvider(apiKey);
			break;
		default:
			throw new Error(`Unknown captcha service: ${service}`);
	}

	console.info(`[Captcha] Initialized ${service} provider`);
	return solverInstance;
}

/**
 * Solve captcha (convenience wrapper)
 * @param request - Input for request.
 * @returns Result of solveCaptcha.
 * @example
 * ```ts
 * const result = await solveCaptcha({} as CaptchaRequest);
 * console.log(result);
 * ```
 */

export async function solveCaptcha(
	request: CaptchaRequest,
): Promise<CaptchaResult> {
	const solver = getCaptchaSolver();
	return solver.solve(request);
}
