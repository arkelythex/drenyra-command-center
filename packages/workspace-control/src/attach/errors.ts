// ─── Attach / Detach / Resume Errors ────────────────────────────────────────

export class AttachError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AttachError";
	}
}

export class DetachError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DetachError";
	}
}

export class ResumeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ResumeError";
	}
}
