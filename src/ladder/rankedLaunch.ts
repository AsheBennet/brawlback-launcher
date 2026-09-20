import type { MatchLaunchArgs } from "@dolphin/matchLaunch";

import type { LadderClient } from "./client";
import { createLadderClient } from "./client";
import { matchPayloadToMatchLaunchArgs } from "./mapMatch";
import type { EnqueueAndPollOptions } from "./poll";
import { enqueueAndPollUntilMatched } from "./poll";

export type ResolveRankedMatchOptions = EnqueueAndPollOptions & {
  baseUrl?: string;
  client?: LadderClient;
};

/**
 * session → enqueue → poll-until-matched → MatchLaunchArgs.
 * Pure orchestration; does not spawn Dolphin.
 */
export async function resolveRankedMatch(options: ResolveRankedMatchOptions = {}): Promise<MatchLaunchArgs> {
  const client = options.client ?? createLadderClient({ baseUrl: options.baseUrl });
  await client.createSession();
  const match = await enqueueAndPollUntilMatched(client, options);
  return matchPayloadToMatchLaunchArgs(match);
}
