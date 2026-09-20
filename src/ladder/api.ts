/* eslint-disable import/no-default-export */
import { ipc_launchRankedMatch } from "./ipc";

export type LadderService = {
  /** session → enqueue → poll → launchNetplayDolphin(matchArgs) */
  launchRankedMatch(options?: { baseUrl?: string }): Promise<{ matchId: string }>;
};

const ladderApi: LadderService = {
  async launchRankedMatch(options?: { baseUrl?: string }) {
    const { result } = await ipc_launchRankedMatch.renderer!.trigger({ baseUrl: options?.baseUrl });
    return { matchId: result.matchId };
  },
};

export default ladderApi;
