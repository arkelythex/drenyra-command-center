import type { AuditEvent, AuditLogger } from "./types";

export class ConsoleAuditLogger implements AuditLogger {
	log(event: AuditEvent): void {
		console.log(JSON.stringify(event));
	}
}

export class SpyAuditLogger implements AuditLogger {
	private events: AuditEvent[] = [];

	log(event: AuditEvent): void {
		this.events.push(event);
	}

	getEvents(): ReadonlyArray<AuditEvent> {
		return this.events;
	}

	clear(): void {
		this.events = [];
	}
}
