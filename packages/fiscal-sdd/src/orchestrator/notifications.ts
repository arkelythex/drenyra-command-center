/**
 * Notifications — sistema de notificaciones para eventos del pipeline.
 *
 * Cuando DecisionGate requiere aprobación (interactive/supervised)
 * o ReviewGuard detecta alta carga de revisión, se disparan
 * notificaciones a los canales configurados.
 *
 * Canales soportados:
 * - log: log interno (siempre activo)
 * - console: salida a consola
 * - callback: función custom (para integrar con email/Slack/in-app)
 *
 * @example
 * ```ts
 * const notifier = new NotificationService();
 * notifier.on("phase.approval_needed", (event) => {
 *   console.log(`Aprobación requerida: ${event.fase}`);
 * });
 *
 * await notifier.notifyApprovalNeeded("solicitud", "cambio-001", {});
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type NotificationEvent =
	| "phase.completed"
	| "phase.failed"
	| "phase.approval_needed"
	| "pipeline.completed"
	| "pipeline.failed"
	| "pipeline.blocked"
	| "review.forecast_high"
	| "compliance.chain_blocked";

export interface NotificationPayload {
	event: NotificationEvent;
	changeId: string;
	timestamp: string;
	/** Fase relacionada (si aplica). */
	fase?: string;
	/** Mensaje descriptivo. */
	message: string;
	/** Datos adicionales. */
	details?: Record<string, unknown>;
}

export type NotificationHandler = (
	payload: NotificationPayload,
) => void | Promise<void>;

export interface NotificationChannel {
	name: string;
	handle: NotificationHandler;
	enabled: boolean;
}

// ============================================================================
// NotificationService
// ============================================================================

/**
 * Servicio de notificaciones para eventos del pipeline.
 *
 * Ejemplo de uso con email:
 * ```ts
 * notifier.registerChannel({
 *   name: "email",
 *   enabled: true,
 *   handle: async (payload) => {
 *     await emailService.send({
 *       to: "contador@estudio.com",
 *       subject: `[Drenyra] ${payload.message}`,
 *       body: JSON.stringify(payload.details, null, 2),
 *     });
 *   },
 * });
 * ```
 */
export class NotificationService {
	private channels: Map<string, NotificationChannel> = new Map();

	constructor() {
		// Canal de log siempre activo
		this.registerChannel({
			name: "log",
			enabled: true,
			handle: (payload) => {
				const level =
					payload.event.includes("failed") || payload.event.includes("blocked")
						? "error"
						: payload.event.includes("approval")
							? "warn"
							: "info";
				console.log(
					`[Drenyra:${level}] ${payload.event}: ${payload.message}`,
					payload.details ?? "",
				);
			},
		});
	}

	/**
	 * Registra un canal de notificación.
	 */
	registerChannel(channel: NotificationChannel): void {
		this.channels.set(channel.name, channel);
	}

	/**
	 * Deshabilita un canal.
	 */
	disableChannel(name: string): void {
		const channel = this.channels.get(name);
		if (channel) channel.enabled = false;
	}

	/**
	 * Habilita un canal.
	 */
	enableChannel(name: string): void {
		const channel = this.channels.get(name);
		if (channel) channel.enabled = true;
	}

	/**
	 * Notifica que una fase completó y necesita aprobación.
	 */
	async notifyApprovalNeeded(
		fase: string,
		changeId: string,
		details?: Record<string, unknown>,
	): Promise<void> {
		await this.emit({
			event: "phase.approval_needed",
			changeId,
			timestamp: new Date().toISOString(),
			fase,
			message: `Fase "${fase}" completada. Requiere aprobación para continuar (cambio: ${changeId}).`,
			details,
		});
	}

	/**
	 * Notifica que el pipeline completó exitosamente.
	 */
	async notifyPipelineCompleted(
		changeId: string,
		details?: Record<string, unknown>,
	): Promise<void> {
		await this.emit({
			event: "pipeline.completed",
			changeId,
			timestamp: new Date().toISOString(),
			message: `Pipeline de cumplimiento fiscal completado: ${changeId}.`,
			details,
		});
	}

	/**
	 * Notifica que el pipeline falló o fue bloqueado.
	 */
	async notifyPipelineFailed(
		changeId: string,
		fase?: string,
		errors?: string[],
	): Promise<void> {
		await this.emit({
			event: "pipeline.failed",
			changeId,
			timestamp: new Date().toISOString(),
			fase,
			message: `Pipeline falló en fase "${fase ?? "desconocida"}": ${errors?.join("; ") ?? "error desconocido"}.`,
			details: { errors },
		});
	}

	/**
	 * Notifica revisión de forecast.
	 */
	async notifyReviewForecastHigh(
		changeId: string,
		estimatedLines: number,
	): Promise<void> {
		await this.emit({
			event: "review.forecast_high",
			changeId,
			timestamp: new Date().toISOString(),
			fase: "plan",
			message: `Carga de revisión alta: ${estimatedLines} líneas estimadas para ${changeId}.`,
			details: { estimatedLines },
		});
	}

	/**
	 * Notifica que una compliance chain fue bloqueada.
	 */
	async notifyChainBlocked(
		changeId: string,
		chainId: string,
		stageId?: string,
	): Promise<void> {
		await this.emit({
			event: "compliance.chain_blocked",
			changeId,
			timestamp: new Date().toISOString(),
			fase: "migracion",
			message: `Compliance chain "${chainId}" bloqueada en stage "${stageId ?? "desconocido"}" para cambio ${changeId}.`,
			details: { chainId, stageId },
		});
	}

	/**
	 * Emite un evento a todos los canales habilitados.
	 */
	private async emit(payload: NotificationPayload): Promise<void> {
		const promises: Promise<void>[] = [];

		for (const channel of this.channels.values()) {
			if (!channel.enabled) continue;

			try {
				const result = channel.handle(payload);
				if (result instanceof Promise) {
					promises.push(result);
				}
			} catch {
				// Canal falló silenciosamente
			}
		}

		if (promises.length > 0) {
			await Promise.allSettled(promises);
		}
	}
}
