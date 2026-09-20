import type { DolphinManager } from "@dolphin/manager";
import electronLog from "electron-log";

import { ipc_launchRankedMatch } from "./ipc";
import { resolveRankedMatch } from "./rankedLaunch";

const log = electronLog.scope("ladder");

export default function setupLadderIpc({ dolphinManager }: { dolphinManager: DolphinManager }) {
  ipc_launchRankedMatch.main!.handle(async ({ baseUrl, advertise }) => {
    log.info(
      `Resolving ranked match (baseUrl=${baseUrl ?? "(default)"}, advertise=${
        advertise ? `${advertise.host}:${advertise.port}` : "(placeholder)"
      })`,
    );
    const matchArgs = await resolveRankedMatch({ baseUrl, advertise });
    log.info(`Matched ${matchArgs.matchId}; launching netplay Dolphin`);
    await dolphinManager.launchNetplayDolphin(matchArgs);
    return { success: true as const, matchId: matchArgs.matchId };
  });
}
