import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  MessageCircle,
  Users,
  Edit2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface RemarketingMessage {
  id: string;
  hours_after_interest: number;
  message_content: string;
  is_active: boolean;
  created_at: string;
  sent_count: number;
}

const RemarketingManager = () => {
  const [messages, setMessages] = useState<RemarketingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<RemarketingMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [formHours, setFormHours] = useState("");
  const [formContent, setFormContent] = useState("");

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-leads", {
        body: { action: "getRemarketingMessages" },
      });

      if (error || data?.error) {
        toast.error("取得再行銷訊息失敗");
        return;
      }

      setMessages(data.remarketingMessages || []);
    } catch (err) {
      toast.error("連線錯誤");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const openCreateDialog = () => {
    setEditingMessage(null);
    setFormHours("");
    setFormContent("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (message: RemarketingMessage) => {
    setEditingMessage(message);
    setFormHours(message.hours_after_interest.toString());
    setFormContent(message.message_content);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const hours = parseInt(formHours);
    if (isNaN(hours) || hours < 1 || hours > 720) {
      toast.error("請輸入有效的小時數（1-720）");
      return;
    }
    if (!formContent.trim()) {
      toast.error("請輸入訊息內容");
      return;
    }

    setIsSaving(true);
    try {
      if (editingMessage) {
        // Update existing
        const { data, error } = await supabase.functions.invoke("admin-leads", {
          body: {
            action: "updateRemarketingMessage",
            remarketingMessageId: editingMessage.id,
            hoursAfterInterest: hours,
            messageContent: formContent,
          },
        });

        if (error || data?.error) {
          toast.error(data?.error || "更新失敗");
          return;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, hours_after_interest: hours, message_content: formContent }
              : m
          )
        );
        toast.success("已更新再行銷訊息");
      } else {
        // Create new
        const { data, error } = await supabase.functions.invoke("admin-leads", {
          body: {
            action: "createRemarketingMessage",
            hoursAfterInterest: hours,
            messageContent: formContent,
          },
        });

        if (error || data?.error) {
          toast.error(data?.error || "建立失敗");
          return;
        }

        setMessages((prev) => [...prev, { ...data.message, sent_count: 0 }].sort(
          (a, b) => a.hours_after_interest - b.hours_after_interest
        ));
        toast.success("已建立再行銷訊息");
      }

      setIsDialogOpen(false);
    } catch (err) {
      toast.error("操作失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (message: RemarketingMessage) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-leads", {
        body: {
          action: "updateRemarketingMessage",
          remarketingMessageId: message.id,
          isActive: !message.is_active,
        },
      });

      if (error || data?.error) {
        toast.error("更新狀態失敗");
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, is_active: !m.is_active } : m
        )
      );
      toast.success(message.is_active ? "已停用" : "已啟用");
    } catch (err) {
      toast.error("更新失敗");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("確定要刪除這則再行銷訊息嗎？")) return;

    setIsDeleting(messageId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-leads", {
        body: {
          action: "deleteRemarketingMessage",
          remarketingMessageId: messageId,
        },
      });

      if (error || data?.error) {
        toast.error("刪除失敗");
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("已刪除再行銷訊息");
    } catch (err) {
      toast.error("刪除失敗");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatHours = (hours: number) => {
    if (hours < 24) return `${hours} 小時`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) return `${days} 天`;
    return `${days} 天 ${remainingHours} 小時`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>共 {messages.length} 則再行銷訊息</span>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="w-4 h-4" />
          新增訊息
        </Button>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">📌 再行銷規則說明</p>
        <ul className="list-disc list-inside space-y-1">
          <li>系統每小時自動檢查用戶是否符合發送條件</li>
          <li>只會推送給「已查看報名資訊但尚未付款」的用戶</li>
          <li>每則訊息對同一用戶只會發送一次</li>
        </ul>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">發送時間</TableHead>
            <TableHead>訊息內容</TableHead>
            <TableHead className="w-[100px]">已發送</TableHead>
            <TableHead className="w-[80px]">狀態</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                尚未設定再行銷訊息
              </TableCell>
            </TableRow>
          ) : (
            messages.map((message) => (
              <TableRow key={message.id} className={!message.is_active ? "opacity-50" : ""}>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {formatHours(message.hours_after_interest)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-sm line-clamp-2 max-w-md">
                    {message.message_content}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {message.sent_count} 人
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={message.is_active}
                    onCheckedChange={() => handleToggleActive(message)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(message)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(message.id)}
                      disabled={isDeleting === message.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {isDeleting === message.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              {editingMessage ? "編輯再行銷訊息" : "新增再行銷訊息"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                發送時間（用戶表達興趣後幾小時）
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="720"
                  placeholder="例如：24"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">小時</span>
                {formHours && parseInt(formHours) >= 24 && (
                  <span className="text-xs text-muted-foreground">
                    = {formatHours(parseInt(formHours))}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                例如：設定 24 小時，則用戶查看報名資訊後 24 小時會收到此訊息
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">訊息內容</label>
              <Textarea
                placeholder="輸入再行銷訊息內容..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  儲存
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RemarketingManager;
