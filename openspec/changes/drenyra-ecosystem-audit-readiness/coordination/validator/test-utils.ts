/** U1d.1 — shared fixture/ledger test helpers for the coordination suites (U1b schema, U1c semantic); no behavior change. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const COORD = fileURLToPath(new URL("../", import.meta.url));
const FIXTURES_DIR = fileURLToPath(new URL("../fixtures/", import.meta.url));
export const LEDGER_PATH = `${COORD}ledger.yaml`;
export const readFixture = (name: string): string =>
	readFileSync(`${FIXTURES_DIR}${name}`, "utf8");
export const readLedger = (): string => readFileSync(LEDGER_PATH, "utf8");
