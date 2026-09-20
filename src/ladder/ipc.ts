import type { SuccessPayload } from "utils/ipc";
import { _, makeEndpoint } from "utils/ipc";

export const ipc_launchRankedMatch = makeEndpoint.main(
  "launchRankedMatch",
  <{ baseUrl?: string }>_,
  <SuccessPayload & { matchId: string }>_,
);
