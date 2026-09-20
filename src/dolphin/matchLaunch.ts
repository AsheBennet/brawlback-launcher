/**
 * Match launch argv contract (locked with Bridge).
 *
 * Flags appended after Dolphin's `-b -e <iso>`:
 *   --bb-match-id <string>
 *   --bb-seed <int64>
 *   --bb-local-idx <int>
 *   --bb-endpoints <json>   // [{"playerId","host","port"}, ...]
 *
 * No --bb-host / isHost. ISO path stays user-configured via settings.
 */

export type MatchEndpoint = {
  playerId: string;
  host: string;
  port: number;
};

export type MatchLaunchArgs = {
  matchId: string;
  /** int64 seed; serialized as decimal string for argv safety */
  seed: number | string;
  localPlayerIndex: number;
  endpoints: MatchEndpoint[];
};

/**
 * Pure mapper: MatchLaunchArgs → argv tokens for Dolphin spawn.
 * Flag order is stable. Endpoints JSON is compact (no spaces).
 */
export function matchLaunchArgsToArgv(args: MatchLaunchArgs): string[] {
  const endpointsJson = JSON.stringify(args.endpoints);
  return [
    "--bb-match-id",
    String(args.matchId),
    "--bb-seed",
    String(args.seed),
    "--bb-local-idx",
    String(args.localPlayerIndex),
    "--bb-endpoints",
    endpointsJson,
  ];
}
