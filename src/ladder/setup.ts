import type { DolphinManager } from "@dolphin/manager";
import electronLog from "electron-log";

import { ipc_launchRankedMatch } from "./ipc";
import { resolveRankedMatch } from "./rankedLaunch";

const log = electronLog.scope("ladder");

export default function setupLadderIpc({ dolphinManager }: { dolphinManager: DolphinManager }) {
  ipc_launchRankedMatch.main!.handle(async ({ baseUrl }) => {
    log.info(`Resolving ranked match (baseUrl=${baseUrl ?? "(default)"})`);
    const matchArgs = await resolveRankedMatch({ baseUrl });
    log.info(`Matched ${matchArgs.matchId}; launching netplay Dolphin`);
    await dolphinManager.launchNetplayDolphin(matchArgs);
    return { success: true as const, matchId: matchArgs.matchId };
  });
}
