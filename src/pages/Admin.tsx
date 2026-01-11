import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Loader2, Users, Calendar, Mail, Heart, Phone, MessageCircle, Globe, CalendarDays, Store, Clock, Filter, X, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  line_id: string | null;
  service_interest: string;
  booking_timeframe: string | null;
  consent_promotions: boolean;
  source: string | null;
  notes: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  line_id: string | null;
  store: string;
  service: string;
  booking_date: string;
  booking_time: string;
  notes: string | null;
  status: string;
  created_at: string;
}

const serviceLabels: Record<string, string> = {
  nail: "美甲",
  lash: "美睫",
  tattoo: "紋繡",
  waxing: "除毛",
};

const timeframeLabels: Record<string, string> = {
  this_week: "這週",
  next_week: "下週",
  just_looking: "先了解看看",
};

const sourceLabels: Record<string, string> = {
  website: "網站表單",
  instagram: "Instagram",
  facebook: "Facebook",
  line: "LINE",
  referral: "朋友介紹",
  other: "其他",
};

const storeLabels: Record<string, string> = {
  yuanhua: "中壢元化店（前站）",
  zhongfu: "中壢忠福店（黃昏市場對面）",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "待確認", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "已確認", className: "bg-green-100 text-green-800" },
  completed: { label: "已完成", className: "bg-blue-100 text-blue-800" },
  cancelled: { label: "已取消", className: "bg-red-100 text-red-800" },
};

