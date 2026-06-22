import type { IStorageService } from "@arkelythex/application/ports/storage.port";
import { logger } from "../logger";
import { LocalStorageService } from "./local-storage.service";
import { R2StorageService } from "./r2-storage.service";

/**
 * Factory para crear el servicio de almacenamiento apropiado
 * Usa R2 si está configurado, de lo contrario usa almacenamiento local
 * @example
 * ```ts
 * const value = new StorageFactory();
 * console.log(value);
 * ```
 */

export class StorageFactory {
	private static instance: IStorageService | null = null;

	static create(): IStorageService {
		// Devolver instancia cacheada si existe
		if (StorageFactory.instance) {
			return StorageFactory.instance;
		}

		// Verificar si R2 está configurado
		const r2Configured = Boolean(
			process.env.R2_ENDPOINT &&
				process.env.R2_ACCESS_KEY_ID &&
				process.env.R2_SECRET_ACCESS_KEY &&
				process.env.R2_BUCKET_NAME,
		);

		if (r2Configured) {
			logger.info("Usando Cloudflare R2 Storage");
			StorageFactory.instance = new R2StorageService();
		} else {
			logger.info("Usando Local Storage (desarrollo)");
			StorageFactory.instance = new LocalStorageService();
		}

		return StorageFactory.instance;
	}

	/**
	 * Resetear la instancia (útil para tests)
	 */
	static reset(): void {
		StorageFactory.instance = null;
	}
}
