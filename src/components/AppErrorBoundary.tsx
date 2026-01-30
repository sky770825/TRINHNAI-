import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** 頂層錯誤邊界：避免整頁空白，顯示錯誤訊息與檢查建議 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("AppErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#fafafa",
            color: "#333",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: 8 }}>
            頁面載入發生錯誤
          </h1>
          <p
            style={{
              color: "#666",
              fontSize: 14,
              maxWidth: 480,
              marginBottom: 16,
            }}
          >
            {this.state.error.message}
          </p>
          <div
            style={{
              fontSize: 13,
              color: "#888",
              textAlign: "center",
              maxWidth: 480,
            }}
          >
            <p>若為正式環境（Cloudflare），請確認：</p>
            <ul style={{ marginTop: 8, paddingLeft: 20, textAlign: "left" }}>
              <li>已設定 VITE_SUPABASE_URL、VITE_SUPABASE_PUBLISHABLE_KEY</li>
              <li>設定後已重新部署</li>
              <li>開啟瀏覽器開發者工具（F12）→ Console 查看詳細錯誤</li>
            </ul>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
