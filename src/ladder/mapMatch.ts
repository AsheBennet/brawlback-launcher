import type { MatchLaunchArgs } from "@dolphin/matchLaunch";

import type { MatchPayload, QueueStatusMatched, QueueStatusResponse } from "./types";
import { isMatchedStatus } from "./types";

/**
 * Pure mapper: Ladder MatchPayload → Dolphin MatchLaunchArgs.
 * Drops players/ratings; Bridge argv only needs matchId/seed/localIdx/endpoints.
 */
export function matchPayloadToMatchLaunchArgs(match: MatchPayload): MatchLaunchArgs {
  return {
    matchId: match.matchId,
    seed: match.seed,
    localPlayerIndex: match.localPlayerIndex,
    endpoints: match.endpoints.map((e) => ({
      playerId: e.playerId,
      host: e.host,
      port: e.port,
    })),
  };
}

/**
 * Pure mapper: matched queue status → MatchLaunchArgs.
 * Throws if status is not matched.
 */
export function matchedQueueStatusToMatchLaunchArgs(status: QueueStatusResponse): MatchLaunchArgs {
  if (!isMatchedStatus(status)) {
    throw new Error(`Expected matched queue status, got "${status.status}"`);
  }
  return matchPayloadToMatchLaunchArgs(status.match);
}

export function assertMatched(status: QueueStatusResponse): QueueStatusMatched {
  if (!isMatchedStatus(status)) {
    throw new Error(`Expected matched queue status, got "${status.status}"`);
  }
  return status;
}
