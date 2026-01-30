import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { invokeAdminLeads, ADMIN_LEADS_401_MESSAGE } from "@/api";
import type { LineUser } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, Loader2, Users, Search, MessageCircle, 
  RefreshCw, User, Calendar, Tag, Edit2, Save, X, Clock,
  CreditCard, CheckCircle, Send, Megaphone, Filter, Repeat,
  Download, ClipboardList, ExternalLink, Settings, Plus, Trash2,
  Key, Power, PowerOff, ArrowUp, ArrowDown, Store, Image, Upload,
  Ban, CalendarX, CalendarDays, List, ChevronDown, ChevronUp,
  FileText, LayoutGrid, Layers
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
import { DayPicker } from "react-day-picker";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { zhTW } from "date-fns/locale";
import "react-day-picker/dist/style.css";

interface BotKeyword {
  id: string;
  keyword: string;
  response_type: string;
  response_content: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface LineBooking {
  id: string;
  line_user_id: string;
  user_name: string | null;
  phone: string | null;
  service: string;
  store: string;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  status: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
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

/** 關鍵字回覆類型（Flex 設計用） */
const RESPONSE_TYPE_OPTIONS: { value: string; label: string; shortDesc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "text", label: "文字回覆", shortDesc: "純文字訊息", Icon: FileText },
  { value: "image", label: "圖片", shortDesc: "單張圖片 + 選填說明", Icon: Image },
  { value: "flex_bubble", label: "Flex 氣泡", shortDesc: "單一氣泡卡片（標題+內文+按鈕）", Icon: LayoutGrid },
  { value: "flex_carousel", label: "Flex 輪播", shortDesc: "多個氣泡橫滑輪播", Icon: Layers },
  { value: "quick_reply", label: "快速回覆", shortDesc: "文字 + 選項按鈕", Icon: Send },
  { value: "registration", label: "報名流程", shortDesc: "啟動報名／匯款引導", Icon: ClipboardList },
];

const getResponseTypeLabel = (type: string) =>
  RESPONSE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? (type === "registration" ? "報名流程" : type === "text" ? "文字回覆" : type);

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
  
