import type { FetchLike } from "./client";
import { createLadderClient } from "./client";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("createLadderClient", () => {
  it("uses default base URL and stores session from createSession", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock: FetchLike = async (url, init) => {
      calls.push({ url, init });
      if (url.endsWith("/auth/session")) {
        return jsonResponse(200, { sessionToken: "tok-1", playerId: "player-1" });
      }
      throw new Error(`unexpected ${url}`);
    };

    const client = createLadderClient({ fetch: fetchMock });
    expect(client.baseUrl).toBe("http://localhost:8080");

    const session = await client.createSession();
    expect(session).toEqual({ sessionToken: "tok-1", playerId: "player-1" });
    expect(client.getSessionToken()).toBe("tok-1");
    expect(client.getPlayerId()).toBe("player-1");
    expect(calls[0].url).toBe("http://localhost:8080/auth/session");
    expect(calls[0].init?.method).toBe("POST");
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("sends Bearer token on queue endpoints", async () => {
    const headersSeen: Array<Record<string, string>> = [];
    const fetchMock: FetchLike = async (url, init) => {
      headersSeen.push(init?.headers as Record<string, string>);
      if (url.endsWith("/auth/session")) {
        return jsonResponse(200, { sessionToken: "secret", playerId: "p" });
      }
      if (url.endsWith("/queue") && init?.method === "POST") {
        return jsonResponse(200, { status: "queued" });
      }
      if (url.endsWith("/queue") && init?.method === "DELETE") {
        return jsonResponse(200, { status: "left" });
      }
      if (url.endsWith("/queue/status")) {
        return jsonResponse(200, { status: "queued" });
      }
      if (url.includes("/match/") && url.endsWith("/result")) {
        return jsonResponse(200, { ok: true, applied: true });
      }
      throw new Error(`unexpected ${url} ${init?.method}`);
    };

    const client = createLadderClient({ baseUrl: "http://ladder.test", fetch: fetchMock });
    await client.createSession();
    await client.enqueue();
    await client.getQueueStatus();
    await client.leaveQueue();
    await client.reportResult("mid", { winnerId: "p", reportId: "r1" });

    // skip createSession (no auth)
    expect(headersSeen[1].Authorization).toBe("Bearer secret");
    expect(headersSeen[2].Authorization).toBe("Bearer secret");
    expect(headersSeen[3].Authorization).toBe("Bearer secret");
    expect(headersSeen[4].Authorization).toBe("Bearer secret");
  });

  it("includes advertise in enqueue JSON when set", async () => {
    let enqueueBody: string | undefined;
    const fetchMock: FetchLike = async (url, init) => {
      if (url.endsWith("/auth/session")) {
        return jsonResponse(200, { sessionToken: "tok", playerId: "p" });
      }
      if (url.endsWith("/queue") && init?.method === "POST") {
        enqueueBody = init.body as string | undefined;
        return jsonResponse(200, { status: "queued" });
      }
      throw new Error(`unexpected ${url} ${init?.method}`);
    };

    const client = createLadderClient({ baseUrl: "http://ladder.test", fetch: fetchMock });
    await client.createSession();
    await client.enqueue({ host: "203.0.113.10", port: 4096 });

    expect(JSON.parse(enqueueBody!)).toEqual({
      advertise: { host: "203.0.113.10", port: 4096 },
    });
  });

  it("omits enqueue body when advertise is not set", async () => {
    let enqueueInit: RequestInit | undefined;
    const fetchMock: FetchLike = async (url, init) => {
      if (url.endsWith("/auth/session")) {
        return jsonResponse(200, { sessionToken: "tok", playerId: "p" });
      }
      if (url.endsWith("/queue") && init?.method === "POST") {
        enqueueInit = init;
        return jsonResponse(200, { status: "queued" });
      }
      throw new Error(`unexpected ${url} ${init?.method}`);
    };

    const client = createLadderClient({ baseUrl: "http://ladder.test", fetch: fetchMock });
    await client.createSession();
    await client.enqueue();

    expect(enqueueInit?.body).toBeUndefined();
    expect((enqueueInit?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("throws when queue called before session", async () => {
    const client = createLadderClient({
      fetch: async () => jsonResponse(200, {}),
    });
    await expect(client.enqueue()).rejects.toThrow(/session required/);
  });

  it("surfaces HTTP errors", async () => {
    const client = createLadderClient({
      fetch: async () => jsonResponse(409, { error: "conflict" }),
    });
    // force a session so enqueue is attempted
    const withSession = createLadderClient({
      fetch: async (url) => {
        if (url.endsWith("/auth/session")) {
          return jsonResponse(200, { sessionToken: "t", playerId: "p" });
        }
        return jsonResponse(409, { error: "conflict" });
      },
    });
    await withSession.createSession();
    await expect(withSession.enqueue()).rejects.toThrow(/409/);
    void client;
  });

  it("respects LADDER_BASE_URL and strips trailing slash", () => {
    const prev = process.env.LADDER_BASE_URL;
    process.env.LADDER_BASE_URL = "http://127.0.0.1:3000/";
    try {
      const client = createLadderClient({
        fetch: async () => jsonResponse(200, {}),
      });
      expect(client.baseUrl).toBe("http://127.0.0.1:3000");
    } finally {
      if (prev === undefined) {
        delete process.env.LADDER_BASE_URL;
      } else {
        process.env.LADDER_BASE_URL = prev;
      }
    }
  });
});
