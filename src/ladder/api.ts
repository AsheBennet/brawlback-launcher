/* eslint-disable import/no-default-export */
import { ipc_launchRankedMatch } from "./ipc";
import type { AdvertiseEndpoint } from "./types";

export type LaunchRankedMatchOptions = {
  baseUrl?: string;
  /** Optional listen endpoint; omit for Ladder PLACEHOLDER_* assignment. */
  advertise?: AdvertiseEndpoint;
};

export type LadderService = {
  /** session → enqueue → poll → launchNetplayDolphin(matchArgs) */
  launchRankedMatch(options?: LaunchRankedMatchOptions): Promise<{ matchId: string }>;
};

const ladderApi: LadderService = {
  async launchRankedMatch(options?: LaunchRankedMatchOptions) {
    const { result } = await ipc_launchRankedMatch.renderer!.trigger({
      baseUrl: options?.baseUrl,
      advertise: options?.advertise,
    });
    return { matchId: result.matchId };
  },
};

export default ladderApi;
