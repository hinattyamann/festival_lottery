const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ?? "";

/**
 * バックエンドAPIのエンドポイントURLを生成するユーティリティ関数
 * @param endpoint - エンドポイントのパス(最初のスラッシュは任意)
 * @returns 完全なAPIエンドポイントURL
 */
function apiEndpoint(endpoint: string) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${BACKEND_API_URL}${cleanEndpoint}`;
}

/**
 * REST APIを呼び出す
 * "Content-Type": "application/json"はデフォルトで設定される
 * @param url - APIエンドポイントのURL
 * @param options - Fetch APIオプション
 * @returns JSONレスポンスを解決する、またはエラーで拒否されるPromise
 */
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HTTP error! status: ${res.status}, body: ${errorBody}`);
  }
  return res.json();
}

export { apiEndpoint, fetcher };
