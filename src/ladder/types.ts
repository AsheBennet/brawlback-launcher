/** Ladder OpenAPI types (poll MVP). Auth: Authorization: Bearer <sessionToken> */

export type SessionResponse = {
  sessionToken: string;
  playerId: string;
};

export type QueueEnqueueResponse = {
  status: "queued";
};

export type QueueLeaveResponse = {
  status: "left";
};

export type MatchPlayer = {
  playerId: string;
  rating: number;
};

export type MatchEndpoint = {
  playerId: string;
  host: string;
  port: number;
};

export type MatchPayload = {
  matchId: string;
  seed: number;
  localPlayerIndex: number;
  players: MatchPlayer[];
  endpoints: MatchEndpoint[];
};

export type QueueStatusIdleOrQueued = {
  status: "queued" | "idle";
};

export type QueueStatusMatched = {
  status: "matched";
  match: MatchPayload;
};

export type QueueStatusResponse = QueueStatusIdleOrQueued | QueueStatusMatched;

export type ReportResultRequest = {
  winnerId: string;
  reportId: string;
};

export type ReportResultResponse = {
  ok: boolean;
  applied: boolean;
};

export function isMatchedStatus(status: QueueStatusResponse): status is QueueStatusMatched {
  return status.status === "matched";
}
