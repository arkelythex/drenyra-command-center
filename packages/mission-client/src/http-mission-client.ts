import { MissionClientError } from "./mission-errors";
import type {
  MissionClient, CreateMissionInput, ExecuteCommand, ApprovalInput,
  RejectInput, ReconcileInput, ApprovalResult, ReceiptVerification,
  MissionSummary, MissionFilter,
} from "./types";
import type {
  MissionSnapshot, ReadinessGateResult, AccountingException,
} from "@drenyra/mission-protocol";

interface HttpMissionClientOptions {
  baseURL: string;
  authToken?: string;
  timeout?: number;
  sseTimeout?: number;
  idempotencyKeyFactory?: () => string;
  maxSseReconnects?: number;
}

export class HttpMissionClient implements MissionClient {
  private readonly baseURL: string;
  private readonly authToken?: string;
  private readonly timeout: number;
  private readonly sseTimeout: number;
  private readonly idempotencyKeyFactory: () => string;
  readonly maxSseReconnects: number;

  constructor(options: HttpMissionClientOptions) {
    this.baseURL = options.baseURL.replace(/\/+$/, "");
    this.authToken = options.authToken;
    this.timeout = options.timeout ?? 30_000;
    this.sseTimeout = options.sseTimeout ?? 60_000;
    this.idempotencyKeyFactory = options.idempotencyKeyFactory ?? (() => crypto.randomUUID());
    this.maxSseReconnects = options.maxSseReconnects ?? 3;
  }

  private headers(idempotencyKey?: string): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.authToken) h["Authorization"] = "Bearer " + this.authToken;
    if (idempotencyKey) h["X-Idempotency-Key"] = idempotencyKey;
    return h;
  }

  private async request<T>(
    method: string, path: string, body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(this.baseURL + path, {
        method, headers: this.headers(idempotencyKey),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw MissionClientError.fromResponse(res.status, data);
      }
      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof MissionClientError) throw err;
      if ((err as Error).name === "AbortError") throw MissionClientError.timeout();
      throw MissionClientError.network((err as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }

  async create(input: CreateMissionInput): Promise<MissionSnapshot> {
    return this.request<MissionSnapshot>("POST", "/api/v1/missions", input, "create-" + this.idempotencyKeyFactory());
  }

  async get(id: string): Promise<MissionSnapshot> {
    return this.request<MissionSnapshot>("GET", "/api/v1/missions/" + id);
  }

  async list(filter?: MissionFilter): Promise<MissionSummary[]> {
    const params = new URLSearchParams();
    if (filter?.companyId) params.set("companyId", filter.companyId);
    if (filter?.status) params.set("status", filter.status);
    if (filter?.intent) params.set("intent", filter.intent);
    const qs = params.toString();
    return this.request<MissionSummary[]>("GET", "/api/v1/missions" + (qs ? "?" + qs : ""));
  }

  async *execute(id: string, command: ExecuteCommand): AsyncGenerator<MissionSnapshot> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.sseTimeout);
    try {
      const res = await fetch(this.baseURL + "/api/v1/missions/" + id + "/execute", {
        method: "POST",
        headers: this.headers("execute-" + id + "-" + this.idempotencyKeyFactory()),
        body: JSON.stringify(command),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw MissionClientError.fromResponse(res.status, data);
      }
      const reader = res.body?.getReader();
      if (!reader) throw MissionClientError.network("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6)) as MissionSnapshot;
              yield parsed;
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      if (err instanceof MissionClientError) throw err;
      if ((err as Error).name === "AbortError") throw MissionClientError.timeout();
      throw MissionClientError.network((err as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }

  async approve(id: string, approval: ApprovalInput): Promise<ApprovalResult> {
    return this.request<ApprovalResult>(
      "POST", "/api/v1/missions/" + id + "/approve", approval,
      "approve-" + id + "-" + this.idempotencyKeyFactory(),
    );
  }

  async reject(id: string, input: RejectInput): Promise<void> {
    await this.request<void>(
      "POST", "/api/v1/missions/" + id + "/reject", input,
      "reject-" + id + "-" + this.idempotencyKeyFactory(),
    );
  }

  async reconcile(id: string, input: ReconcileInput): Promise<MissionSnapshot> {
    return this.request<MissionSnapshot>(
      "POST", "/api/v1/missions/" + id + "/reconcile", input,
      "reconcile-" + id + "-" + this.idempotencyKeyFactory(),
    );
  }

  async getGates(id: string): Promise<ReadinessGateResult[]> {
    return this.request<ReadinessGateResult[]>("GET", "/api/v1/missions/" + id + "/gates");
  }

  async getExceptions(id: string): Promise<AccountingException[]> {
    return this.request<AccountingException[]>("GET", "/api/v1/missions/" + id + "/exceptions");
  }

  async verifyReceipt(missionId: string): Promise<ReceiptVerification> {
    return this.request<ReceiptVerification>("GET", "/api/v1/missions/" + missionId + "/receipt/verify");
  }
}
