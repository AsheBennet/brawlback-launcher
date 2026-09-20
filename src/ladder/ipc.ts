import type { SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

import type { AdvertiseEndpoint } from "./types";

export const ipc_launchRankedMatch = makeEndpoint.main(
  "launchRankedMatch",
  <{ baseUrl?: string; advertise?: AdvertiseEndpoint }>_,
  <SuccessPayload & { matchId: string }>_,
);
