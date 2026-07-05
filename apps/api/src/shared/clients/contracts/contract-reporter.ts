import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

interface EndpointResult {
	status: "pass" | "skip" | "fail";
	httpStatus?: number;
	schemaValid?: boolean;
	note?: string;
	sample?: unknown;
}

interface ContractReport {
	generatedAt: string;
	baseUrl: string;
	requireContracts: boolean;
	endpoints: Record<string, EndpointResult>;
}

export class ContractReporter {
	private readonly report: ContractReport;

	constructor(
		private readonly reportPath: string | undefined,
		private readonly baseUrl: string,
		private readonly requireContracts: boolean,
	) {
		this.report = {
			generatedAt: new Date().toISOString(),
			baseUrl,
			requireContracts,
			endpoints: {},
		};
	}

	pass(endpoint: string, details: Omit<EndpointResult, "status">): void {
		this.report.endpoints[endpoint] = {
			status: "pass",
			...details,
		};
	}

	skip(endpoint: string, note: string): void {
		this.report.endpoints[endpoint] = {
			status: "skip",
			note,
		};
	}

	fail(endpoint: string, note: string): void {
		this.report.endpoints[endpoint] = {
			status: "fail",
			note,
		};
	}

	async flush(): Promise<void> {
		if (!this.reportPath) return;

		const absolutePath = path.resolve(process.cwd(), this.reportPath);
		const dir = path.dirname(absolutePath);
		mkdirSync(dir, { recursive: true });
		await writeFile(
			absolutePath,
			`${JSON.stringify(this.report, null, 2)}\n`,
			"utf-8",
		);
	}
}
