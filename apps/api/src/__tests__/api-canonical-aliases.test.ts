import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("api-module-surface", () => {
	it("serves all 18 modules at canonical /api prefix with 308 redirect from bare paths", () => {
		const script = `
import { Elysia } from 'elysia';
import { apiModules, backwardCompatRedirects } from './src/api-module-surface.ts';

const app = new Elysia()
  .use(apiModules)
  .use(backwardCompatRedirects);

const expectedPrefixes = [
  '/api/analytics',
  '/api/products',
  '/api/electronic-invoicing',
  '/api/governance-audit',
  '/api/cpe-validator',
  '/api/transactions',
  '/api/reports',
  '/api/inventory',
  '/api/documents',
  '/api/inter-company',
  '/api/inbox',
  '/api/context',
  '/api/compliance',
  '/api/ledger',
  '/api/sire',
  '/api/taxation',
  '/api/reconciliations',
  '/api/ai-tool-permissions',
];
const routePaths = app.routes.map((route) => route.path);
const missingPrefixes = expectedPrefixes.filter(
  (prefix) => !routePaths.some((path) => path.startsWith(prefix)),
);
const canonical = await app.handle(new Request('http://localhost/api/ledger/general?companyId=cmp_1&startDate=bad-date&endDate=2026-03-20'));
const bareRedirect = await app.handle(new Request('http://localhost/products?companyId=cmp_1'));
const bareAiToolsRedirect = await app.handle(new Request('http://localhost/ai-tool-permissions'));

console.log(JSON.stringify({
  canonical: canonical.status,
  bareRedirect: bareRedirect.status,
  bareRedirectLocation: bareRedirect.headers.get('Location'),
  bareRedirectDeprecation: bareRedirect.headers.get('Deprecation'),
  bareAiToolsRedirect: bareAiToolsRedirect.status,
  missingPrefixes,
}));

if (missingPrefixes.length > 0) process.exit(1);
if (bareRedirect.status !== 308) process.exit(1);
if (bareRedirect.headers.get('Location') !== '/api/products') process.exit(1);
if (bareRedirect.headers.get('Deprecation') !== 'true') process.exit(1);
if (bareAiToolsRedirect.status !== 308) process.exit(1);
`;

		const apiCwd = path.resolve(__dirname, "../..");
		const result = spawnSync("bun", ["--cwd", apiCwd, "-e", script], {
			cwd: apiCwd,
			encoding: "utf8",
			env: {
				...process.env,
				DATABASE_URL:
					process.env.DATABASE_URL ??
					"postgresql://user:password@localhost:5432/arkelythex",
			},
		});

		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
		expect(result.stdout).toContain('"bareRedirect":308');
		expect(result.stdout).toContain('"bareRedirectLocation":"/api/products"');
		expect(result.stdout).toContain('"bareRedirectDeprecation":"true"');
		expect(result.stdout).toContain('"missingPrefixes":[]');
	});
});
