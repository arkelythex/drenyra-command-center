import fs from "fs/promises";
import path from "path";
import type {
	IStorageService,
	UploadOptions,
} from "@drenyra/application/ports/storage.port";
import { StorageError } from "@drenyra/shared/errors";

/**
 * LocalStorageService - Servicio de almacenamiento local para desarrollo
 * Guarda archivos en public/uploads para acceso directo
 * @example
 * ```ts
 * const value = new LocalStorageService();
 * console.log(value);
 * ```
 */

export class LocalStorageService implements IStorageService {
	private uploadDir: string;
	private publicUrl: string;

	constructor() {
		this.uploadDir = path.join(process.cwd(), "public", "uploads");
		this.publicUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	}

	async upload(file: File | Buffer, options: UploadOptions): Promise<string> {
		try {
			const buffer =
				file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

			// Crear directorio si no existe
			const folderPath = path.join(this.uploadDir, options.folder);
			await fs.mkdir(folderPath, { recursive: true });

			// Validar tamaño si se especifica
			if (options.maxSizeBytes && buffer.length > options.maxSizeBytes) {
				throw new StorageError(
					`El archivo excede el tamaño máximo permitido de ${(options.maxSizeBytes / 1024 / 1024).toFixed(2)} MB`,
				);
			}

			// Generar nombre único para evitar colisiones
			const timestamp = Date.now();
			const uniqueFileName = `${timestamp}-${options.fileName}`;
			const filePath = path.join(folderPath, uniqueFileName);

			// Guardar archivo
			await fs.writeFile(filePath, buffer);

			// Retornar URL pública
			return `${this.publicUrl}/uploads/${options.folder}/${uniqueFileName}`;
		} catch (error) {
			if (error instanceof StorageError) throw error;
			throw new StorageError(
				`Error al subir archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
			);
		}
	}

	async delete(fileUrl: string): Promise<void> {
		try {
			const relativePath = fileUrl.replace(`${this.publicUrl}/uploads/`, "");
			const filePath = path.join(this.uploadDir, relativePath);

			await fs.unlink(filePath);
		} catch (error) {
			// Ignorar si el archivo no existe
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				throw new StorageError(
					`Error al eliminar archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
				);
			}
		}
	}

	async getSignedUrl(fileUrl: string, _expiresIn?: number): Promise<string> {
		// En almacenamiento local, devolvemos la misma URL
		// Los archivos en /public son públicos por defecto en Next.js
		return fileUrl;
	}
}
