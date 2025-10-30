import { HttpResponse, http } from "msw";

import type {
  DeleteGamesLobbyResponse,
  DeleteUserResponse,
  GetEntryAttractionResponse,
  GetEntrySummaryResponse,
  GetGamesLobbyResponse,
  GetGamesResultPlayerResponse,
  GetGamesResultSummaryResponse,
  GetUserHistoryResponse,
  GetUserResponse,
  PatchUserPersonalityRequest,
  PatchUserPersonalityResponse,
  PostEntryAttractionVisitRequest,
  PostEntryAttractionVisitResponse,
  PostGamesLobbyRequest,
  PostGamesLobbyResponse,
  // PostGamesResultRequest,
  // PostGamesResultResponse,
  PostUserRequest,
  PostUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from "@/types/api";
import {
  AttractionId,
  DateTime,
  GameId,
  GamePlayId,
  GameSlot,
  PersonalityId,
  UserId,
} from "@/types/common";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ?? "";

const apiEndpoint = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${BACKEND_API_URL}${cleanEndpoint}`;
};

export const handlers = [
  // GET /api/user/{user_id}
  http.get(apiEndpoint("/api/user/:id"), ({ params }) => {
    const { id } = params;
    const response: GetUserResponse = {
      id: id as UserId,
      name: "ほげたろう",
      originalPersonality: "1",
      currentPersonality: "13",
    };
    return HttpResponse.json(response);
  }),

  // POST /api/user
  http.post(apiEndpoint("/api/user"), async ({ request }) => {
    const body = (await request.json()) as PostUserRequest;
    const response: PostUserResponse = {
      id: "user_123" as UserId,
      name: body.name,
      originalPersonality: "1",
      currentPersonality: "1",
    };
    return HttpResponse.json(response);
  }),

  // UPDATE /api/user/{user_id}
  http.put(apiEndpoint("/api/user/:id"), async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as UpdateUserRequest;
    const response: UpdateUserResponse = {
      id: id as UserId,
      name: body.name ?? "ほげたろう",
      originalPersonality: "1",
      currentPersonality: body.currentPersonality ?? "13",
    };
    return HttpResponse.json(response);
  }),

  // PACTH /api/user/{user_id}/personality
  http.patch(
    apiEndpoint("/api/user/:id/personality"),
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as PatchUserPersonalityRequest;
      const response: PatchUserPersonalityResponse = {
        id: id as UserId,
        name: "ほげたろう",
        originalPersonality: "1",
        currentPersonality: body.personality,
      };
      return HttpResponse.json(response);
    },
  ),

  // DELETE /api/user/{user_id}
  http.delete(apiEndpoint("/api/user/:id"), ({ params }) => {
    const { id } = params;
    const response: DeleteUserResponse = {
      id: id as UserId,
      name: "ほげたろう",
      originalPersonality: "1",
      currentPersonality: "13",
    };
    return HttpResponse.json(response);
  }),

  // GET /api/user/{user_id}/history
  http.get(apiEndpoint("/api/user/:id/history"), ({ params }) => {
    const { id } = params;
    const response: GetUserHistoryResponse = {
      userId: id as UserId,
      history: [
        {
          attraction: "mbti",
          personality: "1",
          staff: "スタッフA",
          visitedAt: "2023-01-01T00:00:00Z",
        },
        {
          attraction: "battle",
          personality: "1",
          staff: "スタッフB",
          visitedAt: "2023-01-02T00:00:00Z",
        },
        {
          attraction: "picture",
          personality: "13",
          staff: "スタッフC",
          visitedAt: "2023-01-03T00:00:00Z",
        },
        {
          attraction: "games",
          personality: "7",
          staff: "スタッフD",
          visitedAt: "2023-01-04T00:00:00Z",
        },
        {
          attraction: "prize",
          personality: "13",
          staff: "スタッフE",
          visitedAt: "2023-01-05T00:00:00Z",
        },
        {
          attraction: "games",
          personality: "13",
          staff: "スタッフF",
          visitedAt: "2023-01-06T00:00:00Z",
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  // GET /api/entry/attraction/{attraction_id}?limit={limit}
  http.get(apiEndpoint("/api/entry/attraction/:id"), ({ params }) => {
    const { id } = params;
    const response: GetEntryAttractionResponse = {
      attraction: id as AttractionId,
      limit: 5,
      visitorsCount: 50,
      visitors: [
        {
          id: "user_001" as UserId,
          name: "ほげたろう1",
          personality: "1" as PersonalityId,
          visitedAt: "2023-01-01T00:00:00Z" as DateTime,
        },
        {
          id: "user_002" as UserId,
          name: "ほげたろう2",
          personality: "2" as PersonalityId,
          visitedAt: "2023-01-02T00:00:00Z" as DateTime,
        },
        {
          id: "user_003" as UserId,
          name: "ほげたろう3",
          personality: "3" as PersonalityId,
          visitedAt: "2023-01-03T00:00:00Z" as DateTime,
        },
        {
          id: "user_004" as UserId,
          name: "ほげたろう4",
          personality: "4" as PersonalityId,
          visitedAt: "2023-01-04T00:00:00Z" as DateTime,
        },
        {
          id: "user_005" as UserId,
          name: "ほげたろう5",
          personality: "5" as PersonalityId,
          visitedAt: "2023-01-05T00:00:00Z" as DateTime,
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  // GET /api/entry/summary
  http.get(apiEndpoint("/api/entry/summary"), () => {
    const response: GetEntrySummaryResponse = {
      all: {
        visitorsCount: 100,
        visitorsCountByPersonality: {
          "0": 5,
          "1": 10,
          "2": 8,
          "3": 7,
          "4": 9,
          "5": 6,
          "6": 5,
          "7": 12,
          "8": 4,
          "9": 3,
          "10": 11,
          "11": 2,
          "12": 1,
          "13": 15,
          "14": 7,
          "15": 0,
        },
      },
      mbti: {
        visitorsCount: 40,
        visitorsCountByPersonality: {
          "0": 2,
          "1": 5,
          "2": 3,
          "3": 4,
          "4": 3,
          "5": 2,
          "6": 1,
          "7": 6,
          "8": 1,
          "9": 1,
          "10": 4,
          "11": 0,
          "12": 0,
          "13": 5,
          "14": 2,
          "15": 1,
        },
      },
      battle: {
        visitorsCount: 30,
        visitorsCountByPersonality: {
          "0": 1,
          "1": 3,
          "2": 2,
          "3": 1,
          "4": 2,
          "5": 1,
          "6": 2,
          "7": 4,
          "8": 1,
          "9": 0,
          "10": 3,
          "11": 1,
          "12": 0,
          "13": 4,
          "14": 1,
          "15": 0,
        },
      },
      picture: {
        visitorsCount: 20,
        visitorsCountByPersonality: {
          "0": 1,
          "1": 2,
          "2": 1,
          "3": 1,
          "4": 1,
          "5": 1,
          "6": 1,
          "7": 2,
          "8": 1,
          "9": 1,
          "10": 2,
          "11": 0,
          "12": 0,
          "13": 3,
          "14": 1,
          "15": 0,
        },
      },
      games: {
        visitorsCount: 23,
        visitorsCountByPersonality: {
          "0": 1,
          "1": 3,
          "2": 2,
          "3": 2,
          "4": 2,
          "5": 1,
          "6": 1,
          "7": 3,
          "8": 1,
          "9": 1,
          "10": 2,
          "11": 1,
          "12": 0,
          "13": 3,
          "14": 1,
          "15": 0,
        },
      },
      prize: {
        visitorsCount: 17,
        visitorsCountByPersonality: {
          "0": 0,
          "1": 2,
          "2": 1,
          "3": 1,
          "4": 1,
          "5": 1,
          "6": 0,
          "7": 1,
          "8": 0,
          "9": 0,
          "10": 0,
          "11": 0,
          "12": 0,
          "13": 2,
          "14": 1,
          "15": 0,
        },
      },
    };
    return HttpResponse.json(response);
  }),

  // POST /api/entry/attraction/{attraction_id}/visit
  http.post(
    apiEndpoint("/api/entry/attraction/:id/visit"),
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as PostEntryAttractionVisitRequest;
      const response: PostEntryAttractionVisitResponse = {
        attraction: id as AttractionId,
        staff: body.staff,
        user: {
          id: body.userId,
          name: "ほげたろう",
          originalPersonality: "1",
          currentPersonality: "13",
        },
      };
      return HttpResponse.json(response);
    },
  ),

  // GET /api/games/lobby/{game_id}
  http.get(apiEndpoint("/api/games/lobby/:game_id"), ({ params }) => {
    const { id } = params;
    const response: GetGamesLobbyResponse = {
      gameId: id as GameId,
      lobby: {
        "1": {
          id: "user_001" as UserId,
          name: "ほげたろう1",
          personality: "1" as PersonalityId,
        },
        "2": {
          id: "user_002" as UserId,
          name: "ほげたろう2",
          personality: "2" as PersonalityId,
        },
        "3": {
          id: "user_003" as UserId,
          name: "ほげたろう3",
          personality: "3" as PersonalityId,
        },
        "4": null,
      },
    };
    return HttpResponse.json(response);
  }),

  // POST /api/games/lobby/{game_id}
  http.post(
    apiEndpoint("/api/games/lobby/:game_id"),
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as PostGamesLobbyRequest;
      const response: PostGamesLobbyResponse = {
        gameId: id as GameId,
        lobby: {
          "1": body.lobby["1"]
            ? {
                id: body.lobby["1"]!,
                name: "ほげたろう1",
                personality: "1" as PersonalityId,
              }
            : null,
          "2": body.lobby["2"]
            ? {
                id: body.lobby["2"]!,
                name: "ほげたろう2",
                personality: "2" as PersonalityId,
              }
            : null,
          "3": body.lobby["3"]
            ? {
                id: body.lobby["3"]!,
                name: "ほげたろう3",
                personality: "3" as PersonalityId,
              }
            : null,
          "4": body.lobby["4"]
            ? {
                id: body.lobby["4"]!,
                name: "ほげたろう4",
                personality: "4" as PersonalityId,
              }
            : null,
        },
      };
      return HttpResponse.json(response);
    },
  ),

  // DELETE /api/games/lobby/{game_id}
  http.delete(apiEndpoint("/api/games/lobby/:game_id"), ({ params }) => {
    const { id } = params;
    const response: DeleteGamesLobbyResponse = {
      gameId: id as GameId,
      lobby: {
        "1": {
          id: "user_001" as UserId,
          name: "ほげたろう1",
          personality: "1" as PersonalityId,
        },
        "2": {
          id: "user_002" as UserId,
          name: "ほげたろう2",
          personality: "2" as PersonalityId,
        },
        "3": {
          id: "user_003" as UserId,
          name: "ほげたろう3",
          personality: "3" as PersonalityId,
        },
        "4": null,
      },
    };
    return HttpResponse.json(response);
  }),

  // type GameResultEntry = {
  //   gameId: GameId;
  //   playId: GamePlayId;
  //   slot: GameSlot;
  //   score: GameScore;
  //   ranking: number;
  //   playedAt: DateTime;
  //   PlayersCount: number;
  // };

  // GET /api/games/result/summary
  http.get(apiEndpoint("/api/games/result/summary"), () => {
    const response: GetGamesResultPlayerResponse = {
      userId: "user_123" as UserId,
      results: [
        {
          gameId: "shooting" as GameId,
          playId: 1 as GamePlayId,
          slot: "1" as GameSlot,
          score: 1500,
          ranking: 13,
          playedAt: "2023-01-01T00:00:00Z" as DateTime,
          PlayersCount: 20,
        },
        {
          gameId: "shooting" as GameId,
          playId: 2 as GamePlayId,
          slot: "2" as GameSlot,
          playedAt: "2023-01-02T00:00:00Z" as DateTime,
          score: 1800,
          ranking: 12,
          PlayersCount: 18,
        },
        {
          gameId: "shooting" as GameId,
          playId: 3 as GamePlayId,
          slot: "3" as GameSlot,
          playedAt: "2023-01-03T00:00:00Z" as DateTime,
          score: 1700,
          ranking: 14,
          PlayersCount: 19,
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  // type GameRankingEntry = {
  //   rank: number;
  //   name: UserName;
  //   personality: PersonalityId;
  //   score: GameScore;
  // };
  // GET /api/games/result/summary/{game_id}?limit={limit}
  http.get(apiEndpoint("/api/games/result/summary/:game_id"), ({ params }) => {
    const { game_id } = params;
    const response: GetGamesResultSummaryResponse = {
      gameId: game_id as GameId,
      limit: 10,
      playsCount: 100,
      playersCount: 80,
      playersByPersonality: {
        "0": 5,
        "1": 10,
        "2": 8,
        "3": 7,
        "4": 9,
        "5": 6,
        "6": 5,
        "7": 12,
        "8": 4,
        "9": 3,
        "10": 11,
        "11": 2,
        "12": 1,
        "13": 15,
        "14": 7,
        "15": 0,
      },
      scoreTrends: {
        mean: 1500,
        max: 3000,
        min: 500,
      },
      ranking: [
        {
          rank: 1,
          name: "ほげたろう1",
          personality: "1",
          score: 3000,
        },
        {
          rank: 2,
          name: "ほげたろう2",
          personality: "2",
          score: 2800,
        },
        {
          rank: 2,
          name: "ほげたろう3",
          personality: "3",
          score: 2500,
        },
        {
          rank: 4,
          name: "ほげたろう4",
          personality: "4",
          score: 2400,
        },
        {
          rank: 5,
          name: "ほげたろう5",
          personality: "5",
          score: 2200,
        },
      ],
    };
    return HttpResponse.json(response);
  }),
];
