import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminGuardProps {
  children: ReactNode;
}

// 不顯示登入介面，直接可進後台與 CRM（若要恢復登入，改為 false 並設 VITE_SKIP_AUTH）
const SKIP_AUTH = true;

const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (SKIP_AUTH) return;
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (SKIP_AUTH) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">正在驗證權限...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">
            權限不足
          </h1>
          <p className="text-muted-foreground mb-6">
            您的帳號沒有管理員權限，無法存取此頁面。
            <br />
            請聯繫管理員取得權限。
          </p>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              返回首頁
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
