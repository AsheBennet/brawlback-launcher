import type { MatchLaunchArgs } from "./matchLaunch";
import { matchLaunchArgsToArgv } from "./matchLaunch";

describe("matchLaunchArgsToArgv", () => {
  const base: MatchLaunchArgs = {
    matchId: "match-abc",
    seed: 123456789012345,
    localPlayerIndex: 0,
    endpoints: [],
  };

  it("emits flags in stable order with empty endpoints", () => {
    const argv = matchLaunchArgsToArgv(base);
    expect(argv).toEqual([
      "--bb-match-id",
      "match-abc",
      "--bb-seed",
      "123456789012345",
      "--bb-local-idx",
      "0",
      "--bb-endpoints",
      "[]",
    ]);
  });

  it("serializes multi-peer endpoints as compact JSON", () => {
    const argv = matchLaunchArgsToArgv({
      ...base,
      localPlayerIndex: 1,
      endpoints: [
        { playerId: "p0", host: "10.0.0.1", port: 4096 },
        { playerId: "p1", host: "10.0.0.2", port: 4097 },
      ],
    });

    expect(argv[0]).toBe("--bb-match-id");
    expect(argv[2]).toBe("--bb-seed");
    expect(argv[4]).toBe("--bb-local-idx");
    expect(argv[5]).toBe("1");
    expect(argv[6]).toBe("--bb-endpoints");

    const endpointsJson = argv[7];
    expect(endpointsJson).not.toMatch(/\s/);
    expect(JSON.parse(endpointsJson)).toEqual([
      { playerId: "p0", host: "10.0.0.1", port: 4096 },
      { playerId: "p1", host: "10.0.0.2", port: 4097 },
    ]);
  });

  it("keeps stable flag order across calls", () => {
    const a = matchLaunchArgsToArgv(base);
    const b = matchLaunchArgsToArgv({
      matchId: "other",
      seed: "999",
      localPlayerIndex: 3,
      endpoints: [{ playerId: "x", host: "127.0.0.1", port: 1 }],
    });
    const flagIndexes = (argv: string[]) =>
      ["--bb-match-id", "--bb-seed", "--bb-local-idx", "--bb-endpoints"].map((f) => argv.indexOf(f));
    expect(flagIndexes(a)).toEqual([0, 2, 4, 6]);
    expect(flagIndexes(b)).toEqual([0, 2, 4, 6]);
  });

  it("stringifies seed without introducing --bb-host", () => {
    const argv = matchLaunchArgsToArgv({ ...base, seed: "9007199254740993" });
    expect(argv).toContain("--bb-seed");
    expect(argv[argv.indexOf("--bb-seed") + 1]).toBe("9007199254740993");
    expect(argv).not.toContain("--bb-host");
  });
});
