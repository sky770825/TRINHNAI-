import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = "<p>找不到 #root，請檢查 index.html</p>";
} else {
  try {
    createRoot(root).render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </React.StrictMode>
    );
  } catch (e) {
    root.innerHTML = `<p style="padding:24px;font-family:system-ui">載入失敗：${(e as Error).message}. 請檢查 Console（F12）與 Cloudflare 環境變數。</p>`;
    console.error(e);
  }
}