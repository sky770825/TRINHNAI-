/**
 * admin-leads Edge Function 需驗證：JWT（登入且為 admin）或 body.password === ADMIN_PASSWORD。
 * 401 = 未登入且未提供正確密碼。
 */

const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

/** 組裝 admin-leads 的 body；開發時若設 VITE_SKIP_AUTH + VITE_ADMIN_PASSWORD，會自動帶入密碼以通過驗證 */
export function adminLeadsBody<T extends Record<string, unknown>>(body: T): T & { password?: string } {
  if (SKIP_AUTH && typeof ADMIN_PASSWORD === "string" && ADMIN_PASSWORD.length > 0) {
    return { ...body, password: ADMIN_PASSWORD } as T & { password?: string };
  }
  return body as T & { password?: string };
}

/** 401 時給使用者的說明（可顯示在 toast） */
export const ADMIN_LEADS_401_MESSAGE =
  "請先登入管理員帳號。開發時可在 .env 設定 VITE_ADMIN_PASSWORD，並在 Supabase Edge Function 的 ADMIN_PASSWORD 設為相同值以略過登入。";

const HAS_ADMIN_PASSWORD = typeof ADMIN_PASSWORD === "string" && ADMIN_PASSWORD.length > 0;

/** 開發時 401 發生時在 console 印出設定提示（只印一次） */
let _logged401Hint = false;
function logAdminLeads401Hint(): void {
  if (!import.meta.env.DEV || _logged401Hint) return;
  _logged401Hint = true;
  if (SKIP_AUTH && !HAS_ADMIN_PASSWORD) {
    console.warn(
      "[admin-leads 401] 未登入且未帶密碼。若要略過登入：在專案根目錄 .env 加入\n  VITE_ADMIN_PASSWORD=你的密碼\n並在 Supabase Dashboard → Edge Functions → admin-leads → 設定 ADMIN_PASSWORD 為相同值，然後重啟 dev server。"
    );
  }
}

/** 判斷 invoke 回傳是否為 401（未授權）；若為 401 或開發時未設密碼的錯誤，會在 console 印出設定提示 */
export function isAdminLeads401(
  funcError: unknown,
  dataError: unknown
): boolean {
  const err = funcError as { status?: number; response?: { status?: number }; message?: string } | null;
  const status = err?.status ?? err?.response?.status;
  const msg =
    typeof dataError === "string"
      ? dataError
      : (dataError as { message?: string })?.message ?? err?.message ?? "";
  const is401 =
    status === 401 ||
    msg.includes("未授權") ||
    msg.includes("Unauthorized") ||
    /401/.test(msg);
  // 確定是 401 時印提示；或開發時未設密碼且有任何錯誤也印（常見就是 401）
  if (is401 || (import.meta.env.DEV && SKIP_AUTH && !HAS_ADMIN_PASSWORD && (funcError || dataError))) {
    logAdminLeads401Hint();
  }
  return is401;
}
