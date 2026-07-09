/**
 * SUNAT Scraper Service - Playwright-based
 *
 * Headless browser automation for SUNAT operations:
 * - Login with Clave SOL
 * - Download Buzón Electrónico notifications
 * - Validate RUC status
 *
 * Part of the Shenzhen Elite "Drenyra Watchdog" strategy.
 *
 * @module infrastructure/sunat/sunat-scraper
 */

import { type Browser, type BrowserContext, chromium } from "playwright";
import { solveCaptcha } from "./captcha-solver";

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
import type { SunatWebCredentials as SunatCredentials } from "../types";

/**
 * BuzonNotification interface.
 *
 * @example
 * ```ts
 * const value: BuzonNotification = {} as BuzonNotification;
 * console.log(value);
 * ```
 */
export interface BuzonNotification {
	id: string;
	tipo: "NOTIFICACION" | "COBRANZA" | "FISCALIZACION" | "COMUNICADO" | "OTRO";
	asunto: string;
	fechaRecepcion: string;
	esUrgente: boolean;
	leido: boolean;
}

/**
 * RucStatus interface.
 *
 * @example
 * ```ts
 * const value: RucStatus = {} as RucStatus;
 * console.log(value);
 * ```
 */
export interface RucStatus {
	ruc: string;
	razonSocial: string;
	estado:
		| "ACTIVO"
		| "BAJA_DE_OFICIO"
		| "BAJA_PROVISIONAL"
		| "SUSPENSION_TEMPORAL";
	condicion: "HABIDO" | "NO_HABIDO" | "NO_HALLADO" | "PENDIENTE";
	fechaInscripcion: string;
	direccion?: string;
	actividadEconomica?: string;
}

/**
 * ScraperResult interface.
 *
 * @example
 * ```ts
 * const value: ScraperResult = {} as ScraperResult;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for ScraperResult.
 */

export interface ScraperResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	timing?: {
		startedAt: string;
		completedAt: string;
		durationMs: number;
	};
}

// ============================================
// CONFIGURATION
// ============================================

const SUNAT_URLS = {
	login: "https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm",
	buzon: "https://ww3.sunat.gob.pe/cl-ti-itcasilla/CasillaInicio.htm",
	ruc: "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias",
};

const BROWSER_CONFIG = {
	headless: true,
	args: [
		"--no-sandbox",
		"--disable-setuid-sandbox",
		"--disable-dev-shm-usage",
		"--disable-accelerated-2d-canvas",
		"--disable-gpu",
	],
};

// ============================================
// ENVIRONMENT HELPERS
// ============================================

/**
 * Get default SUNAT credentials from environment variables
 * @returns Result of getDefaultCredentials.
 * @throws Error when getDefaultCredentials cannot complete successfully.
 * @example
 * ```ts
 * const result = getDefaultCredentials();
 * console.log(result);
 * ```
 */

export function getDefaultCredentials(): SunatCredentials {
	const ruc = process.env.SUNAT_CLAVE_SOL_RUC;
	const usuario = process.env.SUNAT_CLAVE_SOL_USER;
	const clave = process.env.SUNAT_CLAVE_SOL_PASSWORD;

	if (!ruc || !usuario || !clave) {
		throw new Error(
			"SUNAT credentials not configured. Set SUNAT_CLAVE_SOL_RUC, SUNAT_CLAVE_SOL_USER, SUNAT_CLAVE_SOL_PASSWORD",
		);
	}

	return { ruc, usuario, clave };
}

// ============================================
// SUNAT SCRAPER CLASS
// ============================================

/**
 * SunatScraper class.
 *
 * @example
 * ```ts
 * const value = new SunatScraper();
 * console.log(value);
 * ```
 */
export class SunatScraper {
	private browser: Browser | null = null;
	private context: BrowserContext | null = null;

	/**
	 * Initialize browser instance
	 */
	async init(): Promise<void> {
		if (this.browser) return;

		console.info("[SunatScraper] Initializing browser...");

		this.browser = await chromium.launch(BROWSER_CONFIG);

		// Create stealth context
		this.context = await this.browser.newContext({
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			viewport: { width: 1280, height: 720 },
			locale: "es-PE",
			timezoneId: "America/Lima",
		});

		console.info("[SunatScraper] Browser initialized");
	}

