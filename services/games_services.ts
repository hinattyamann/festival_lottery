import type {
  DeleteGamesLobbyResponse,
  GetGamesLobbyResponse,
  GetGamesResultPlayerResponse,
  GetGamesResultSummaryResponse,
  PostGamesLobbyRequest,
  PostGamesLobbyResponse,
  PostGamesResultRequest,
  PostGamesResultResponse,
} from "@/types/api";
import type {
  GameId,
  GameScore,
  GameSlot,
  UserId,
  UserName,
} from "@/types/common";

import { apiEndpoint, fetcher } from "@/utils/api";

/**
 * ゲームの待機室情報を取得する(GET /api/games/lobby/{game_id})
 * @param gameId ゲームID
 * @returns ゲームの待機室情報
 */
function getGamesLobby(gameId: GameId): Promise<GetGamesLobbyResponse> {
  return fetcher<GetGamesLobbyResponse>(
    apiEndpoint(`/api/games/lobby/${gameId}`),
    {
      method: "GET",
    },
  );
}

/**
 * ゲーム結果を登録する(POST /api/games/lobby/{game_id}
 * @param gameId ゲームID
 * @param player 各スロットのユーザーID
 * @returns ゲームの待機室情報
 */
function postGamesResult(
  gameId: GameId,
  player: {
    p1: UserId | null;
    p2: UserId | null;
    p3: UserId | null;
    p4: UserId | null;
  },
): Promise<PostGamesLobbyResponse> {
  const data: PostGamesLobbyRequest = {
    gameId: gameId,
    lobby: {
      "1": player.p1,
      "2": player.p2,
      "3": player.p3,
      "4": player.p4,
    },
  };
  return fetcher<PostGamesLobbyResponse>(
    apiEndpoint(`/api/games/lobby/${gameId}`),
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/**
 * ゲーム結果を削除する(DELETE /api/games/lobby/{game_id}
 * @param gameId ゲームID
 * @returns 登録されたゲームプレイID
 */
function deleteGamesLobby(gameId: GameId): Promise<DeleteGamesLobbyResponse> {
  return fetcher<DeleteGamesLobbyResponse>(
    apiEndpoint(`/api/games/lobby/${gameId}`),
    {
      method: "DELETE",
    },
  );
}

/**
 * ゲームのプレイ結果を登録する(POST /api/games/result/{game_id} : ゲームシステム用API
 * @param gameId ゲームID
 * @param startTime 開始時間
 * @param results プレイ結果
 * @returns 登録されたゲームプレイID
 */
function PostGamesResult(
  gameId: GameId,
  startTime: string,
  results: Record<
    GameSlot,
    { id: UserId; name: UserName; score: GameScore } | null
  >,
) {
  const data: PostGamesResultRequest = {
    startAt: startTime,
    results: results,
  };
  return fetcher<PostGamesResultResponse>(
    apiEndpoint(`/api/games/result/${gameId}`),
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

/** * プレイヤーのプレイ履歴・結果を取得する(GET /api/games/result/summary)
 * @returns プレイヤーのプレイ履歴・結果
 */
function getGamesResultPlayer(
  userId: UserId,
): Promise<GetGamesResultPlayerResponse> {
  return fetcher<GetGamesResultPlayerResponse>(
    apiEndpoint(`/api/games/result/player/${userId}`),
    {
      method: "GET",
    },
  );
}

/** * ゲームのプレイ結果のサマリーを取得する(GET /api/games/result/summary/{game_id}?limit={limit})
 * @param gameId ゲームID
 * @param limit 取得するランキング数の上限
 * @returns ゲームのプレイ結果のランキング
 */
function getGamesResultPlaySummary(
  gameId: GameId,
  limit: number,
): Promise<GetGamesResultSummaryResponse> {
  if (0 < limit && limit <= 100) {
    throw new Error("Invalid limit");
  }
  return fetcher<GetGamesResultSummaryResponse>(
    apiEndpoint(`/api/games/result/play/summary/${gameId}?limit=${limit}`),
    {
      method: "GET",
    },
  );
}

export {
  getGamesLobby,
  postGamesResult,
  deleteGamesLobby,
  PostGamesResult,
  getGamesResultPlayer,
  getGamesResultPlaySummary,
};
