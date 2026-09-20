import type { DolphinService, MatchLaunchArgs, ReplayQueueItem } from "@dolphin/types";
import { DolphinLaunchType } from "@dolphin/types";
import { useCallback } from "react";

import { useToasts } from "@/lib/hooks/useToasts";

import { DolphinStatus, setDolphinOpened, useDolphinStore } from "./useDolphinStore";

export const useDolphinActions = (dolphinService: DolphinService) => {
  const { showError, showSuccess } = useToasts();
  const netplayStatus = useDolphinStore((store) => store.netplayStatus);
  const playbackStatus = useDolphinStore((store) => store.playbackStatus);

  const getInstallStatus = useCallback(
    (dolphinType: DolphinLaunchType): DolphinStatus => {
      switch (dolphinType) {
        case DolphinLaunchType.NETPLAY:
          return netplayStatus;
        case DolphinLaunchType.PLAYBACK:
          return playbackStatus;
      }
    },
    [netplayStatus, playbackStatus],
  );

  const openConfigureDolphin = useCallback(
    (dolphinType: DolphinLaunchType) => {
      if (getInstallStatus(dolphinType) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
        return;
      }

      dolphinService
        .configureDolphin(dolphinType)
        .then(() => {
          setDolphinOpened(dolphinType);
        })
        .catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const clearDolphinCache = useCallback(
    (dolphinType: DolphinLaunchType) => {
      dolphinService.clearDolphinCache(dolphinType).catch(showError);
    },
    [dolphinService, showError],
  );

  const reinstallDolphin = useCallback(
    (dolphinType: DolphinLaunchType) => {
      dolphinService.reinstallDolphin(dolphinType).catch(showError);
    },
    [dolphinService, showError],
  );

  const launchNetplay = useCallback(
    (matchArgs?: MatchLaunchArgs) => {
      if (getInstallStatus(DolphinLaunchType.NETPLAY) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
        return;
      }

      // Match launch does not require PlayKey/user.json; Header still gates UI play.
      dolphinService.launchNetplayDolphin(matchArgs).catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const launchRankedMatch = useCallback(
    (options?: { baseUrl?: string }) => {
      if (getInstallStatus(DolphinLaunchType.NETPLAY) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
        return;
      }

      // Ladder: anonymous session → enqueue → poll → MatchLaunchArgs → Dolphin.
      dolphinService.launchRankedMatch(options).catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const viewReplays = useCallback(
    (...files: ReplayQueueItem[]) => {
      if (getInstallStatus(DolphinLaunchType.PLAYBACK) !== DolphinStatus.READY) {
        showError("Dolphin is updating. Try again later.");
        return;
      }

      dolphinService
        .viewSlpReplay(files)
        .then(() => {
          setDolphinOpened(DolphinLaunchType.PLAYBACK);
        })
        .catch(showError);
    },
    [getInstallStatus, dolphinService, showError],
  );

  const importDolphin = useCallback(
    (toImportDolphinPath: string, dolphinType: DolphinLaunchType) => {
      dolphinService
        .importDolphinSettings({ toImportDolphinPath, dolphinType })
        .then(() => {
          showSuccess(`${dolphinType} Dolphin settings successfully imported`);
        })
        .catch(showError);
    },
    [dolphinService, showError, showSuccess],
  );

  return {
    openConfigureDolphin,
    clearDolphinCache,
    reinstallDolphin,
    launchNetplay,
    launchRankedMatch,
    viewReplays,
    importDolphin,
  };
};