const Admin = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filterDateFrom) {
        const bookingDate = new Date(booking.booking_date);
        const fromDate = new Date(filterDateFrom);
        if (bookingDate < fromDate) return false;
      }
      if (filterDateTo) {
        const bookingDate = new Date(booking.booking_date);
        const toDate = new Date(filterDateTo);
        if (bookingDate > toDate) return false;
      }
      if (filterStore !== "all" && booking.store !== filterStore) return false;
      if (filterService !== "all" && booking.service !== filterService) return false;
      if (filterStatus !== "all" && booking.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterDateFrom, filterDateTo, filterStore, filterService, filterStatus]);

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterStore("all");
    setFilterService("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = filterDateFrom || filterDateTo || filterStore !== "all" || filterService !== "all" || filterStatus !== "all";

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 直接從資料庫讀取資料
      const [leadsRes, bookingsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false })
      ]);

      if (leadsRes.error) {
        console.error("Error fetching leads:", leadsRes.error);
      }
      if (bookingsRes.error) {
        console.error("Error fetching bookings:", bookingsRes.error);
      }

      setLeads(leadsRes.data || []);
      setBookings(bookingsRes.data || []);
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
    await fetchData();
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingBookingId(bookingId);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: { 
          action: "updateStatus",
          bookingId,
          newStatus,
        },
      });

      if (funcError || data?.error) {
        toast.error("更新狀態失敗");
        return;
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast.success("狀態已更新");
    } catch (err) {
      toast.error("更新狀態失敗");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setDeletingBookingId(bookingId);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: { 
          action: "deleteBooking",
          bookingId,
        },
      });

      if (funcError || data?.error) {
        toast.error("刪除預約失敗");
        return;
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("預約已刪除");
    } catch (err) {
      toast.error("刪除預約失敗");
    } finally {
      setDeletingBookingId(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    setDeletingLeadId(leadId);
    try {
      const { data, error: funcError } = await supabase.functions.invoke("admin-leads", {
        body: { 
          action: "deleteLead",
          leadId,
        },
      });

      if (funcError || data?.error) {
        toast.error("刪除名單失敗");
        return;
      }

      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      toast.success("名單已刪除");
    } catch (err) {
      toast.error("刪除名單失敗");
    } finally {
      setDeletingLeadId(null);
    }
  };

  if (isLoading) {
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
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-xl font-medium text-foreground">
              📋 Trinhnai 後台管理
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/crm">
                <MessageCircle className="w-4 h-4" />
                LINE CRM
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              預約記錄 ({filteredBookings.length})
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              名單管理 ({leads.length})
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              {/* Stats & Filter Toggle */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span>共 {filteredBookings.length} 筆預約記錄</span>
                    {hasActiveFilters && (
                      <span className="text-xs text-primary">(已篩選，共 {bookings.length} 筆)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showFilters ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="w-4 h-4" />
                      篩選
                    </Button>
                    <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "重新整理"}
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-border/50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Date From */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">開始日期</label>
                        <Input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                        />
                      </div>
                      {/* Date To */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">結束日期</label>
                        <Input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                        />
                      </div>
                      {/* Store */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">門市</label>
                        <Select value={filterStore} onValueChange={setFilterStore}>
                          <SelectTrigger>
                            <SelectValue placeholder="全部門市" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部門市</SelectItem>
                            <SelectItem value="yuanhua">中壢元化店</SelectItem>
                            <SelectItem value="zhongfu">中壢忠福店</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Service */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">服務類型</label>
                        <Select value={filterService} onValueChange={setFilterService}>
                          <SelectTrigger>
                            <SelectValue placeholder="全部服務" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部服務</SelectItem>
                            <SelectItem value="nail">美甲</SelectItem>
                            <SelectItem value="lash">美睫</SelectItem>
                            <SelectItem value="tattoo">紋繡</SelectItem>
                            <SelectItem value="waxing">除毛</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">狀態</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="全部狀態" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部狀態</SelectItem>
                            <SelectItem value="pending">待確認</SelectItem>
                            <SelectItem value="confirmed">已確認</SelectItem>
                            <SelectItem value="completed">已完成</SelectItem>
                            <SelectItem value="cancelled">已取消</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <div className="mt-4 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="w-4 h-4 mr-1" />
                          清除篩選
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>稱呼</TableHead>
                      <TableHead>聯絡方式</TableHead>
                      <TableHead>門市</TableHead>
                      <TableHead>服務項目</TableHead>
                      <TableHead>預約時間</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>備註</TableHead>
                      <TableHead>建立時間</TableHead>
                      <TableHead className="w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                          {hasActiveFilters ? "沒有符合篩選條件的預約記錄" : "目前沒有預約記錄"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{booking.email}</span>
                              </div>
                              {booking.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <a href={`tel:${booking.phone}`} className="text-sm text-primary hover:underline">
                                    {booking.phone}
                                  </a>
                                </div>
                              )}
                              {booking.line_id && (
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{booking.line_id}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{storeLabels[booking.store] || booking.store}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {serviceLabels[booking.service] || booking.service}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm whitespace-nowrap">
                                {new Date(booking.booking_date).toLocaleDateString("zh-TW")}
                              </span>
                              <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                              <span className="text-sm">{booking.booking_time}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={booking.status}
                              onValueChange={(value) => updateBookingStatus(booking.id, value)}
                              disabled={updatingBookingId === booking.id}
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                {updatingBookingId === booking.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <SelectValue>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[booking.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                                      {statusLabels[booking.status]?.label || booking.status}
                                    </span>
                                  </SelectValue>
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    待確認
                                  </span>
                                </SelectItem>
                                <SelectItem value="confirmed">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    已確認
                                  </span>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    已完成
                                  </span>
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    已取消
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {booking.notes ? (
                              <span className="text-sm text-muted-foreground truncate block" title={booking.notes}>
                                {booking.notes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(booking.created_at).toLocaleString("zh-TW")}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingBookingId === booking.id}
                                >
                                  {deletingBookingId === booking.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確認刪除預約</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    確定要刪除 {booking.name} 的預約記錄嗎？此操作無法復原。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteBooking(booking.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    確認刪除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              {/* Stats */}
              <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4 text-primary" />
                  <span>共 {leads.length} 筆名單</span>
                </div>
                <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "重新整理"}
                </Button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>稱呼</TableHead>
                      <TableHead>聯絡方式</TableHead>
                      <TableHead>服務興趣</TableHead>
                      <TableHead>預約意向</TableHead>
                      <TableHead>來源</TableHead>
                      <TableHead>接收優惠</TableHead>
                      <TableHead>建立時間</TableHead>
                      <TableHead className="w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                          目前沒有名單資料
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{lead.email}</span>
                              </div>
                              {lead.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground" />
                                  <a href={`tel:${lead.phone}`} className="text-sm text-primary hover:underline">
                                    {lead.phone}
                                  </a>
                                </div>
                              )}
                              {lead.line_id && (
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{lead.line_id}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {serviceLabels[lead.service_interest] || lead.service_interest}
                            </span>
                          </TableCell>
                          <TableCell>
                            {lead.booking_timeframe ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {timeframeLabels[lead.booking_timeframe] || lead.booking_timeframe}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.source ? (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{sourceLabels[lead.source] || lead.source}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {lead.consent_promotions ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleString("zh-TW")}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingLeadId === lead.id}
                                >
                                  {deletingLeadId === lead.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確認刪除名單</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    確定要刪除 {lead.name} 的名單資料嗎？此操作無法復原。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteLead(lead.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    確認刪除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;