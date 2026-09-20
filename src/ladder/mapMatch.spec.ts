import { matchLaunchArgsToArgv } from "@dolphin/matchLaunch";

import { matchedQueueStatusToMatchLaunchArgs, matchPayloadToMatchLaunchArgs } from "./mapMatch";
import type { MatchPayload, QueueStatusResponse } from "./types";

describe("matchPayloadToMatchLaunchArgs", () => {
  const sampleMatch: MatchPayload = {
    matchId: "match-abc",
    seed: 123456789012345,
    localPlayerIndex: 1,
    players: [
      { playerId: "p0", rating: 1500 },
      { playerId: "p1", rating: 1520 },
    ],
    endpoints: [
      { playerId: "p0", host: "10.0.0.1", port: 4096 },
      { playerId: "p1", host: "10.0.0.2", port: 4097 },
    ],
  };

  it("maps match fields used by Bridge argv and drops ratings", () => {
    expect(matchPayloadToMatchLaunchArgs(sampleMatch)).toEqual({
      matchId: "match-abc",
      seed: 123456789012345,
      localPlayerIndex: 1,
      endpoints: [
        { playerId: "p0", host: "10.0.0.1", port: 4096 },
        { playerId: "p1", host: "10.0.0.2", port: 4097 },
      ],
    });
  });

  it("produces the same --bb-* argv as a hand-built MatchLaunchArgs", () => {
    const args = matchPayloadToMatchLaunchArgs(sampleMatch);
    const argv = matchLaunchArgsToArgv(args);
    expect(argv).toEqual([
      "--bb-match-id",
      "match-abc",
      "--bb-seed",
      "123456789012345",
      "--bb-local-idx",
      "1",
      "--bb-endpoints",
      JSON.stringify([
        { playerId: "p0", host: "10.0.0.1", port: 4096 },
        { playerId: "p1", host: "10.0.0.2", port: 4097 },
      ]),
    ]);
    expect(argv).not.toContain("--bb-host");
  });
});

describe("matchedQueueStatusToMatchLaunchArgs", () => {
  it("maps matched status", () => {
    const status: QueueStatusResponse = {
      status: "matched",
      match: {
        matchId: "m1",
        seed: 42,
        localPlayerIndex: 0,
        players: [{ playerId: "a", rating: 1 }],
        endpoints: [{ playerId: "a", host: "127.0.0.1", port: 1 }],
      },
    };
    expect(matchedQueueStatusToMatchLaunchArgs(status)).toEqual({
      matchId: "m1",
      seed: 42,
      localPlayerIndex: 0,
      endpoints: [{ playerId: "a", host: "127.0.0.1", port: 1 }],
    });
  });

  it("throws on queued/idle", () => {
    expect(() => matchedQueueStatusToMatchLaunchArgs({ status: "queued" })).toThrow(/matched/);
    expect(() => matchedQueueStatusToMatchLaunchArgs({ status: "idle" })).toThrow(/matched/);
  });
});
