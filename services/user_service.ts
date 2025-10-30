/* 性格診断・ユーザー関連のサービス */
import type {
  DeleteUserResponse,
  GetUserHistoryResponse,
  GetUserResponse,
  PatchUserPersonalityRequest,
  PatchUserPersonalityResponse,
  PostUserRequest,
  PostUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
} from "@/types/api";
import type { PersonalityId, User, UserId, UserName } from "@/types/common";

import { apiEndpoint, fetcher } from "@/utils/api";
import { toNullable } from "@/utils/cast";

/**
 * ユーザー情報を取得する(GET /api/user/{user_id})
 * @param id ユーザーID
 * @returns ユーザー情報
 */
async function getUser(id: UserId): Promise<GetUserResponse> {
  return fetcher<GetUserResponse>(apiEndpoint(`/api/user/${id}`), {
    method: "GET",
  });
}

/**
 * ユーザーを作成する(POST /api/user)
 * @param name ユーザー名
 * @param personality 性格ID
 * @returns 作成されたユーザー情報
 */
async function createUser(
  name: UserName,
  personality: PersonalityId,
): Promise<PostUserResponse> {
  const data: PostUserRequest = { name, personality };
  return fetcher<PostUserResponse>(apiEndpoint(`/api/user`), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * ユーザー情報を更新する(UPDATE /api/user/{user_id})
 * @param id ユーザーID
 * @param user 更新するユーザー情報(部分的に指定可能)
 * @returns 更新されたユーザー情報
 */
async function updateUser(
  id: UserId,
  user: Partial<Omit<User, "attractions">>,
): Promise<UpdateUserResponse> {
  const data: UpdateUserRequest = toNullable(user);
  return fetcher<UpdateUserResponse>(apiEndpoint(`/api/user/${id}`), {
    method: "UPDATE",
    body: JSON.stringify(data),
  });
}

/**
 * ユーザーの性格を更新する(PATCH /api/user/{user_id}/personality)
 * @param id ユーザーID
 * @param personality 性格ID
 * @returns 更新されたユーザー情報
 */
async function patchUserPersonality(
  id: UserId,
  personality: PersonalityId,
): Promise<PatchUserPersonalityResponse> {
  const data: PatchUserPersonalityRequest = { personality };
  return fetcher<PatchUserPersonalityResponse>(
    apiEndpoint(`/api/user/${id}/personality`),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/**
 * ユーザーを削除する(DELETE /api/user/{user_id})
 * @param id ユーザーID
 * @returns 削除されたユーザー情報
 */
async function deleteUser(id: UserId): Promise<DeleteUserResponse> {
  return fetcher<DeleteUserResponse>(apiEndpoint(`/api/user/${id}`), {
    method: "DELETE",
  });
}

/**
 * ユーザーの入場履歴を取得する(GET /api/user/{user_id}/history)
 * @param id ユーザーID
 * @returns ユーザーの入場履歴情報
 */
async function getUserHistory(id: UserId): Promise<GetUserHistoryResponse> {
  return fetcher<GetUserHistoryResponse>(
    apiEndpoint(`/api/user/${id}/history`),
    {
      method: "GET",
    },
  );
}

export {
  getUser,
  createUser,
  updateUser,
  patchUserPersonality,
  deleteUser,
  getUserHistory,
};
