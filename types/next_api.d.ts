// クライアント -> サーバー POST リクエストボディ
type AuthRequest = {
  password: string;
};

// サーバー -> クライアント レスポンスボディ
type AuthResponse = {
  success: boolean;
  message?: string;
  error?: "missing_password" | "invalid_password" | "internal_server_error";
};

export type { AuthRequest, AuthResponse };