  // Bot settings state
  const [botSettings, setBotSettings] = useState<Record<string, { value: string; description: string }>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Bot keywords state
  const [keywords, setKeywords] = useState<BotKeyword[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isKeywordDialogOpen, setIsKeywordDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<BotKeyword | null>(null);
  const [keywordForm, setKeywordForm] = useState({
    keyword: '',
    response_type: 'text',
    response_content: '',
    description: '',
    priority: 5,
  });
  
  // Bookings state
  const [bookings, setBookings] = useState<LineBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<string>("all");
  const [bookingView, setBookingView] = useState<"table" | "calendar">("table");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Lightweight state for service/store names lookup (only for display in bookings)
  const [serviceNameMap, setServiceNameMap] = useState<Record<string, string>>({});
  const [storeNameMap, setStoreNameMap] = useState<Record<string, string>>({});

  // 使用 useMemo 優化過濾用戶列表
  const filteredUsers = useMemo(() => {
    return lineUsers.filter((user) => {
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
  }, [lineUsers, searchQuery, paymentFilter]);

  // 使用 useMemo 優化用戶統計
  const userCounts = useMemo(() => {
    const following = lineUsers.filter(u => u.follow_status === 'following');
    return {
      all: following.length,
      unpaid: following.filter(u => u.payment_status === 'unpaid').length,
      pending: following.filter(u => u.payment_status === 'pending').length,
      confirmed: following.filter(u => u.payment_status === 'confirmed').length,
    };
  }, [lineUsers]);

  // Load data on mount
  useEffect(() => {
    fetchData();
    fetchBotSettings();
    fetchKeywords();
    fetchBookings();
    // Load service and store names for booking display
    fetchServiceNames();
    fetchStoreNames();
  }, []);

  // Reset expanded booking when date changes
  useEffect(() => {
    setExpandedBookingId(null);
  }, [selectedDate]);

  const fetchBotSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('key, value, description');
      
      if (error) {
        console.error("Error fetching bot settings:", error);
        return;
      }
      
      const settingsMap: Record<string, { value: string; description: string }> = {};
      for (const row of data || []) {
        settingsMap[row.key] = { value: row.value, description: row.description || '' };
      }
      setBotSettings(settingsMap);
    } catch (err) {
      console.error("Error fetching bot settings:", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setBotSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const saveBotSettings = async () => {
    setIsSavingSettings(true);
    try {
      for (const [key, { value }] of Object.entries(botSettings)) {
        const { error } = await supabase
          .from('bot_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);
        
        if (error) {
          console.error(`Error updating ${key}:`, error);
          toast.error(`更新 ${key} 失敗`);
          return;
        }
      }
      toast.success("設定已儲存！LINE 機器人將使用新的設定。");
    } catch (err) {
      toast.error("儲存設定失敗");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchKeywords = async () => {
    setIsLoadingKeywords(true);
    try {
      const { data, error } = await supabase
        .from('bot_keywords')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) {
        console.error("Error fetching keywords:", error);
        return;
      }
      
      setKeywords(data || []);
    } catch (err) {
      console.error("Error fetching keywords:", err);
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const openKeywordDialog = (keyword?: BotKeyword) => {
    if (keyword) {
      setEditingKeyword(keyword);
      setKeywordForm({
        keyword: keyword.keyword,
        response_type: keyword.response_type,
        response_content: keyword.response_content,
        description: keyword.description || '',
        priority: keyword.priority,
      });
    } else {
      setEditingKeyword(null);
      setKeywordForm({
        keyword: '',
        response_type: 'text',
        response_content: '',
        description: '',
        priority: 5,
      });
    }
    setIsKeywordDialogOpen(true);
  };

  const saveKeyword = async () => {
    if (!keywordForm.keyword.trim()) {
      toast.error("請填寫關鍵字");
      return;
    }
    if (keywordForm.response_type !== "registration" && !keywordForm.response_content.trim()) {
      toast.error("請填寫回覆內容");
      return;
    }

    try {
      if (editingKeyword) {
        // Update existing
        const { error } = await supabase
          .from('bot_keywords')
          .update({
            keyword: keywordForm.keyword.trim(),
            response_type: keywordForm.response_type,
            response_content: keywordForm.response_content,
            description: keywordForm.description || null,
            priority: keywordForm.priority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingKeyword.id);
        
        if (error) throw error;
        toast.success("關鍵字已更新");
      } else {
        // Create new
        const { error } = await supabase
          .from('bot_keywords')
          .insert({
            keyword: keywordForm.keyword.trim(),
            response_type: keywordForm.response_type,
            response_content: keywordForm.response_content,
            description: keywordForm.description || null,
            priority: keywordForm.priority,
          });
        
        if (error) throw error;
        toast.success("關鍵字已新增");
      }
      
      setIsKeywordDialogOpen(false);
      fetchKeywords();
    } catch (err: unknown) {
      console.error("Error saving keyword:", err);
      if ((err as { code?: string })?.code === "23505") {
        toast.error("此關鍵字已存在");
      } else {
        toast.error("儲存失敗");
      }
    }
  };

  const toggleKeywordActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('bot_keywords')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(isActive ? "關鍵字已停用" : "關鍵字已啟用");
      fetchKeywords();
    } catch (err) {
      toast.error("更新失敗");
    }
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm("確定要刪除此關鍵字嗎？")) return;
    
    try {
      const { error } = await supabase
        .from('bot_keywords')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("關鍵字已刪除");
      fetchKeywords();
    } catch (err) {
      toast.error("刪除失敗");
    }
  };

  const adjustPriority = async (id: string, currentPriority: number, direction: 'up' | 'down') => {
    const newPriority = direction === 'up' ? currentPriority + 1 : currentPriority - 1;
    try {
      const { error } = await supabase
        .from('bot_keywords')
        .update({ priority: newPriority })
        .eq('id', id);
      
      if (error) throw error;
      fetchKeywords();
    } catch (err) {
      toast.error("調整優先級失敗");
    }
  };

  // Lightweight functions to fetch service/store names for display
  const fetchServiceNames = async () => {
    try {
      const { data, error } = await supabase
        .from('service_settings')
        .select('service_id, name');
      
      if (error) throw error;
      
      const nameMap: Record<string, string> = {};
      (data || []).forEach(service => {
        nameMap[service.service_id] = service.name;
      });
      setServiceNameMap(nameMap);
    } catch (err) {
      console.error("Error fetching service names:", err);
    }
  };

  const fetchStoreNames = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('store_id, name');
      
      if (error) throw error;
      
      const nameMap: Record<string, string> = {};
      (data || []).forEach(store => {
        nameMap[store.store_id] = store.name;
      });
      setStoreNameMap(nameMap);
    } catch (err) {
      console.error("Error fetching store names:", err);
    }
  };

  // Helper functions to get service and store names
  const getServiceName = (serviceId: string) => {
    return serviceNameMap[serviceId] || serviceId;
  };

  const getStoreName = (storeId: string) => {
    return storeNameMap[storeId] || storeId;
  };

  // Bookings functions
  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const { data, error } = await supabase
        .from('line_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const confirmBooking = async (bookingId: string) => {
    try {
      // First update booking status and send LINE confirmation
      const result = await invokeAdminLeads({ action: "sendBookingConfirmation", lineBookingId: bookingId });
      if (result.error) {
        toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : (result.error as string) || "確認失敗");
        return;
      }

      toast.success("預約已確認，已發送 LINE 通知");
      fetchBookings();
    } catch (err) {
      console.error("Error confirming booking:", err);
      toast.error("確認失敗");
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("確定要取消此預約嗎？")) return;
    
    try {
      const { error } = await supabase
        .from('line_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);
      
      if (error) throw error;
      toast.success("預約已取消");
      fetchBookings();
    } catch (err) {
      toast.error("取消失敗");
    }
  };

  // Calendar helper functions
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      try {
        const bookingDate = parseISO(booking.booking_date);
        return isSameDay(bookingDate, date);
      } catch {
        return false;
      }
    }).sort((a, b) => {
      // Sort by time
      const timeA = a.booking_time || '00:00';
      const timeB = b.booking_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  const getDatesWithBookings = () => {
    const dates = new Set<string>();
    bookings.forEach(booking => {
      if (booking.booking_date) {
        dates.add(booking.booking_date);
      }
    });
    return Array.from(dates).map(date => parseISO(date));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await invokeAdminLeads<{ lineUsers?: LineUser[] }>({ action: "getLineUsers" });
      if (!result.error && result.data?.lineUsers) {
        setLineUsers(result.data.lineUsers);
      } else if (result.error && result.is401) {
        toast.error(ADMIN_LEADS_401_MESSAGE);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const result = await invokeAdminLeads<{ lineUsers?: LineUser[] }>({ action: "getLineUsers" });
      if (!result.error && result.data?.lineUsers) {
        setLineUsers(result.data.lineUsers);
        toast.success("資料已更新");
      } else if (result.error && result.is401) {
        toast.error(ADMIN_LEADS_401_MESSAGE);
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

      const result = await invokeAdminLeads({
        action: "updateLineUser",
        lineUserId: selectedUser.id,
        notes: editNotes,
        tags: tagsArray,
      });

      if (result.error) {
        toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : "更新失敗");
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
      const result = await invokeAdminLeads({ action: "confirmPayment", lineUserId: userId });
      if (result.error) {
        toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : "確認付款失敗");
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
      const result = await invokeAdminLeads({ action: "sendPaymentConfirmation", lineUserId: userId });
      if (result.error) {
        toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : (result.error as string) || "發送確認訊息失敗");
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
      const result = await invokeAdminLeads({
        action: "broadcastMessage",
        targetGroup: broadcastTarget,
        message: broadcastMessage,
      });

      if (result.error) {
        toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : (result.error as string) || "推播失敗");
        return;
      }

      toast.success(`已成功推播給 ${(result.data as { sentCount?: number })?.sentCount ?? 0} 位用戶`);
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
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              關鍵字管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              機器人設定
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              預約管理
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
                        <SelectTrigger className="w-[140px]" id="payment-filter-trigger">
                          <Filter className="w-4 h-4 mr-2 shrink-0" />
                          <SelectValue placeholder="付款狀態" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={4} className="z-[100]">
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
                              loading="lazy"
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

          {/* Keywords Tab */}
          <TabsContent value="keywords">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      關鍵字管理
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      設定 LINE 機器人的關鍵字自動回覆
                    </p>
                  </div>
                  <Button onClick={() => openKeywordDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    新增關鍵字
                  </Button>
                </div>
              </div>

              {isLoadingKeywords ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">載入關鍵字中...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>狀態</TableHead>
                        <TableHead>關鍵字</TableHead>
                        <TableHead>類型</TableHead>
                        <TableHead>回覆內容</TableHead>
                        <TableHead>說明</TableHead>
                        <TableHead>優先級</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                            尚未設定任何關鍵字
                          </TableCell>
                        </TableRow>
                      ) : (
                        keywords.map((kw) => (
                          <TableRow key={kw.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleKeywordActive(kw.id, kw.is_active)}
                                className={kw.is_active ? "text-green-600" : "text-gray-400"}
                              >
                                {kw.is_active ? (
                                  <Power className="w-4 h-4" />
                                ) : (
                                  <PowerOff className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{kw.keyword}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={kw.response_type === 'registration' ? 'default' : 'secondary'}>
                                {getResponseTypeLabel(kw.response_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {kw.response_type === 'registration' 
                                  ? '啟動報名流程' 
                                  : kw.response_type === 'image' 
                                    ? (kw.response_content ? '圖片連結' : '-')
                                    : kw.response_content}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {kw.description || '-'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-sm">{kw.priority}</span>
                                <div className="flex flex-col gap-0.5 ml-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => adjustPriority(kw.id, kw.priority, 'up')}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => adjustPriority(kw.id, kw.priority, 'down')}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openKeywordDialog(kw)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteKeyword(kw.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      預約管理
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      查看和管理所有 LINE 預約
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant={bookingView === "table" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setBookingView("table")}
                        className="rounded-r-none"
                      >
                        <List className="w-4 h-4 mr-1" />
                        列表
                      </Button>
                      <Button
                        variant={bookingView === "calendar" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setBookingView("calendar")}
                        className="rounded-l-none"
                      >
                        <CalendarDays className="w-4 h-4 mr-1" />
                        行事曆
                      </Button>
                    </div>
                    <Select value={bookingFilter} onValueChange={setBookingFilter}>
                      <SelectTrigger className="w-[140px] h-8" id="booking-status-filter-trigger">
                        <Filter className="w-4 h-4 mr-2 shrink-0" />
                        <SelectValue placeholder="狀態篩選" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} className="z-[100]">
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="pending">待確認</SelectItem>
                        <SelectItem value="confirmed">已確認</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchBookings} aria-label="重新載入預約">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">載入預約中...</span>
                </div>
              ) : bookingView === "calendar" ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Calendar */}
                  <div className="bg-background rounded-lg border p-4">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={zhTW}
                      modifiers={{
                        hasBookings: getDatesWithBookings(),
                      }}
                      modifiersStyles={{
                        hasBookings: {
                          backgroundColor: 'hsl(var(--primary) / 0.2)',
                          color: 'hsl(var(--primary))',
                          fontWeight: 'bold',
                        },
                      }}
                      className="w-full"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>

                  {/* Selected Date Bookings */}
                  <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {selectedDate ? format(selectedDate, "yyyy年MM月dd日 (EEEE)", { locale: zhTW }) : "選擇日期"}
                      </h3>
                      <Badge variant="secondary">
                        {selectedDate ? getBookingsForDate(selectedDate).length : 0} 個預約
                      </Badge>
                    </div>
                    
                    {selectedDate ? (
                      <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                        {getBookingsForDate(selectedDate)
                          .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
                          .length === 0 ? (
                          <div className="text-center text-muted-foreground py-12">
                            此日期沒有預約記錄
                          </div>
                        ) : (
                          getBookingsForDate(selectedDate)
                            .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
                            .map((booking) => {
                              const isExpanded = expandedBookingId === booking.id;
                              return (
                                <div
                                  key={booking.id}
                                  className="border rounded-lg overflow-hidden hover:bg-accent/50 transition-colors"
                                >
                                  {/* Compact Header - Always Visible */}
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer"
                                    onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="font-semibold text-sm w-16 flex-shrink-0">{booking.booking_time}</span>
                                      <span className="font-medium truncate flex-1">{booking.user_name || '未提供姓名'}</span>
                                      <Badge 
                                        variant={
                                          booking.status === 'confirmed' ? 'default' : 
                                          booking.status === 'pending' ? 'secondary' : 
                                          'outline'
                                        }
                                        className="flex-shrink-0"
                                      >
                                        {booking.status === 'pending' && '待確認'}
                                        {booking.status === 'confirmed' && '已確認'}
                                        {booking.status === 'cancelled' && '已取消'}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded Details - Conditional */}
                                  {isExpanded && (
                                    <div className="border-t bg-background/50 p-4 space-y-3">
                                      <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground w-16">電話：</span>
                                            <span className="font-mono text-sm">{booking.phone || '-'}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground w-16">服務：</span>
                                            <span className="text-sm">{getServiceName(booking.service)}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Store className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">分店：</span>
                                            <span className="text-sm">{getStoreName(booking.store)}</span>
                                          </div>
                                          {booking.notes && (
                                            <div className="text-xs text-muted-foreground mt-2">
                                              <span className="font-medium">備註：</span> {booking.notes}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                        {booking.status === 'pending' && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              confirmBooking(booking.id);
                                            }}
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                          >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            確認
                                          </Button>
                                        )}
                                        {booking.status !== 'cancelled' && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              cancelBooking(booking.id);
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            取消
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-12">
                        請選擇一個日期查看預約
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>預約日期</TableHead>
                        <TableHead>時間</TableHead>
                        <TableHead>顧客</TableHead>
                        <TableHead>電話</TableHead>
                        <TableHead>服務</TableHead>
                        <TableHead>分店</TableHead>
                        <TableHead>LINE ID</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>建立時間</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings
                        .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
                        .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                            目前沒有預約記錄
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings
                          .filter(b => bookingFilter === 'all' || b.status === bookingFilter)
                          .map((booking) => (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{booking.booking_date}</TableCell>
                              <TableCell>{booking.booking_time}</TableCell>
                              <TableCell>{booking.user_name || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{booking.phone || '-'}</TableCell>
                              <TableCell>{getServiceName(booking.service)}</TableCell>
                              <TableCell>{getStoreName(booking.store)}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {booking.line_user_id ? (
                                  <span className="text-muted-foreground" title={booking.line_user_id}>
                                    {booking.line_user_id.slice(0, 8)}...
                                  </span>
                                ) : (
                                  <span className="text-red-500">未設定</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    booking.status === 'confirmed' ? 'default' : 
                                    booking.status === 'pending' ? 'secondary' : 
                                    'outline'
                                  }
                                >
                                  {booking.status === 'pending' && '待確認'}
                                  {booking.status === 'confirmed' && '已確認'}
                                  {booking.status === 'cancelled' && '已取消'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(booking.created_at).toLocaleString('zh-TW')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {booking.status === 'pending' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => confirmBooking(booking.id)}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="確認預約"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {booking.status !== 'cancelled' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => cancelBooking(booking.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="取消預約"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 p-6"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      LINE 機器人設定
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      修改後儲存，LINE 機器人會自動使用新設定
                    </p>
                  </div>
                  <Button 
                    onClick={saveBotSettings} 
                    disabled={isSavingSettings || isLoadingSettings}
                  >
                    {isSavingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    儲存設定
                  </Button>
                </div>

                {isLoadingSettings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">載入設定中...</span>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {/* Registration Info Section */}
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                        📋 報名資訊
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">活動名稱</label>
                          <Input
                            value={botSettings.event_name?.value || ''}
                            onChange={(e) => handleSettingChange('event_name', e.target.value)}
                            placeholder="美甲課程報名"
                          />
                          <p className="text-xs text-muted-foreground">{botSettings.event_name?.description}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">價格</label>
                          <Input
                            value={botSettings.price?.value || ''}
                            onChange={(e) => handleSettingChange('price', e.target.value)}
                            placeholder="NT$ 3,000"
                          />
                          <p className="text-xs text-muted-foreground">{botSettings.price?.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Info Section */}
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                        🏦 匯款資訊
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">銀行名稱</label>
                          <Input
                            value={botSettings.bank_name?.value || ''}
                            onChange={(e) => handleSettingChange('bank_name', e.target.value)}
                            placeholder="國泰世華銀行"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">銀行代碼</label>
                          <Input
                            value={botSettings.bank_code?.value || ''}
                            onChange={(e) => handleSettingChange('bank_code', e.target.value)}
                            placeholder="013"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">銀行帳號</label>
                          <Input
                            value={botSettings.account_number?.value || ''}
                            onChange={(e) => handleSettingChange('account_number', e.target.value)}
                            placeholder="123-456-789-012"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">戶名</label>
                          <Input
                            value={botSettings.account_name?.value || ''}
                            onChange={(e) => handleSettingChange('account_name', e.target.value)}
                            placeholder="Trinh Nai 美甲工作室"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Messages Section */}
                    <div className="border border-border rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                        💬 訊息設定
                      </h3>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">歡迎訊息</label>
                          <Textarea
                            value={botSettings.welcome_message?.value || ''}
                            onChange={(e) => handleSettingChange('welcome_message', e.target.value)}
                            placeholder="歡迎加入！🎉\n\n輸入「報名」即可開始報名流程。"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">用戶加入好友時會收到這個訊息</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">報名成功訊息</label>
                          <Textarea
                            value={botSettings.success_message?.value || ''}
                            onChange={(e) => handleSettingChange('success_message', e.target.value)}
                            placeholder="✅ 已收到您的匯款資訊！..."
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">用戶完成報名後會收到這個訊息</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

      {/* Keyword Dialog */}
      <Dialog open={isKeywordDialogOpen} onOpenChange={setIsKeywordDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              {editingKeyword ? '編輯關鍵字' : '新增關鍵字'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">關鍵字 *</label>
                <Input
                  placeholder="例如：價格、課程、時間"
                  value={keywordForm.keyword}
                  onChange={(e) => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  用戶輸入此關鍵字時會觸發回覆
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">回覆類型 *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {RESPONSE_TYPE_OPTIONS.map(({ value, label, shortDesc, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setKeywordForm({ ...keywordForm, response_type: value })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                        keywordForm.response_type === value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{shortDesc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {keywordForm.response_type === "text" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">回覆內容 *</label>
                <Textarea
                  placeholder="輸入機器人的回覆內容..."
                  value={keywordForm.response_content}
                  onChange={(e) => setKeywordForm({ ...keywordForm, response_content: e.target.value })}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  支援換行，可以使用 Emoji 表情符號
                </p>
              </div>
            )}

            {keywordForm.response_type === "image" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">圖片網址 *</label>
                <Input
                  placeholder="https://..."
                  value={keywordForm.response_content}
                  onChange={(e) => setKeywordForm({ ...keywordForm, response_content: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  請貼上圖片完整網址，LINE 會顯示該圖片
                </p>
              </div>
            )}

            {(keywordForm.response_type === "flex_bubble" || keywordForm.response_type === "flex_carousel") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Flex JSON *</label>
                <Textarea
                  placeholder='{"type": "bubble", "body": {"type": "box", ...}}'
                  value={keywordForm.response_content}
                  onChange={(e) => setKeywordForm({ ...keywordForm, response_content: e.target.value })}
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  flex_bubble：單一氣泡 JSON。flex_carousel：carousel 的 contents 陣列 JSON。可參考 LINE Flex Message 文件。
                </p>
              </div>
            )}

            {keywordForm.response_type === "quick_reply" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">回覆內容 *</label>
                <Textarea
                  placeholder="第一行：主要文字\n第二行起可寫「按鈕1,按鈕2,按鈕3」或 JSON"
                  value={keywordForm.response_content}
                  onChange={(e) => setKeywordForm({ ...keywordForm, response_content: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  第一行當作文字訊息，其後可放快速回覆按鈕（依 LINE webhook 實作格式）
                </p>
              </div>
            )}

            {keywordForm.response_type === "registration" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ 此關鍵字會啟動報名流程，顯示匯款資訊並引導用戶完成報名
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">說明</label>
                <Input
                  placeholder="這個關鍵字的用途說明"
                  value={keywordForm.description}
                  onChange={(e) => setKeywordForm({ ...keywordForm, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">優先級</label>
                <Input
                  type="number"
                  placeholder="0-10"
                  value={keywordForm.priority}
                  onChange={(e) => setKeywordForm({ ...keywordForm, priority: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  數字越大優先級越高
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsKeywordDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button onClick={saveKeyword}>
              <Save className="w-4 h-4 mr-2" />
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRM;