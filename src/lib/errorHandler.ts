/**
 * 統一的錯誤處理工具
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * 將錯誤轉換為用戶友好的中文訊息
 */
export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return "發生未知錯誤，請稍後再試";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message;

    // Supabase 錯誤
    if (message.includes("Invalid login credentials")) {
      return "電子郵件或密碼錯誤";
    }
    if (message.includes("Email not confirmed")) {
      return "請先確認您的電子郵件";
    }
    if (message.includes("User already registered")) {
      return "此電子郵件已被註冊";
    }
    if (message.includes("Password should be at least")) {
      return "密碼長度不足";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "網路連線失敗，請檢查您的網路連線";
    }
    if (message.includes("timeout")) {
      return "請求超時，請稍後再試";
    }

    // 資料庫錯誤
    if (message.includes("duplicate key") || message.includes("23505")) {
      return "此資料已存在";
    }
    if (message.includes("foreign key") || message.includes("23503")) {
      return "無法刪除，因為有相關資料";
    }
    if (message.includes("not null") || message.includes("23502")) {
      return "請填寫所有必填欄位";
    }

    // 權限錯誤
    if (message.includes("permission denied") || message.includes("401")) {
      return "您沒有權限執行此操作";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "找不到相關資料";
    }

    // 如果沒有匹配的錯誤，返回原始訊息或通用錯誤
    return message || "發生錯誤，請稍後再試";
  }

  // 處理物件類型的錯誤（如 Supabase 錯誤物件）
  if (typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    
    if (errorObj.message && typeof errorObj.message === "string") {
      return getErrorMessage(errorObj.message);
    }
    
    if (errorObj.error && typeof errorObj.error === "string") {
      return getErrorMessage(errorObj.error);
    }
  }

  return "發生未知錯誤，請稍後再試";
}

/**
 * 檢查是否為網路錯誤
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("fetch") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    );
  }
  return false;
}

/**
 * 檢查是否為超時錯誤
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("timeout") || error.message.includes("Timeout");
  }
  return false;
}

/**
 * 記錄錯誤到控制台（開發環境）
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(context ? `[${context}] Error:` : "Error:", error);
  }
}
