import type { LadderClient } from "./client";
import { resolveRankedMatch } from "./rankedLaunch";
import type { MatchPayload } from "./types";

describe("resolveRankedMatch", () => {
  it("sessions, enqueues, polls, and maps to MatchLaunchArgs", async () => {
    const match: MatchPayload = {
      matchId: "ranked-1",
      seed: 7,
      localPlayerIndex: 0,
      players: [{ playerId: "me", rating: 1500 }],
      endpoints: [{ playerId: "me", host: "PLACEHOLDER_HOST", port: 4096 }],
    };

    let statusCalls = 0;
    const client: LadderClient = {
      baseUrl: "http://test",
      getSessionToken: () => "t",
      getPlayerId: () => "me",
      createSession: async () => ({ sessionToken: "t", playerId: "me" }),
      enqueue: async () => ({ status: "queued" }),
      leaveQueue: async () => ({ status: "left" }),
      getQueueStatus: async () => {
        statusCalls += 1;
        if (statusCalls === 1) {
          return { status: "queued" };
        }
        return { status: "matched", match };
      },
      reportResult: async () => ({ ok: true, applied: true }),
    };

    const args = await resolveRankedMatch({
      client,
      intervalMs: 1,
      sleep: async () => undefined,
    });

    expect(args).toEqual({
      matchId: "ranked-1",
      seed: 7,
      localPlayerIndex: 0,
      endpoints: [{ playerId: "me", host: "PLACEHOLDER_HOST", port: 4096 }],
    });
  });
});
