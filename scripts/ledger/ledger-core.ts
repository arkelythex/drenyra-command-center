/**
 * ledger-core.ts — pure ledger functions (no fs, no CLI).
 *
 * Canonical audit ledger per design §6 rev.2:
 *   §6.3 entryTypes vocabulary, §6.4 identity, §6.5 canonical hash chain,
 *   §6.6 optimistic append + idempotency, §6.7 genesis, §6.8 structured
 *   validation (collects every finding), §6.10 signing policy.
 *
 * The canonical serialization reuses the sorted-keys compact JSON validated
 * across TS/Go/Python receipt conformance — no second representation.
 */
import {
	createHash,
	createPrivateKey,
	createPublicKey,
	sign,
	verify,
} from "node:crypto";

// ─── Vocabulary and constants ────────────────────────────────────────────────

const ENTRY_TYPE = {
	GENESIS: "GENESIS",
	RECEIPT_RECORDED: "RECEIPT_RECORDED",
	ATTESTATION_ADDED: "ATTESTATION_ADDED",
	ENTRY_SUPERSEDED: "ENTRY_SUPERSEDED",
	ENTRY_REVOKED: "ENTRY_REVOKED",
	CHECKPOINT_CREATED: "CHECKPOINT_CREATED",
} as const;

type EntryType = (typeof ENTRY_TYPE)[keyof typeof ENTRY_TYPE];

const SUPPORTED_SCHEMA_VERSIONS = ["1.0"] as const;

const FINDING = {
	SCHEMA: "schema",
	CANONICALIZATION: "canonicalization",
	ENTRY_HASH: "entry-hash",
	PREVIOUS_HASH: "previous-hash",
	SEQUENCE: "sequence",
	LEDGER_IDENTITY: "ledger-identity",
	RECEIPT_REFERENCE: "receipt-reference",
	SIGNATURE: "signature",
	TRUST: "trust",
	UNSUPPORTED_VERSION: "unsupported-version",
	DUPLICATE: "duplicate",
	GENESIS: "genesis",
	PARSE: "parse",
} as const;

type FindingCode = (typeof FINDING)[keyof typeof FINDING];

const HASH_ONLY = "hash-only";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrustRootPolicy {
	keyIds: readonly string[];
}

interface SigningPolicy {
	required: boolean;
	algorithm: string;
	keyIds: readonly string[];
}

type LedgerManifest = {
	protocolVersion: string;
	hashAlgorithm: string;
	trustRoot: TrustRootPolicy;
	jurisdiction: string;
	createdAt: string;
	signingPolicy: SigningPolicy;
	manifest?: Record<string, unknown>;
};

interface LedgerEntry {
	entryId: string;
	ledgerId: string;
	sequence: number;
	entryType: EntryType;
	previousEntryHash: string;
	payloadHash: string;
	receiptHash: string;
	occurredAt: string;
	recordedAt: string;
	actor: string;
	schemaVersion: string;
	signerKeyId: string;
	signature?: string;
	signerPublicKey?: string;
	idempotencyKey?: string;
	payload?: Record<string, unknown>;
}

interface LedgerFinding {
	code: FindingCode;
	severity: "error" | "warning";
	entryIndex: number;
	entryId?: string;
	sequence?: number;
	message: string;
}

interface LedgerValidationReport {
	valid: boolean;
	ledgerId: string;
	entriesChecked: number;
	headHash?: string;
	findings: readonly LedgerFinding[];
}

type AppendResult =
	| { status: "appended"; entry: LedgerEntry; entryHash: string }
	| {
			status: "head-conflict";
			expectedHeadHash: string;
			actualHeadHash: string;
			expectedSequence: number;
			actualSequence: number;
	  }
	| {
			status: "duplicate";
			reason: "idempotency-replay" | "idempotency-conflict" | "entry-id-exists";
			existingEntry: LedgerEntry;
	  }
	| { status: "invalid-chain"; findings: readonly LedgerFinding[] };

interface AppendRequest {
	ledgerId: string;
	expectedHeadHash: string;
	expectedSequence: number;
	entry: LedgerEntry;
	chain: readonly LedgerEntry[];
}

interface CreateGenesisInput {
	ledgerId: string;
	manifest: LedgerManifest;
	actor: string;
	occurredAt: string;
	recordedAt: string;
	entryId: string;
	schemaVersion?: string;
}

