/* 入出場管理サービス */
import type {
  GetEntryAttractionResponse,
  GetEntrySummaryResponse,
  PostEntryAttractionVisitRequest,
  PostEntryAttractionVisitResponse,
} from "@/types/api";
import type { AttractionId, StaffName, UserId } from "@/types/common";

import { apiEndpoint, fetcher } from "@/utils/api";

/**
 * 入場に関するのサマリーを取得する(GET /api/entry/summary)
 * @returns 入場に関するサマリー
 */
async function getEntrySummary(): Promise<GetEntrySummaryResponse> {
  return fetcher<GetEntrySummaryResponse>(apiEndpoint(`/api/entry/summary`), {
    method: "GET",
  });
}

/**
 * アトラクションの入場者情報を取得する(GET /api/entry/attraction/{attraction_id}?limit={limit})
 * @param attraction アトラクションID
 * @param limit 取得する入場者数の上限
 * @returns アトラクションの情報
 */
async function getEntryAttraction(
  attraction: AttractionId,
  limit: number,
): Promise<GetEntryAttractionResponse> {
  if (0 < limit && limit <= 100) {
    throw new Error("Invalid limit");
  }
  return fetcher<GetEntryAttractionResponse>(
    apiEndpoint(`/api/entry/attraction/${attraction}?limit=${limit}`),
    {
      method: "GET",
    },
  );
}

/**
 * アトラクションの入場を記録する(POST /api/entry/attraction/{attraction_id}/visit)
 * @param user ユーザーID
 * @param attraction アトラクションID
 * @returns 記録された入場情報
 */
async function postEntryAttractionVisit(
  user: UserId,
  attraction: AttractionId,
  staff: StaffName,
): Promise<PostEntryAttractionVisitResponse> {
  const data: PostEntryAttractionVisitRequest = {
    userId: user,
    staff: staff,
  };
  return fetcher<PostEntryAttractionVisitResponse>(
    apiEndpoint(`/api/entry/attraction/${attraction}/visit`),
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export { getEntrySummary, getEntryAttraction, postEntryAttractionVisit };