	/**
	 * Close browser and clean up resources
	 */
	async close(): Promise<void> {
		if (this.context) {
			await this.context.close();
			this.context = null;
		}
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
		console.info("[SunatScraper] Browser closed");
	}

	/**
	 * Login to SUNAT Clave SOL
	 */
	async login(
		credentials: SunatCredentials,
	): Promise<ScraperResult<{ sessionActive: boolean }>> {
		const startedAt = new Date();

		try {
			await this.init();
			const page = await this.context?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(`[SunatScraper] Logging in for RUC ${credentials.ruc}`);

			// Navigate to login page
			await page.goto(SUNAT_URLS.login, { waitUntil: "networkidle" });

			// Wait for login frame/form
			await page.waitForSelector('input[name="txtRuc"]', { timeout: 10000 });

			// Fill credentials
			await page.fill('input[name="txtRuc"]', credentials.ruc);
			await page.fill('input[name="txtUsuario"]', credentials.usuario);
			await page.fill('input[name="txtContrasena"]', credentials.clave);

			// Click login button
			await page.click('button[type="submit"], input[type="submit"]');

			// Wait for navigation or error message
			await page.waitForTimeout(3000);

			// Check if login was successful (look for menu or error)
			const isLoggedIn = await page.evaluate(() => {
				// Check for common success indicators
				const successIndicators = [
					document.querySelector("#menuPrincipal"),
					document.querySelector(".menu-usuario"),
					document.body.textContent?.includes("Bienvenido"),
				];
				return successIndicators.some(Boolean);
			});

			await page.close();

			const completedAt = new Date();

			return {
				success: isLoggedIn,
				data: { sessionActive: isLoggedIn },
				timing: {
					startedAt: startedAt.toISOString(),
					completedAt: completedAt.toISOString(),
					durationMs: completedAt.getTime() - startedAt.getTime(),
				},
			};
		} catch (error) {
			console.error("[SunatScraper] Login failed:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error during login",
			};
		}
	}

	/**
	 * Download notifications from Buzón Electrónico
	 */
	async downloadBuzonElectronico(
		credentials: SunatCredentials,
	): Promise<ScraperResult<BuzonNotification[]>> {
		const startedAt = new Date();

		try {
			await this.init();
			const page = await this.context?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(
				`[SunatScraper] Checking Buzón Electrónico for RUC ${credentials.ruc}`,
			);

			// First login
			const loginResult = await this.login(credentials);
			if (!loginResult.success) {
				return {
					success: false,
					error: `Login failed: ${loginResult.error}`,
				};
			}

			// Navigate to Buzón
			await page.goto(SUNAT_URLS.buzon, { waitUntil: "networkidle" });

			// Wait for notifications table
			await page.waitForSelector(
				".tabla-notificaciones, #listaNotificaciones",
				{ timeout: 15000 },
			);

			// Extract notifications
			const notifications = await page.evaluate((): BuzonNotification[] => {
				const rows = document.querySelectorAll(
					".notificacion-row, tr.notification",
				);
				const results: BuzonNotification[] = [];

				rows.forEach((row, index) => {
					const asunto =
						row
							.querySelector(".asunto, td:nth-child(2)")
							?.textContent?.trim() || "";
					const fecha =
						row.querySelector(".fecha, td:nth-child(3)")?.textContent?.trim() ||
						"";
					const tipo =
						row.querySelector(".tipo, td:nth-child(1)")?.textContent?.trim() ||
						"";
					const urgente =
						row.classList.contains("urgente") || tipo.includes("URGENTE");
					const leido = row.classList.contains("leido");

					results.push({
						id: `notif_${Date.now()}_${index}`,
						tipo: tipo.toUpperCase().includes("COBRANZA")
							? "COBRANZA"
							: tipo.toUpperCase().includes("FISCAL")
								? "FISCALIZACION"
								: "NOTIFICACION",
						asunto,
						fechaRecepcion: fecha,
						esUrgente: urgente,
						leido,
					});
				});

				return results;
			});

			await page.close();

			const completedAt = new Date();

			console.info(
				`[SunatScraper] Found ${notifications.length} notifications`,
			);

			return {
				success: true,
				data: notifications,
				timing: {
					startedAt: startedAt.toISOString(),
					completedAt: completedAt.toISOString(),
					durationMs: completedAt.getTime() - startedAt.getTime(),
				},
			};
		} catch (error) {
			console.error("[SunatScraper] Buzón download failed:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Unknown error during Buzón download",
			};
		}
	}