interface CreateEntryInput {
	ledgerId: string;
	entryType: string;
	actor: string;
	occurredAt: string;
	recordedAt: string;
	entryId: string;
	schemaVersion?: string;
	head?: LedgerEntry;
	payload?: Record<string, unknown>;
	receipt?: unknown;
	receiptId?: string;
	receiptPath?: string;
	idempotencyKey?: string;
}

type ParsedSlot = { entry: LedgerEntry; index: number };

// ─── Canonicalization (shared with receipt conformance) ──────────────────────

function sha256Hex(data: string | Buffer): string {
	return createHash("sha256").update(data).digest("hex");
}

/** Compact JSON with keys sorted at every nesting level (JSON.stringify separators). */
function sortedStringify(data: unknown): string {
	if (Array.isArray(data)) {
		const parts = data.map((item) => sortedStringify(item));
		return `[${parts.join(",")}]`;
	}
	if (data !== null && typeof data === "object") {
		const record = data as Record<string, unknown>;
		const parts = Object.keys(record)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${sortedStringify(record[key])}`);
		return `{${parts.join(",")}}`;
	}
	return JSON.stringify(data);
}

const EMPTY_HASH = sha256Hex("");

function canonicalHeader(entry: LedgerEntry): string {
	return sortedStringify({
		ledgerId: entry.ledgerId,
		sequence: entry.sequence,
		entryType: entry.entryType,
		occurredAt: entry.occurredAt,
		recordedAt: entry.recordedAt,
		actor: entry.actor,
		schemaVersion: entry.schemaVersion,
		entryId: entry.entryId,
	});
}

/** The exact pre-image of entryHash — also the string covered by a signature. */
function signingString(entry: LedgerEntry): string {
	return (
		canonicalHeader(entry) +
		entry.payloadHash +
		entry.receiptHash +
		entry.previousEntryHash
	);
}

function computeEntryHash(entry: LedgerEntry): string {
	return sha256Hex(signingString(entry));
}

function contentKey(entry: LedgerEntry): string {
	return sortedStringify({
		entryType: entry.entryType,
		payloadHash: entry.payloadHash,
		receiptHash: entry.receiptHash,
	});
}

function isEntryType(candidate: string): candidate is EntryType {
	return (
		candidate === ENTRY_TYPE.GENESIS ||
		candidate === ENTRY_TYPE.RECEIPT_RECORDED ||
		candidate === ENTRY_TYPE.ATTESTATION_ADDED ||
		candidate === ENTRY_TYPE.ENTRY_SUPERSEDED ||
		candidate === ENTRY_TYPE.ENTRY_REVOKED ||
		candidate === ENTRY_TYPE.CHECKPOINT_CREATED
	);
}

function isSupportedSchemaVersion(candidate: string): boolean {
	return (SUPPORTED_SCHEMA_VERSIONS as readonly string[]).includes(candidate);
}

function isPositiveInteger(data: unknown): boolean {
	if (data === null) return false;
	const kind = typeof data;
	if (
		kind === "string" ||
		kind === "boolean" ||
		kind === "object" ||
		kind === "bigint" ||
		kind === "symbol" ||
		kind === "function"
	) {
		return false;
	}
	const candidate = data as number;
	return candidate % 1 === 0 && candidate >= 1;
}

// ─── Entry builders ──────────────────────────────────────────────────────────

function createGenesisEntry(input: CreateGenesisInput): LedgerEntry {
	const payload: Record<string, unknown> = input.manifest;
	return {
		entryId: input.entryId,
		ledgerId: input.ledgerId,
		sequence: 1,
		entryType: ENTRY_TYPE.GENESIS,
		previousEntryHash: EMPTY_HASH,
		payloadHash: sha256Hex(sortedStringify(payload)),
		receiptHash: EMPTY_HASH,
		occurredAt: input.occurredAt,
		recordedAt: input.recordedAt,
		actor: input.actor,
		schemaVersion: input.schemaVersion ?? "1.0",
		signerKeyId: HASH_ONLY,
		payload,
	};
}

function createLedgerEntry(input: CreateEntryInput): LedgerEntry {
	const entryType = input.entryType;
	if (!isEntryType(entryType)) {
		throw new TypeError(`unsupported entryType: ${entryType}`);
	}
	const head = input.head;
	const sequence = head === undefined ? 1 : head.sequence + 1;
	const previousEntryHash =
		head === undefined ? EMPTY_HASH : computeEntryHash(head);

	let payload: Record<string, unknown> = {};
	if (entryType === ENTRY_TYPE.RECEIPT_RECORDED) {
		payload = buildReceiptPayload(input);
	} else if (input.payload !== undefined) {
		payload = input.payload;
	}

	const entry: LedgerEntry = {
		entryId: input.entryId,
		ledgerId: input.ledgerId,
		sequence,
		entryType,
		previousEntryHash,
		payloadHash: sha256Hex(sortedStringify(payload)),
		receiptHash:
			input.receipt === undefined
				? EMPTY_HASH
				: sha256Hex(sortedStringify(input.receipt)),
		occurredAt: input.occurredAt,
		recordedAt: input.recordedAt,
		actor: input.actor,
		schemaVersion: input.schemaVersion ?? "1.0",
		signerKeyId: HASH_ONLY,
	};
	if (input.idempotencyKey !== undefined) {
		entry.idempotencyKey = input.idempotencyKey;
	}
	if (Object.keys(payload).length > 0) {
		entry.payload = payload;
	}
	return entry;
}

function buildReceiptPayload(input: CreateEntryInput): Record<string, unknown> {
	if (input.receipt === undefined) {
		throw new TypeError("RECEIPT_RECORDED requires an embedded receipt");
	}
	if (input.receiptId === undefined) {
		throw new TypeError("RECEIPT_RECORDED requires a receiptId");
	}
	return {
		receiptId: input.receiptId,
		receipt: input.receipt,
		...(input.receiptPath !== undefined
			? { receiptPath: input.receiptPath }
			: {}),
	};
}

// ─── Signing policy (§6.10) ──────────────────────────────────────────────────

function signEntry(
	entry: LedgerEntry,
	privateKeyBase64: string,
	keyId: string,
): LedgerEntry {
	const privateKey = createPrivateKey({
		key: Buffer.from(privateKeyBase64, "base64"),
		format: "der",
		type: "pkcs8",
	});
	const publicKeyDer = createPublicKey(privateKey).export({
		type: "spki",
		format: "der",
	});
	const signature = sign(
		null,
		Buffer.from(signingString(entry), "utf-8"),
		privateKey,
	);
	return {
		...entry,
		signerKeyId: keyId,
		signerPublicKey: publicKeyDer.toString("base64"),
		signature: signature.toString("base64"),
	};
}

function verifyEntrySignature(entry: LedgerEntry): boolean {
	if (entry.signature === undefined || entry.signerPublicKey === undefined) {
		return false;
	}
	try {
		const publicKey = createPublicKey({
			key: Buffer.from(entry.signerPublicKey, "base64"),
			format: "der",
			type: "spki",
		});
		return verify(
			null,
			Buffer.from(signingString(entry), "utf-8"),
			publicKey,
			Buffer.from(entry.signature, "base64"),
		);
	} catch {
		return false;
	}
}

/** keyId → publicKey from a trust-root envelope ({ keys: [...] }) or a flat map. */
function extractTrustRootKeys(trustRoot: unknown): ReadonlyMap<string, string> {
	const result = new Map<string, string>();
	if (trustRoot === null || typeof trustRoot !== "object") {
		return result;
	}
	if (Array.isArray(trustRoot)) {
		return result;
	}
	const record = trustRoot as Record<string, unknown>;
	if (Array.isArray(record.keys)) {
		extractFromKeyArray(record.keys, result);
	} else {
		extractFromFlatMap(record, result);
	}
	return result;
}

function extractFromKeyArray(
	keys: readonly unknown[],
	result: Map<string, string>,
): void {
	for (const item of keys) {
		if (item === null || typeof item !== "object" || Array.isArray(item)) {
			continue;
		}
		const keyRecord = item as Record<string, unknown>;
		const keyId = keyRecord.keyId;
		const publicKey = keyRecord.publicKey;
		if (typeof keyId === "string" && typeof publicKey === "string") {
			result.set(keyId, publicKey);
		}
	}
}

function extractFromFlatMap(
	record: Record<string, unknown>,
	result: Map<string, string>,
): void {
	for (const key of Object.keys(record)) {
		const item = record[key];
		if (typeof item === "string") {
			result.set(key, item);
		}
	}
}

// ─── Optimistic append + idempotency (§6.6) ─────────────────────────────────

function appendEntry(request: AppendRequest): AppendResult {
	const { ledgerId, expectedHeadHash, expectedSequence, entry, chain } =
		request;
	const head = chain.length > 0 ? chain[chain.length - 1] : undefined;
	if (head === undefined) {
		return {
			status: "invalid-chain",
			findings: [
				{
					code: FINDING.GENESIS,
					severity: "error",
					entryIndex: 0,
					message: "cannot append: the chain has no genesis entry",
				},
			],
		};
	}
	if (chain.length === 1 && head.entryType !== ENTRY_TYPE.GENESIS) {
		return {
			status: "invalid-chain",
			findings: [
				{
					code: FINDING.GENESIS,
					severity: "error",
					entryIndex: 0,
					message: "cannot append: the first entry is not GENESIS",
				},
			],
		};
	}

	const actualHeadHash = computeEntryHash(head);
	const actualSequence = head.sequence + 1;

	if (entry.idempotencyKey !== undefined) {
		const existing = chain.find(
			(item) =>
				item.ledgerId === ledgerId &&
				item.idempotencyKey === entry.idempotencyKey,
		);
		if (existing !== undefined) {
			const reason =
				contentKey(entry) === contentKey(existing)
					? "idempotency-replay"
					: "idempotency-conflict";
			return { status: "duplicate", reason, existingEntry: existing };
		}
	}

	const twin = chain.find((item) => item.entryId === entry.entryId);
	if (twin !== undefined) {
		return {
			status: "duplicate",
			reason: "entry-id-exists",
			existingEntry: twin,
		};
	}

	if (
		expectedHeadHash !== actualHeadHash ||
		expectedSequence !== actualSequence ||
		entry.previousEntryHash !== actualHeadHash ||
		entry.sequence !== actualSequence
	) {
		return {
			status: "head-conflict",
			expectedHeadHash,
			actualHeadHash,
			expectedSequence,
			actualSequence,
		};
	}

	return { status: "appended", entry, entryHash: computeEntryHash(entry) };
}

// ─── Structured validation (§6.8) ────────────────────────────────────────────

const REQUIRED_FIELDS = [
	"entryId",
	"ledgerId",
	"sequence",
	"entryType",
	"previousEntryHash",
	"payloadHash",
	"receiptHash",
	"occurredAt",
	"recordedAt",
	"actor",
	"schemaVersion",
	"signerKeyId",
];

const STRING_FIELDS = [
	"entryId",
	"ledgerId",
	"entryType",
	"previousEntryHash",
	"payloadHash",
	"receiptHash",
	"occurredAt",
	"recordedAt",
	"actor",
	"schemaVersion",
	"signerKeyId",
];

const ALLOWED_FIELDS = new Set([
	...REQUIRED_FIELDS,
	"signature",
	"signerPublicKey",
	"idempotencyKey",
	"payload",
]);

function collectShapeProblems(data: unknown): string[] {
	const problems: string[] = [];
	if (data === null || typeof data !== "object" || Array.isArray(data)) {
		return ["entry must be a JSON object"];
	}
	const record = data as Record<string, unknown>;
	checkAllowedFields(record, problems);
	checkRequiredFields(record, problems);
	checkStringFields(record, problems);
	checkOptionalFields(record, problems);
	return problems;
}

function checkAllowedFields(
	record: Record<string, unknown>,
	problems: string[],
): void {
	for (const key of Object.keys(record)) {
		if (!ALLOWED_FIELDS.has(key)) {
			problems.push(`unknown field: ${key}`);
		}
	}
}

function checkRequiredFields(
	record: Record<string, unknown>,
	problems: string[],
): void {
	for (const key of REQUIRED_FIELDS) {
		if (record[key] === undefined) {
			problems.push(`missing field: ${key}`);
		}
	}
}

function checkStringFields(
	record: Record<string, unknown>,
	problems: string[],
): void {
	for (const key of STRING_FIELDS) {
		const item = record[key];
		if (typeof item !== "string" || item.length === 0) {
			problems.push(`field ${key} must be a non-empty string`);
		}
	}
}

function checkOptionalFields(
	record: Record<string, unknown>,
	problems: string[],
): void {
	if (!isPositiveInteger(record.sequence)) {
		problems.push("sequence must be a positive integer");
	}
	const payload = record.payload;
	if (
		payload !== undefined &&
		(payload === null || typeof payload !== "object" || Array.isArray(payload))
	) {
		problems.push("payload must be an object");
	}
	const signature = record.signature;
	if (signature !== undefined && typeof signature !== "string") {
		problems.push("signature must be a string");
	}
	const signerPublicKey = record.signerPublicKey;
	if (signerPublicKey !== undefined && typeof signerPublicKey !== "string") {
		problems.push("signerPublicKey must be a string");
	}
	const idempotencyKey = record.idempotencyKey;
	if (idempotencyKey !== undefined && typeof idempotencyKey !== "string") {
		problems.push("idempotencyKey must be a string");
	}
}

function validateLedger(
	lines: readonly string[],
	trustRootKeys?: ReadonlyMap<string, string>,
): LedgerValidationReport {
	const findings: LedgerFinding[] = [];
	const parsedEntries: ParsedSlot[] = parseLines(lines, findings);

	let ledgerId = "";
	for (let position = 0; position < parsedEntries.length; position += 1) {
		const slot = parsedEntries[position];
		if (slot === undefined) {
			continue;
		}
		if (position === 0) {
			ledgerId = slot.entry.ledgerId;
		}
		checkParsedEntry(
			slot,
			position,
			parsedEntries,
			ledgerId,
			trustRootKeys,
			findings,
		);
	}

	const last =
		parsedEntries.length > 0
			? parsedEntries[parsedEntries.length - 1]
			: undefined;
	const report: LedgerValidationReport = {
		valid: findings.length === 0,
		ledgerId,
		entriesChecked: lines.length,
		findings,
	};
	if (last !== undefined) {
		report.headHash = computeEntryHash(last.entry);
	}
	return report;
}

function parseLines(
	lines: readonly string[],
	findings: LedgerFinding[],
): ParsedSlot[] {
	const parsedEntries: ParsedSlot[] = [];
	for (let index = 0; index < lines.length; index += 1) {
		parseLine(lines[index], index, parsedEntries, findings);
	}
	return parsedEntries;
}

function parseLine(
	line: string | undefined,
	index: number,
	parsedEntries: ParsedSlot[],
	findings: LedgerFinding[],
): void {
	if (line === undefined) {
		return;
	}
	if (line.length === 0) {
		pushFinding(findings, FINDING.PARSE, index, "empty line");
		return;
	}
	let data: unknown;
	try {
		data = JSON.parse(line);
	} catch {
		pushFinding(findings, FINDING.PARSE, index, "line is not valid JSON");
		return;
	}
	const shapeProblems = collectShapeProblems(data);
	if (shapeProblems.length > 0) {
		for (const problem of shapeProblems) {
			pushFinding(findings, FINDING.SCHEMA, index, problem);
		}
		return;
	}
	const entry = data as LedgerEntry;
	if (line !== sortedStringify(entry)) {
		pushFinding(
			findings,
			FINDING.CANONICALIZATION,
			index,
			"line is not the canonical serialization of the entry",
			entry,
		);
	}
	if (!isSupportedSchemaVersion(entry.schemaVersion)) {
		pushFinding(
			findings,
			FINDING.UNSUPPORTED_VERSION,
			index,
			`unsupported schemaVersion: ${entry.schemaVersion}`,
			entry,
		);
	}
	if (!isEntryType(entry.entryType)) {
		pushFinding(
			findings,
			FINDING.SCHEMA,
			index,
			`entryType outside the vocabulary: ${entry.entryType}`,
			entry,
		);
	}
	parsedEntries.push({ entry, index });
}

function pushFinding(
	findings: LedgerFinding[],
	code: FindingCode,
	entryIndex: number,
	message: string,
	entry?: LedgerEntry,
): void {
	findings.push({
		code,
		severity: "error",
		entryIndex,
		...(entry !== undefined
			? { entryId: entry.entryId, sequence: entry.sequence }
			: {}),
		message,
	});
}

function checkParsedEntry(
	slot: ParsedSlot,
	position: number,
	parsedEntries: readonly ParsedSlot[],
	ledgerId: string,
	trustRootKeys: ReadonlyMap<string, string> | undefined,
	findings: LedgerFinding[],
): void {
	const { entry, index } = slot;
	if (position === 0) {
		checkGenesis(entry, index, findings);
	} else {
		checkLinkage(slot, position, parsedEntries, ledgerId, findings);
	}
	checkSequence(entry, position, index, findings);
	checkPayloadBinding(entry, index, findings);
	if (entry.entryType === ENTRY_TYPE.RECEIPT_RECORDED) {
		checkReceiptReference(entry, index, findings);
	}
	checkSignatureAndTrust(entry, position, index, parsedEntries, trustRootKeys, findings);
	checkDuplicates(slot, position, parsedEntries, findings);
}

function checkLinkage(
	slot: ParsedSlot,
	position: number,
	parsedEntries: readonly ParsedSlot[],
	ledgerId: string,
	findings: LedgerFinding[],
): void {
	const { entry, index } = slot;
	const prior = parsedEntries[position - 1];
	if (prior !== undefined && entry.previousEntryHash !== computeEntryHash(prior.entry)) {
		pushFinding(
			findings,
			FINDING.PREVIOUS_HASH,
			index,
			"previousEntryHash does not link to the prior entry hash",
			entry,
		);
	}
	if (entry.ledgerId !== ledgerId) {
		pushFinding(
			findings,
			FINDING.LEDGER_IDENTITY,
			index,
			`entry belongs to ledger ${entry.ledgerId}, expected ${ledgerId}`,
			entry,
		);
	}
}

function checkSequence(
	entry: LedgerEntry,
	position: number,
	index: number,
	findings: LedgerFinding[],
): void {
	if (entry.sequence !== position + 1) {
		pushFinding(
			findings,
			FINDING.SEQUENCE,
			index,
			`sequence ${entry.sequence} does not continue the chain (expected ${position + 1})`,
			entry,
		);
	}
}

function checkPayloadBinding(
	entry: LedgerEntry,
	index: number,
	findings: LedgerFinding[],
): void {
	const payloadSerialized =
		entry.payload === undefined ? "{}" : sortedStringify(entry.payload);
	if (entry.payloadHash !== sha256Hex(payloadSerialized)) {
		pushFinding(
			findings,
			FINDING.ENTRY_HASH,
			index,
			"payloadHash does not bind to the canonical payload",
			entry,
		);
	}
}

function checkDuplicates(
	slot: ParsedSlot,
	position: number,
	parsedEntries: readonly ParsedSlot[],
	findings: LedgerFinding[],
): void {
	const { entry, index } = slot;
	for (let earlier = 0; earlier < position; earlier += 1) {
		const prior = parsedEntries[earlier];
		if (prior === undefined) {
			continue;
		}
		if (prior.entry.entryId === entry.entryId) {
			pushFinding(
				findings,
				FINDING.DUPLICATE,
				index,
				"duplicate entryId",
				entry,
			);
		}
		if (
			prior.entry.ledgerId === entry.ledgerId &&
			prior.entry.sequence === entry.sequence
		) {
			pushFinding(
				findings,
				FINDING.DUPLICATE,
				index,
				"duplicate ledgerId+sequence pair",
				entry,
			);
		}
	}
}

function checkGenesis(
	entry: LedgerEntry,
	index: number,
	findings: LedgerFinding[],
): void {
	if (entry.entryType !== ENTRY_TYPE.GENESIS) {
		pushFinding(
			findings,
			FINDING.GENESIS,
			index,
			"the first entry must be GENESIS",
			entry,
		);
	}
	if (entry.sequence !== 1) {
		pushFinding(
			findings,
			FINDING.GENESIS,
			index,
			"the genesis sequence must be 1",
			entry,
		);
	}
	if (entry.previousEntryHash !== EMPTY_HASH) {
		pushFinding(
			findings,
			FINDING.GENESIS,
			index,
			"the genesis previousEntryHash must be the canonical empty-string SHA-256",
			entry,
		);
	}
	if (entry.receiptHash !== EMPTY_HASH) {
		pushFinding(
			findings,
			FINDING.GENESIS,
			index,
			"the genesis entry carries no backing receipt",
			entry,
		);
	}
	if (entry.signerKeyId !== HASH_ONLY) {
		pushFinding(
			findings,
			FINDING.GENESIS,
			index,
			"the genesis entry must be hash-only: it establishes the trust root",
			entry,
		);
	}
	if (entry.payload === undefined) {
		pushFinding(
			findings,
			FINDING.GENESIS,
			index,
			"the genesis entry must carry a manifest payload",
			entry,
		);
		return;
	}
	for (const key of [
		"protocolVersion",
		"hashAlgorithm",
		"trustRoot",
		"jurisdiction",
		"createdAt",
		"signingPolicy",
	]) {
		if (entry.payload[key] === undefined) {
			pushFinding(
				findings,
				FINDING.GENESIS,
				index,
				`the genesis manifest is missing ${key}`,
				entry,
			);
		}
	}
}

function checkReceiptReference(
	entry: LedgerEntry,
	index: number,
	findings: LedgerFinding[],
): void {
	const payload = entry.payload;
	const receiptId = payload?.receiptId;
	if (typeof receiptId !== "string" || receiptId.length === 0) {
		pushFinding(
			findings,
			FINDING.RECEIPT_REFERENCE,
			index,
			"RECEIPT_RECORDED payload must carry a receiptId",
			entry,
		);
	}
	const receipt = payload?.receipt;
	if (receipt === undefined || typeof receipt !== "object" || Array.isArray(receipt)) {
		pushFinding(
			findings,
			FINDING.RECEIPT_REFERENCE,
			index,
			"RECEIPT_RECORDED payload must embed the receipt object",
			entry,
		);
	} else if (entry.receiptHash !== sha256Hex(sortedStringify(receipt))) {
		pushFinding(
			findings,
			FINDING.RECEIPT_REFERENCE,
			index,
			"receiptHash does not match the embedded receipt content",
			entry,
		);
	}
}

function checkSignatureAndTrust(
	entry: LedgerEntry,
	position: number,
	index: number,
	parsedEntries: readonly ParsedSlot[],
	trustRootKeys: ReadonlyMap<string, string> | undefined,
	findings: LedgerFinding[],
): void {
	if (entry.signerKeyId === HASH_ONLY) {
		if (entry.signature !== undefined || entry.signerPublicKey !== undefined) {
			pushFinding(
				findings,
				FINDING.SIGNATURE,
				index,
				"hash-only entries must not carry signature fields",
				entry,
			);
		}
		return;
	}
	checkEntrySignature(entry, index, findings);
	checkTrustRoots(entry, position, parsedEntries, trustRootKeys, index, findings);
}

function checkEntrySignature(
	entry: LedgerEntry,
	index: number,
	findings: LedgerFinding[],
): void {
	if (entry.signature === undefined || entry.signerPublicKey === undefined) {
		pushFinding(
			findings,
			FINDING.SIGNATURE,
			index,
			`signed entry ${entry.signerKeyId} requires signature and signerPublicKey`,
			entry,
		);
	} else if (!verifyEntrySignature(entry)) {
		pushFinding(
			findings,
			FINDING.SIGNATURE,
			index,
			"signature does not verify over the canonical content",
			entry,
		);
	}
}

function checkTrustRoots(
	entry: LedgerEntry,
	position: number,
	parsedEntries: readonly ParsedSlot[],
	trustRootKeys: ReadonlyMap<string, string> | undefined,
	index: number,
	findings: LedgerFinding[],
): void {
	if (position > 0) {
		const genesisSlot = parsedEntries[0];
		if (genesisSlot !== undefined) {
			const trustRoot = genesisSlot.entry.payload?.trustRoot;
			if (trustRoot !== null && typeof trustRoot === "object") {
				const keyIds = (trustRoot as { keyIds?: unknown }).keyIds;
				if (
					Array.isArray(keyIds) &&
					!(keyIds as readonly string[]).includes(entry.signerKeyId)
				) {
					pushFinding(
						findings,
						FINDING.TRUST,
						index,
						`signer ${entry.signerKeyId} is not listed in the genesis trust root`,
						entry,
					);
				}
			}
		}
	}
	if (trustRootKeys !== undefined && !trustRootKeys.has(entry.signerKeyId)) {
		pushFinding(
			findings,
			FINDING.TRUST,
			index,
			`signer ${entry.signerKeyId} is not present in the supplied trust root`,
			entry,
		);
	}
}

export {
	EMPTY_HASH,
	ENTRY_TYPE,
	FINDING,
	SUPPORTED_SCHEMA_VERSIONS,
	appendEntry,
	computeEntryHash,
	createGenesisEntry,
	createLedgerEntry,
	extractTrustRootKeys,
	signEntry,
	sortedStringify,
	validateLedger,
	verifyEntrySignature,
};

export type {
	AppendRequest,
	AppendResult,
	EntryType,
	FindingCode,
	LedgerEntry,
	LedgerFinding,
	LedgerManifest,
	LedgerValidationReport,
	SigningPolicy,
	TrustRootPolicy,
};
