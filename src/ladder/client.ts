import { getLadderBaseUrl } from "./config";
import type {
  AdvertiseEndpoint,
  QueueEnqueueResponse,
  QueueLeaveResponse,
  QueueStatusResponse,
  ReportResultRequest,
  ReportResultResponse,
  SessionResponse,
} from "./types";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type LadderClientOptions = {
  /** Defaults to LADDER_BASE_URL env or http://localhost:8080 */
  baseUrl?: string;
  fetch?: FetchLike;
};

export type LadderClient = {
  readonly baseUrl: string;
  getSessionToken(): string | null;
  getPlayerId(): string | null;
  createSession(): Promise<SessionResponse>;
  enqueue(advertise?: AdvertiseEndpoint): Promise<QueueEnqueueResponse>;
  leaveQueue(): Promise<QueueLeaveResponse>;
  getQueueStatus(): Promise<QueueStatusResponse>;
  reportResult(matchId: string, body: ReportResultRequest): Promise<ReportResultResponse>;
};

class LadderHttpError extends Error {
  constructor(message: string, public readonly status: number, public readonly body: string) {
    super(message);
    this.name = "LadderHttpError";
  }
}

export function createLadderClient(options: LadderClientOptions = {}): LadderClient {
  const baseUrl = getLadderBaseUrl(options.baseUrl);
  const fetchFn: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));

  let sessionToken: string | null = null;
  let playerId: string | null = null;

  async function request<T>(method: string, path: string, opts?: { body?: unknown; auth?: boolean }): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (opts?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (opts?.auth !== false && sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    } else if (opts?.auth) {
      throw new Error("Ladder session required; call createSession() first");
    }

    const res = await fetchFn(`${baseUrl}${path}`, {
      method,
      headers,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new LadderHttpError(`Ladder ${method} ${path} failed (${res.status})`, res.status, text);
    }

    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  return {
    baseUrl,
    getSessionToken: () => sessionToken,
    getPlayerId: () => playerId,

    async createSession() {
      const data = await request<SessionResponse>("POST", "/auth/session", { auth: false });
      sessionToken = data.sessionToken;
      playerId = data.playerId;
      return data;
    },

    async enqueue(advertise?: AdvertiseEndpoint) {
      if (!sessionToken) {
        throw new Error("Ladder session required; call createSession() first");
      }
      return request<QueueEnqueueResponse>("POST", "/queue", {
        auth: true,
        body: advertise !== undefined ? { advertise } : undefined,
      });
    },

    async leaveQueue() {
      if (!sessionToken) {
        throw new Error("Ladder session required; call createSession() first");
      }
      return request<QueueLeaveResponse>("DELETE", "/queue", { auth: true });
    },

    async getQueueStatus() {
      if (!sessionToken) {
        throw new Error("Ladder session required; call createSession() first");
      }
      return request<QueueStatusResponse>("GET", "/queue/status", { auth: true });
    },

    async reportResult(matchId: string, body: ReportResultRequest) {
      if (!sessionToken) {
        throw new Error("Ladder session required; call createSession() first");
      }
      return request<ReportResultResponse>("POST", `/match/${encodeURIComponent(matchId)}/result`, {
        auth: true,
        body,
      });
    },
  };
}

export { LadderHttpError };
