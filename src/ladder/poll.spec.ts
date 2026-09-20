import { enqueueAndPollUntilMatched, pollUntilMatched } from "./poll";
import type { MatchPayload, QueueStatusResponse } from "./types";

const matchedPayload: MatchPayload = {
  matchId: "m-1",
  seed: 99,
  localPlayerIndex: 0,
  players: [{ playerId: "a", rating: 1000 }],
  endpoints: [{ playerId: "a", host: "127.0.0.1", port: 4000 }],
};

describe("pollUntilMatched", () => {
  it("returns match after queued polls", async () => {
    const statuses: QueueStatusResponse[] = [
      { status: "queued" },
      { status: "queued" },
      { status: "matched", match: matchedPayload },
    ];
    let i = 0;
    const sleeps: number[] = [];

    const match = await pollUntilMatched(
      async () => {
        const s = statuses[i];
        i += 1;
        return s;
      },
      {
        intervalMs: 10,
        sleep: async (ms) => {
          sleeps.push(ms);
        },
      },
    );

    expect(match).toEqual(matchedPayload);
    expect(sleeps).toEqual([10, 10]);
    expect(i).toBe(3);
  });

  it("aborts when signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      pollUntilMatched(async () => ({ status: "queued" }), { signal: controller.signal, intervalMs: 1 }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("enqueueAndPollUntilMatched", () => {
  it("enqueues then polls until matched", async () => {
    const calls: string[] = [];
    let polls = 0;
    const client = {
      enqueue: async () => {
        calls.push("enqueue");
        return { status: "queued" as const };
      },
      getQueueStatus: async () => {
        calls.push("status");
        polls += 1;
        if (polls < 2) {
          return { status: "queued" as const };
        }
        return { status: "matched" as const, match: matchedPayload };
      },
      leaveQueue: async () => {
        calls.push("leave");
        return { status: "left" as const };
      },
    };

    const match = await enqueueAndPollUntilMatched(client, {
      intervalMs: 1,
      sleep: async () => undefined,
    });
    expect(match.matchId).toBe("m-1");
    expect(calls[0]).toBe("enqueue");
    expect(calls.filter((c) => c === "status").length).toBe(2);
    expect(calls).not.toContain("leave");
  });

  it("leaves queue on abort during poll", async () => {
    const controller = new AbortController();
    const calls: string[] = [];
    const client = {
      enqueue: async () => {
        calls.push("enqueue");
        return { status: "queued" as const };
      },
      getQueueStatus: async () => {
        calls.push("status");
        controller.abort();
        return { status: "queued" as const };
      },
      leaveQueue: async () => {
        calls.push("leave");
        return { status: "left" as const };
      },
    };

    await expect(
      enqueueAndPollUntilMatched(client, {
        signal: controller.signal,
        intervalMs: 1,
        sleep: async () => undefined,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(calls).toEqual(["enqueue", "status", "leave"]);
  });
});
