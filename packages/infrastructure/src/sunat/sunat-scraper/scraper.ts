import { type Browser, type BrowserContext, chromium } from "playwright";
import { solveCaptcha } from "../captcha";
import type {
	BuzonNotification,
	RucStatus,
	ScraperResult,
	SunatCredentials,
} from "./types";
import {
	parseNotificationsFromPage,
	parseRucStatusFromPage,
} from "./parser";

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

export class SunatScraper {
	private browser: Browser | null = null;
	private context: BrowserContext | null = null;

	async init(): Promise<void> {
		if (this.browser) return;

		console.info("[SunatScraper] Initializing browser...");

		this.browser = await chromium.launch(BROWSER_CONFIG);

		this.context = await this.browser.newContext({
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			viewport: { width: 1280, height: 720 },
			locale: "es-PE",
			timezoneId: "America/Lima",
		});

		console.info("[SunatScraper] Browser initialized");
	}

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

	async login(
		credentials: SunatCredentials,
	): Promise<ScraperResult<{ sessionActive: boolean }>> {
		const startedAt = new Date();

		try {
			await this.init();
			const page = await this.context?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(`[SunatScraper] Logging in for RUC ${credentials.ruc}`);

			await page.goto(SUNAT_URLS.login, { waitUntil: "networkidle" });

			await page.waitForSelector('input[name="txtRuc"]', { timeout: 10000 });

			await page.fill('input[name="txtRuc"]', credentials.ruc);
			await page.fill('input[name="txtUsuario"]', credentials.usuario);
			await page.fill('input[name="txtContrasena"]', credentials.clave);

			await page.click('button[type="submit"], input[type="submit"]');

			await page.waitForTimeout(3000);

			const isLoggedIn = await page.evaluate(() => {
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

			const loginResult = await this.login(credentials);
			if (!loginResult.success) {
				return {
					success: false,
					error: `Login failed: ${loginResult.error}`,
				};
			}

			await page.goto(SUNAT_URLS.buzon, { waitUntil: "networkidle" });

			await page.waitForSelector(
				".tabla-notificaciones, #listaNotificaciones",
				{ timeout: 15000 },
			);

			const notifications = await page.evaluate(parseNotificationsFromPage);

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

	async validateRucStatus(ruc: string): Promise<ScraperResult<RucStatus>> {
		const startedAt = new Date();

		try {
			await this.init();
			const page = await this.context?.newPage();
			if (!page) throw new Error("Failed to create browser page");

			console.info(`[SunatScraper] Validating RUC ${ruc}`);

			await page.goto(SUNAT_URLS.ruc, { waitUntil: "networkidle" });

			await page.waitForSelector('input[name="txtRuc"]', { timeout: 10000 });

			await page.fill('input[name="txtRuc"]', ruc);

			const captchaImage = await page.$('img[id*="captcha"], img.captcha');
			if (captchaImage) {
				console.info("[SunatScraper] Captcha detected, solving...");

				const imageBuffer = await captchaImage.screenshot();
				const imageBase64 = imageBuffer.toString("base64");

				const captchaResult = await solveCaptcha({
					type: "image",
					imageBase64,
				});

				if (!captchaResult.success || !captchaResult.solution) {
					throw new Error(`Captcha solving failed: ${captchaResult.error}`);
				}

				await page.fill(
					'input[name="txtCaptcha"], input[id*="captcha"]',
					captchaResult.solution,
				);
				console.info(
					`[SunatScraper] Captcha solved in ${captchaResult.timing?.durationMs}ms`,
				);
			}

			await page.click('button[type="submit"], input[type="submit"]');

			await page.waitForTimeout(2000);

			const rucData = await page.evaluate(parseRucStatusFromPage);

			await page.close();

			const completedAt = new Date();

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

let scraperInstance: SunatScraper | null = null;

export function getSunatScraper(): SunatScraper {
	if (!scraperInstance) {
		scraperInstance = new SunatScraper();
	}
	return scraperInstance;
}

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
