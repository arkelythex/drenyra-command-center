/**
 * SUNAT Stealth Scraper - Puppeteer-Extra with Anti-Detection
 *
 * Uses puppeteer-extra-plugin-stealth to avoid SUNAT's bot detection.
 * Fallback for Playwright when stealth is required.
 *
 * @module infrastructure/sunat/sunat-scraper-stealth
 */

import type { Browser, Page } from "puppeteer-core";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Enable stealth mode
puppeteer.use(StealthPlugin());

// Helper to wait (puppeteer doesn't have waitForTimeout in all versions)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// TYPES
// ============================================

/**
 * SunatCredentials interface.
 *
 * @example
 * ```ts
 * const value: SunatCredentials = {} as SunatCredentials;
 * console.log(value);
 * ```
 */
export interface SunatCredentials {
	ruc: string;
	usuario: string;
	clave: string;
}

/**
 * StealthScraperResult interface.
 *
 * @example
 * ```ts
 * const value: StealthScraperResult = {} as StealthScraperResult;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for StealthScraperResult.
 */

export interface StealthScraperResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	screenshots?: string[]; // Debug screenshots (base64)
}

// ============================================
// CONFIGURATION
// ============================================

const SUNAT_URLS = {
	login: "https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm",
	buzon: "https://ww3.sunat.gob.pe/cl-ti-itcasilla/CasillaInicio.htm",
	ruc: "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias",
};

const BROWSER_OPTIONS = {
	headless: true,
	args: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-accelerated-2d-canvas",
		"--disable-gpu",
		"--window-size=1920,1080",
	],
	defaultViewport: {
		width: 1920,
		height: 1080,
	},
};

// ============================================
// STEALTH SCRAPER CLASS
// ============================================

/**
 * SunatStealthScraper class.
 *
 * @example
 * ```ts
 * const value = new SunatStealthScraper();
 * console.log(value);
 * ```
 */
export class SunatStealthScraper {
	private browser: Browser | null = null;

	/**
	 * Initialize browser with stealth mode
	 */
	async init(): Promise<void> {
		if (this.browser) return;

		console.info("[SunatStealth] Initializing stealth browser...");

		this.browser = await puppeteer.launch(BROWSER_OPTIONS);

		console.info("[SunatStealth] Stealth browser ready");
	}

	/**
	 * Close browser
	 */
	async close(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}

	/**
	 * Add human-like delays and behavior
	 */
	private async humanize(page: Page): Promise<void> {
		// Random delay between 500ms-1500ms
		await sleep(500 + Math.random() * 1000);

		// Random mouse movement
		await page.mouse.move(
			Math.random() * 1000 + 100,
			Math.random() * 500 + 100,
		);
	}

	/**
	 * Type text with human-like delays
	 */
	private async humanType(
		page: Page,
		selector: string,
		text: string,
	): Promise<void> {
		await page.click(selector);
		await sleep(100);

		for (const char of text) {
			await page.type(selector, char, { delay: 50 + Math.random() * 100 });
		}
	}

	/**
	 * Login to SUNAT Clave SOL with stealth
	 */
	async login(
		credentials: SunatCredentials,
	): Promise<StealthScraperResult<boolean>> {
		try {
			await this.init();
			const page = await this.browser?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(
				`[SunatStealth] Attempting login for RUC ${credentials.ruc}`,
			);

			// Navigate to login
			await page.goto(SUNAT_URLS.login, { waitUntil: "networkidle2" });
			await this.humanize(page);

			// Check for login form
			await page.waitForSelector('input[name="txtRuc"]', { timeout: 15000 });

			// Fill credentials with human-like typing
			await this.humanType(page, 'input[name="txtRuc"]', credentials.ruc);
			await this.humanize(page);

			await this.humanType(
				page,
				'input[name="txtUsuario"]',
				credentials.usuario,
			);
			await this.humanize(page);

			await this.humanType(
				page,
				'input[name="txtContrasena"]',
				credentials.clave,
			);
			await this.humanize(page);

			// Click submit
			await page.click('button[type="submit"], input[type="submit"]');

			// Wait for navigation
			await page.waitForNavigation({
				waitUntil: "networkidle2",
				timeout: 15000,
			});

			// Check for success (look for menu)
			const isLoggedIn = await page.evaluate(() => {
				return (
					document.body.textContent?.includes("Bienvenido") ||
					!!document.querySelector("#menuPrincipal") ||
					!!document.querySelector(".menu-usuario")
				);
			});

			await page.close();

			return {
				success: isLoggedIn,
				data: isLoggedIn,
			};
		} catch (error) {
			console.error("[SunatStealth] Login failed:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Validate RUC with anti-detection
	 */
	async validateRuc(ruc: string): Promise<
		StealthScraperResult<{
			razonSocial: string;
			estado: string;
			condicion: string;
		}>
	> {
		try {
			await this.init();
			const page = await this.browser?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(`[SunatStealth] Validating RUC ${ruc}`);

			await page.goto(SUNAT_URLS.ruc, { waitUntil: "networkidle2" });
			await this.humanize(page);

			// Wait for form
			await page.waitForSelector('input[name="txtRuc"]', { timeout: 10000 });

			// Enter RUC
			await this.humanType(page, 'input[name="txtRuc"]', ruc);
			await this.humanize(page);

			// Handle captcha if present
			const hasCaptcha = await page.$('img[id*="captcha"]');
			if (hasCaptcha) {
				console.warn("[SunatStealth] Captcha detected - needs solving");
				// Would integrate with captcha solver here
				await page.close();
				return {
					success: false,
					error: "Captcha required - use captcha solver service",
				};
			}

			// Submit
			await page.click('button[type="submit"], input[type="submit"]');
			await sleep(3000);

			// Extract data
			const data = await page.evaluate(() => {
				const getText = (sel: string) =>
					document.querySelector(sel)?.textContent?.trim() || "N/A";

				return {
					razonSocial: getText(
						".razon-social, #razonSocial, .txt-nombre-comercial",
					),
					estado: getText(".estado, #estado, .txt-estado"),
					condicion: getText(".condicion, #condicion, .txt-condicion"),
				};
			});

			await page.close();

			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error("[SunatStealth] RUC validation failed:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}

// ============================================
// FACTORY FUNCTION
// ============================================

let stealthInstance: SunatStealthScraper | null = null;

/**
 * getSunatStealthScraper operation.
 *
 * @returns Result of getSunatStealthScraper.
 * @example
 * ```ts
 * const result = getSunatStealthScraper();
 * console.log(result);
 * ```
 */
export function getSunatStealthScraper(): SunatStealthScraper {
	if (!stealthInstance) {
		stealthInstance = new SunatStealthScraper();
	}
	return stealthInstance;
}

/**
 * Run stealth scraper in isolated context
 * @param operation - Input for operation.
 * @returns Result of runStealthScraper.
 * @example
 * ```ts
 * const result = await runStealthScraper(undefined);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for runStealthScraper.
 */

export async function runStealthScraper<T>(
	operation: (scraper: SunatStealthScraper) => Promise<T>,
): Promise<T> {
	const scraper = new SunatStealthScraper();
	try {
		await scraper.init();
		return await operation(scraper);
	} finally {
		await scraper.close();
	}
}
