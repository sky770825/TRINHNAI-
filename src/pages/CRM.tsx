import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, Loader2, Users, Search, MessageCircle, 
  RefreshCw, User, Calendar, Tag, Edit2, Save, X, Clock,
  CreditCard, CheckCircle, Send, Megaphone, Filter, Repeat,
  Download, ClipboardList, ExternalLink
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import RemarketingManager from "@/components/RemarketingManager";

interface LineUser {
  id: string;
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
  status_message: string | null;
  follow_status: string;
  tags: string[];
  notes: string | null;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
  payment_status: string;
  payment_last_5_digits: string | null;
}

const followStatusLabels: Record<string, { label: string; className: string }> = {
  following: { label: "追蹤中", className: "bg-green-100 text-green-800" },
  unfollowed: { label: "已取消追蹤", className: "bg-gray-100 text-gray-800" },
  blocked: { label: "已封鎖", className: "bg-red-100 text-red-800" },
};

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  unpaid: { label: "未報名", className: "bg-gray-100 text-gray-600" },
  pending: { label: "待確認", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "已付費", className: "bg-green-100 text-green-800" },
};

const CRM = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [lineUsers, setLineUsers] = useState<LineUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<LineUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [isSendingConfirmation, setIsSendingConfirmation] = useState<string | null>(null);
  
  // Broadcast state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<string>("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  // Filter state
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  const filteredUsers = lineUsers.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      user.display_name?.toLowerCase().includes(query) ||
      user.line_user_id.toLowerCase().includes(query) ||
      user.notes?.toLowerCase().includes(query) ||
      user.tags?.some((tag) => tag.toLowerCase().includes(query));
    
    const matchesPaymentFilter = 
      paymentFilter === "all" || user.payment_status === paymentFilter;
    
    return matchesSearch && matchesPaymentFilter;
  });

  // Count users by payment status
  const userCounts = {
    all: lineUsers.filter(u => u.follow_status === 'following').length,
    unpaid: lineUsers.filter(u => u.payment_status === 'unpaid' && u.follow_status === 'following').length,
    pending: lineUsers.filter(u => u.payment_status === 'pending' && u.follow_status === 'following').length,
    confirmed: lineUsers.filter(u => u.payment_status === 'confirmed' && u.follow_status === 'following').length,
  };

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: { action: "getLineUsers" },
      });

      if (!funcError && data?.lineUsers) {
        setLineUsers(data.lineUsers);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: { action: "getLineUsers" },
      });

      if (!funcError && data?.lineUsers) {
        setLineUsers(data.lineUsers);
        toast.success("資料已更新");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: LineUser) => {
    setSelectedUser(user);
    setEditNotes(user.notes || "");
    setEditTags(user.tags?.join(", ") || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: {
          action: "updateLineUser",
          lineUserId: selectedUser.id,
          notes: editNotes,
          tags: tagsArray,
        },
      });

      if (funcError || data?.error) {
        toast.error("更新失敗");
        return;
      }

      // Update local state
      setLineUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, notes: editNotes, tags: tagsArray } : u
        )
      );
      setIsEditDialogOpen(false);
      toast.success("資料已儲存");
    } catch (err) {
      toast.error("更新失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPayment = async (userId: string) => {
    setIsConfirming(userId);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: {
          action: "confirmPayment",
          lineUserId: userId,
        },
      });

      if (funcError || data?.error) {
        toast.error("確認付款失敗");
        return;
      }

      setLineUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, payment_status: 'confirmed' } : u
        )
      );
      toast.success("付款已確認");
    } catch (err) {
      toast.error("確認付款失敗");
    } finally {
      setIsConfirming(null);
    }
  };

  const handleSendPaymentConfirmation = async (userId: string) => {
    setIsSendingConfirmation(userId);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: {
          action: "sendPaymentConfirmation",
          lineUserId: userId,
        },
      });

      if (funcError || data?.error) {
        toast.error(data?.error || "發送確認訊息失敗");
        return;
      }

      setLineUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, payment_status: 'confirmed' } : u
        )
      );
      toast.success("已發送付款確認訊息");
    } catch (err) {
      toast.error("發送確認訊息失敗");
    } finally {
      setIsSendingConfirmation(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error("請輸入推播訊息");
      return;
    }

    setIsBroadcasting(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: {
          action: "broadcastMessage",
          targetGroup: broadcastTarget,
          message: broadcastMessage,
        },
      });

      if (funcError || data?.error) {
        toast.error(data?.error || "推播失敗");
        return;
      }

      toast.success(`已成功推播給 ${data.sentCount} 位用戶`);
      setBroadcastMessage("");
      setIsBroadcastOpen(false);
    } catch (err) {
      toast.error("推播失敗");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadChecklist = () => {
    // Filter confirmed users
    const confirmedUsers = lineUsers.filter(
      (user) => user.payment_status === "confirmed"
    );

    if (confirmedUsers.length === 0) {
      toast.error("目前沒有已付費的用戶");
      return;
    }

    // CSV header with BOM for Excel compatibility
    const BOM = "\uFEFF";
    const headers = ["姓名", "簽到", "報名方案", "報名時間", "報名費用", "備註"];
    
    // Generate CSV rows
    const rows = confirmedUsers.map((user) => {
      const name = user.display_name || "未設定名稱";
      const checkIn = ""; // Empty for manual check
      const plan = ""; // Placeholder - can be filled manually
      const registrationTime = user.created_at
        ? new Date(user.created_at).toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const fee = ""; // Placeholder - can be filled manually
      const notes = user.notes || "";

      // Escape fields that might contain commas or quotes
      const escapeField = (field: string) => {
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      return [name, checkIn, plan, registrationTime, fee, notes]
        .map(escapeField)
        .join(",");
    });

    // Combine headers and rows
    const csvContent = BOM + [headers.join(","), ...rows].join("\n");

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `簽到表_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`已下載 ${confirmedUsers.length} 位已付費用戶的簽到表`);
  };

  if (isLoading && lineUsers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">載入資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-medium text-foreground">
              🤖 LINE 客戶管理 CRM
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadChecklist}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
            >
              <ClipboardList className="w-4 h-4" />
              下載簽到表 ({userCounts.confirmed})
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsBroadcastOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Megaphone className="w-4 h-4" />
              訊息推播
            </Button>
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              重新整理
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin">
                <Users className="w-4 h-4" />
                後台管理
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              用戶管理
            </TabsTrigger>
            <TabsTrigger value="remarketing" className="flex items-center gap-2">
              <Repeat className="w-4 h-4" />
              再行銷設定
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              {/* Search & Stats & Filter */}
              <div className="p-6 border-b border-border/50">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4 text-primary" />
                      <span>共 {lineUsers.length} 位 LINE 用戶</span>
                      {(searchQuery || paymentFilter !== "all") && (
                        <span className="text-xs text-primary">
                          (篩選 {filteredUsers.length} 筆)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="搜尋用戶名稱、備註、標籤..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-[140px]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="付款狀態" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部 ({userCounts.all})</SelectItem>
                          <SelectItem value="unpaid">未報名 ({userCounts.unpaid})</SelectItem>
                          <SelectItem value="pending">待確認 ({userCounts.pending})</SelectItem>
                          <SelectItem value="confirmed">已付費 ({userCounts.confirmed})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用戶</TableHead>
                  <TableHead>LINE ID</TableHead>
                  <TableHead>追蹤狀態</TableHead>
                  <TableHead>付款狀態</TableHead>
                  <TableHead>匯款後五碼</TableHead>
                  <TableHead>標籤</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead>最後互動</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                      {searchQuery ? "沒有符合搜尋條件的用戶" : "目前沒有 LINE 用戶資料"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.picture_url ? (
                            <img
                              src={user.picture_url}
                              alt={user.display_name || "User"}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.display_name || "未設定名稱"}</p>
                            {user.status_message && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {user.status_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.line_user_id}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            followStatusLabels[user.follow_status]?.className ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {followStatusLabels[user.follow_status]?.label || user.follow_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            paymentStatusLabels[user.payment_status]?.className ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {paymentStatusLabels[user.payment_status]?.label || user.payment_status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.payment_last_5_digits || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {user.tags?.slice(0, 3).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {user.tags && user.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {user.notes || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.last_interaction_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            title="編輯"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {user.payment_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmPayment(user.id)}
                                disabled={isConfirming === user.id}
                                title="確認付款"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                {isConfirming === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendPaymentConfirmation(user.id)}
                                disabled={isSendingConfirmation === user.id}
                                title="確認並發送 LINE 通知"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                {isSendingConfirmation === user.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
            </motion.div>
          </TabsContent>

          {/* Remarketing Tab */}
          <TabsContent value="remarketing">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 p-6"
            >
              <RemarketingManager />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.picture_url ? (
                <img
                  src={selectedUser.picture_url}
                  alt={selectedUser.display_name || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              編輯 {selectedUser?.display_name || "用戶"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                標籤（用逗號分隔）
              </label>
              <Input
                placeholder="VIP, 常客, 美甲愛好者..."
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                備註
              </label>
              <Textarea
                placeholder="新增備註..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              取消
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              訊息推播
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">推播對象</label>
              <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇推播對象" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    全部追蹤中用戶 ({userCounts.all} 人)
                  </SelectItem>
                  <SelectItem value="unpaid">
                    未報名用戶 ({userCounts.unpaid} 人)
                  </SelectItem>
                  <SelectItem value="pending">
                    待確認付款用戶 ({userCounts.pending} 人)
                  </SelectItem>
                  <SelectItem value="confirmed">
                    已付費用戶 ({userCounts.confirmed} 人)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">推播訊息</label>
              <Textarea
                placeholder="輸入要推播的訊息內容..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                訊息將會發送給所有符合條件且追蹤中的用戶
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBroadcastOpen(false)}
              disabled={isBroadcasting}
            >
              取消
            </Button>
            <Button 
              onClick={handleBroadcast} 
              disabled={isBroadcasting || !broadcastMessage.trim()}
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  推播中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  發送推播
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;
