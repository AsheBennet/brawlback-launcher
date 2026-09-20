import { delay } from "@common/delay";

import type { LadderClient } from "./client";
import type { AdvertiseEndpoint, MatchPayload, QueueStatusResponse } from "./types";
import { isMatchedStatus } from "./types";

export type PollUntilMatchedOptions = {
  /** Poll interval in ms. Default 750. */
  intervalMs?: number;
  /** AbortSignal to cancel polling (also attempts leaveQueue when client provided). */
  signal?: AbortSignal;
  /** Injectable sleep for tests. */
  sleep?: (ms: number) => Promise<void>;
};

export type EnqueueAndPollOptions = PollUntilMatchedOptions & {
  /** Optional listen endpoint; omit for Ladder PLACEHOLDER_* assignment. No STUN — caller supplies host/port. */
  advertise?: AdvertiseEndpoint;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error("Ladder poll aborted");
    err.name = "AbortError";
    throw err;
  }
}

/**
 * Poll GET /queue/status until status === "matched" or abort.
 * Does not enqueue; call enqueue() first (or use enqueueAndPollUntilMatched).
 */
export async function pollUntilMatched(
  getStatus: () => Promise<QueueStatusResponse>,
  options: PollUntilMatchedOptions = {},
): Promise<MatchPayload> {
  const intervalMs = options.intervalMs ?? 750;
  const sleep = options.sleep ?? delay;
  const { signal } = options;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    throwIfAborted(signal);
    const status = await getStatus();
    if (isMatchedStatus(status)) {
      return status.match;
    }
    throwIfAborted(signal);
    await sleep(intervalMs);
  }
}

/**
 * POST /queue then poll GET /queue/status until matched or abort.
 * On abort, best-effort DELETE /queue when client is a full LadderClient.
 */
export async function enqueueAndPollUntilMatched(
  client: Pick<LadderClient, "enqueue" | "getQueueStatus" | "leaveQueue">,
  options: EnqueueAndPollOptions = {},
): Promise<MatchPayload> {
  throwIfAborted(options.signal);
  await client.enqueue(options.advertise);

  try {
    return await pollUntilMatched(() => client.getQueueStatus(), options);
  } catch (err) {
    if (options.signal?.aborted || (err instanceof Error && err.name === "AbortError")) {
      try {
        await client.leaveQueue();
      } catch {
        // best-effort leave
      }
    }
    throw err;
  }
}