	/**
	 * Validate RUC status (no login required)
	 */
	async validateRucStatus(ruc: string): Promise<ScraperResult<RucStatus>> {
		const startedAt = new Date();

		try {
			await this.init();
			const page = await this.context?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(`[SunatScraper] Validating RUC ${ruc}`);

			// Navigate to public RUC consultation
			await page.goto(SUNAT_URLS.ruc, { waitUntil: "networkidle" });

			// Wait for search form
			await page.waitForSelector('input[name="txtRuc"]', { timeout: 10000 });

			// Enter RUC
			await page.fill('input[name="txtRuc"]', ruc);

			// Handle captcha if present
			const captchaImage = await page.$('img[id*="captcha"], img.captcha');
			if (captchaImage) {
				console.info("[SunatScraper] Captcha detected, solving...");

				// Get captcha image as base64
				const imageBuffer = await captchaImage.screenshot();
				const imageBase64 = imageBuffer.toString("base64");

				// Solve captcha
				const captchaResult = await solveCaptcha({
					type: "image",
					imageBase64,
				});

				if (!captchaResult.success || !captchaResult.solution) {
					throw new Error(`Captcha solving failed: ${captchaResult.error}`);
				}

				// Enter captcha solution
				await page.fill(
					'input[name="txtCaptcha"], input[id*="captcha"]',
					captchaResult.solution,
				);
				console.info(
					`[SunatScraper] Captcha solved in ${captchaResult.timing?.durationMs}ms`,
				);
			}

			// Click search
			await page.click('button[type="submit"], input[type="submit"]');

			// Wait for results
			await page.waitForTimeout(2000);

			// Extract RUC data
			const rucData = await page.evaluate((): Partial<RucStatus> => {
				const getText = (selector: string): string =>
					document.querySelector(selector)?.textContent?.trim() || "";

				return {
					razonSocial: getText(".razon-social, #razonSocial"),
					estado: getText(
						".estado, #estado",
					).toUpperCase() as RucStatus["estado"],
					condicion: getText(
						".condicion, #condicion",
					).toUpperCase() as RucStatus["condicion"],
					fechaInscripcion: getText(".fecha-inscripcion, #fechaInscripcion"),
					direccion: getText(".direccion, #direccion"),
					actividadEconomica: getText(".actividad, #actividadEconomica"),
				};
			});

			await page.close();

			const completedAt = new Date();

			// Determine status based on extracted data
			const status: RucStatus = {
				ruc,
				razonSocial: rucData.razonSocial || "NO ENCONTRADO",
				estado: rucData.estado || "ACTIVO",
				condicion: rucData.condicion || "HABIDO",
				fechaInscripcion: rucData.fechaInscripcion || "",
				direccion: rucData.direccion,
				actividadEconomica: rucData.actividadEconomica,
			};

			console.info(
				`[SunatScraper] RUC ${ruc}: ${status.estado} - ${status.condicion}`,
			);

			return {
				success: true,
				data: status,
				timing: {
					startedAt: startedAt.toISOString(),
					completedAt: completedAt.toISOString(),
					durationMs: completedAt.getTime() - startedAt.getTime(),
				},
			};
		} catch (error) {
			console.error("[SunatScraper] RUC validation failed:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Unknown error during RUC validation",
			};
		}
	}
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let scraperInstance: SunatScraper | null = null;

/**
 * Get or create SUNAT scraper instance
 * @returns Result of getSunatScraper.
 * @example
 * ```ts
 * const result = getSunatScraper();
 * console.log(result);
 * ```
 */

export function getSunatScraper(): SunatScraper {
	if (!scraperInstance) {
		scraperInstance = new SunatScraper();
	}
	return scraperInstance;
}

/**
 * Run scraper in isolated context (for serverless)
 * @param operation - Input for operation.
 * @returns Result of runIsolatedScraper.
 * @example
 * ```ts
 * const result = await runIsolatedScraper(undefined);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for runIsolatedScraper.
 */

export async function runIsolatedScraper<T>(
	operation: (scraper: SunatScraper) => Promise<T>,
): Promise<T> {
	const scraper = new SunatScraper();
	try {
		await scraper.init();
		return await operation(scraper);
	} finally {
		await scraper.close();
	}
}
