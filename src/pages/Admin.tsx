import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured, SUPABASE_CONFIG_MESSAGE } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchLeads,
  fetchBookings,
  updateBookingStatus as apiUpdateBookingStatus,
  deleteBooking as apiDeleteBooking,
  deleteLead as apiDeleteLead,
  invokeAdminLeads,
  isAdminLeads401,
  ADMIN_LEADS_401_MESSAGE,
  fetchServices as apiFetchServices,
  fetchStores as apiFetchStores,
  fetchSiteAssets as apiFetchSiteAssets,
  fetchSiteContent as apiFetchSiteContent,
  updateSiteAsset,
  insertSiteAsset,
  uploadSiteAsset,
  updateSiteContent as apiUpdateSiteContent,
  fetchAnnouncements as apiFetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement as apiDeleteAnnouncement,
  toggleAnnouncementActive as apiToggleAnnouncementActive,
  uploadAnnouncementImage,
  checkAnnouncementBucketExists,
  removeAnnouncementImage,
  createService,
  updateService,
  deleteService as apiDeleteService,
  updateServiceSortOrder,
  uploadServiceImage,
  removeServiceImage,
  createStore,
  updateStore,
  deleteStore as apiDeleteStore,
  toggleStoreActive as apiToggleStoreActive,
} from "@/api";
import type { Lead, Booking, ServiceSetting, StoreSetting, Announcement, SiteAssetRow, SiteContentRow } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LogOut, Loader2, Users, Calendar, Mail, Heart, Phone, MessageCircle, Globe, CalendarDays, Store, Clock, Filter, X, ExternalLink, RefreshCw, Trash2, Bell, Image, Power, PowerOff, Plus, Edit2, Save, Upload, GripVertical, Trash } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

  // Services state
  const [services, setServices] = useState<ServiceSetting[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceSetting | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('new');
  const [serviceForm, setServiceForm] = useState({
    service_id: '',
    name: '',
    description: '',
    price_range: '',
    image_url: '',
    aspect_ratio: '20:13',
    sort_order: 0,
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Stores state
  const [stores, setStores] = useState<StoreSetting[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreSetting | null>(null);
  const [storeForm, setStoreForm] = useState({
    store_id: '',
    name: '',
    address: '',
    opening_time: '09:00',
    closing_time: '22:00',
    time_slot_duration: 60,
    available_days: ['1','2','3','4','5','6','0'] as string[],
  });

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    image_url: '',
    is_active: true,
    priority: 0,
    start_date: '',
    end_date: '',
  });
  const [announcementImagePreview, setAnnouncementImagePreview] = useState<string>('');
  const [selectedAnnouncementImageFile, setSelectedAnnouncementImageFile] = useState<File | null>(null);

  // 網站設定：Logo、封面、全站區塊
  /** 將 content（JSON 物件/陣列）轉成易讀文字摘要，表格預覽用，不顯示程式碼 */
  const contentToPreviewText = (content: unknown, maxLen = 80): string => {
    const trunc = (s: string) => (s.length > maxLen ? s.slice(0, maxLen) + '…' : s);
    if (content == null) return '—';
    if (typeof content === 'string') return trunc(content);
    if (Array.isArray(content)) {
      const labels = content
        .map((item) => (item && typeof item === 'object' && 'label' in item && typeof (item as { label?: unknown }).label === 'string' ? (item as { label: string }).label : null))
        .filter(Boolean) as string[];
      if (labels.length) return trunc(labels.join('、'));
      return content.length ? `${content.length} 項` : '—';
    }
    if (typeof content === 'object') {
      const obj = content as Record<string, unknown>;
      const textKeys = ['copyright', 'badge', 'brand', 'headline1', 'headline2', 'services', 'cta_booking', 'cta_line', 'booking', 'contact'];
      const parts: string[] = [];
      for (const k of textKeys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim()) parts.push(v.trim());
      }
      if (parts.length) return trunc(parts.join(' · '));
      const keys = Object.keys(obj);
      return keys.length ? `${keys.length} 個欄位` : '—';
    }
    return '—';
  };
  const [siteAssets, setSiteAssets] = useState<SiteAssetRow[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContentRow[]>([]);
  const [isLoadingSite, setIsLoadingSite] = useState(false);
  const [siteLogoFile, setSiteLogoFile] = useState<File | null>(null);
  const [siteCoverFile, setSiteCoverFile] = useState<File | null>(null);
  const [isSavingSiteAsset, setIsSavingSiteAsset] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editingContentJson, setEditingContentJson] = useState<string>("");
  const [isSavingContent, setIsSavingContent] = useState(false);

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
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    fetchData();
    fetchServices();
    fetchStores();
    fetchAnnouncements();
    fetchSiteAssets();
    fetchSiteContent();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsRes, bookingsRes] = await Promise.all([
        fetchLeads(),
        fetchBookings(),
      ]);
      if (leadsRes.error) console.error("Error fetching leads:", leadsRes.error);
      if (bookingsRes.error) console.error("Error fetching bookings:", bookingsRes.error);
      setLeads(leadsRes.data ?? []);
      setBookings(bookingsRes.data ?? []);
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
    await fetchData();
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingBookingId(bookingId);
    try {
      const result = await invokeAdminLeads<{ success?: boolean }>({
        action: "updateStatus",
        bookingId,
        newStatus,
      });
      if (!result.error) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
        toast.success("狀態已更新");
        return;
      }
      if (import.meta.env.DEV) {
        const { error: directError } = await apiUpdateBookingStatus(bookingId, newStatus);
        if (!directError) {
          setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
          );
          toast.success("狀態已更新（開發模式直接寫入）");
          return;
        }
      }
      toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : "更新狀態失敗");
    } catch (err) {
      toast.error("更新狀態失敗");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    setDeletingBookingId(bookingId);
    try {
      const result = await invokeAdminLeads({ action: "deleteBooking", bookingId });
      if (!result.error) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        toast.success("預約已刪除");
        return;
      }
      if (import.meta.env.DEV) {
        const { error: directError } = await apiDeleteBooking(bookingId);
        if (!directError) {
          setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          toast.success("預約已刪除（開發模式直接寫入）");
          return;
        }
      }
      toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : "刪除預約失敗");
    } catch (err) {
      toast.error("刪除預約失敗");
    } finally {
      setDeletingBookingId(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    setDeletingLeadId(leadId);
    try {
      const result = await invokeAdminLeads({ action: "deleteLead", leadId });
      if (!result.error) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        toast.success("名單已刪除");
        return;
      }
      if (import.meta.env.DEV) {
        const { error: directError } = await apiDeleteLead(leadId);
        if (!directError) {
          setLeads((prev) => prev.filter((l) => l.id !== leadId));
          toast.success("名單已刪除（開發模式直接寫入）");
          return;
        }
      }
      toast.error(result.is401 ? ADMIN_LEADS_401_MESSAGE : "刪除名單失敗");
    } catch (err) {
      toast.error("刪除名單失敗");
    } finally {
      setDeletingLeadId(null);
    }
  };

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const { data, error } = await apiFetchServices();
      if (error) throw error;
      setServices(data ?? []);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const openServiceDialog = (service?: ServiceSetting) => {
    if (service) {
      setEditingService(service);
      setSelectedServiceId(service.service_id);
      setServiceForm({
        service_id: service.service_id,
        name: service.name,
        description: service.description,
        price_range: service.price_range,
        image_url: service.image_url,
        aspect_ratio: service.aspect_ratio || '20:13',
        sort_order: service.sort_order,
      });
      setImagePreview(service.image_url);
    } else {
      setEditingService(null);
      setSelectedServiceId('new');
      setServiceForm({
        service_id: '',
        name: '',
        description: '',
        price_range: '',
        image_url: '',
        aspect_ratio: '20:13',
        sort_order: services.length,
      });
      setImagePreview('');
    }
    setSelectedImageFile(null);
    setIsServiceDialogOpen(true);
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId === 'new') {
      setEditingService(null);
      setServiceForm({
        service_id: '',
        name: '',
        description: '',
        price_range: '',
        image_url: '',
        aspect_ratio: '20:13',
        sort_order: services.length,
      });
      setImagePreview('');
      setSelectedImageFile(null);
    } else {
      const service = services.find(s => s.service_id === serviceId);
      if (service) {
        setEditingService(service);
        setServiceForm({
          service_id: service.service_id,
          name: service.name,
          description: service.description,
          price_range: service.price_range,
          image_url: service.image_url,
          aspect_ratio: service.aspect_ratio || '20:13',
          sort_order: service.sort_order,
        });
        setImagePreview(service.image_url);
        setSelectedImageFile(null);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("圖片大小不能超過 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("請選擇圖片檔案");
        return;
      }
      setSelectedImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setServiceForm({ ...serviceForm, image_url: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveService = async () => {
    if (!serviceForm.service_id || !serviceForm.name) {
      toast.error("請填寫服務 ID 和名稱");
      return;
    }
    if (!selectedImageFile && !editingService) {
      toast.error("請上傳圖片");
      return;
    }
    try {
      let finalImageUrl = serviceForm.image_url;
      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split(".").pop();
        const filePath = `${serviceForm.service_id}-${Date.now()}.${fileExt}`;
        const { publicUrl, error: uploadError } = await uploadServiceImage(selectedImageFile, filePath);
        if (uploadError || !publicUrl) {
          toast.error("圖片上傳失敗");
          return;
        }
        finalImageUrl = publicUrl;
        if (editingService?.image_url?.includes("service-images")) {
          const oldPath = editingService.image_url.split("/service-images/").pop();
          if (oldPath) await removeServiceImage(oldPath);
        }
      }
      const payload = {
        service_id: serviceForm.service_id,
        name: serviceForm.name,
        description: serviceForm.description,
        price_range: serviceForm.price_range,
        image_url: finalImageUrl,
        aspect_ratio: serviceForm.aspect_ratio,
        sort_order: serviceForm.sort_order,
        ...(editingService ? { updated_at: new Date().toISOString() } : {}),
      };
      if (editingService) {
        const { error } = await updateService(editingService.id, payload);
        if (error) throw error;
        toast.success("服務已更新");
      } else {
        const { error } = await createService(payload);
        if (error) throw error;
        toast.success("服務已新增");
      }
      setIsServiceDialogOpen(false);
      setSelectedImageFile(null);
      setImagePreview("");
      fetchServices();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "23505") toast.error("此服務 ID 已存在");
      else toast.error("儲存失敗");
    }
  };

  const toggleServiceActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await updateService(id, { is_active: !isActive });
      if (error) throw error;
      toast.success(isActive ? "服務已停用" : "服務已啟用");
      fetchServices();
    } catch (err) {
      toast.error("更新失敗");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("確定要刪除此服務嗎？這將同時刪除相關圖片。")) return;
    try {
      const service = services.find((s) => s.id === id);
      const { error } = await apiDeleteService(id);
      if (error) throw error;
      if (service?.image_url?.includes("service-images")) {
        const imagePath = service.image_url.split("/service-images/").pop();
        if (imagePath) await removeServiceImage(imagePath);
      }
      toast.success("服務已刪除");
      fetchServices();
    } catch (err) {
      toast.error("刪除失敗");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id);
      const newIndex = services.findIndex((s) => s.id === over.id);

      const newServices = arrayMove(services, oldIndex, newIndex);
      setServices(newServices);

      try {
        for (let i = 0; i < newServices.length; i++) {
          const { error } = await updateServiceSortOrder(newServices[i].id, i);
          if (error) throw error;
        }
        toast.success("排序已更新");
      } catch (err) {
        console.error("Error updating sort order:", err);
        toast.error("更新排序失敗");
        fetchServices();
      }
    }
  };

  const SortableServiceRow = ({ service }: { service: ServiceSetting }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: service.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <TableRow
        ref={setNodeRef}
        style={style}
        className={isDragging ? "bg-accent" : ""}
      >
        <TableCell className="w-8 cursor-grab active:cursor-grabbing">
          <div {...attributes} {...listeners} className="flex items-center">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleServiceActive(service.id, service.is_active)}
            className={service.is_active ? "text-green-600" : "text-gray-400"}
          >
            {service.is_active ? (
              <Power className="w-4 h-4" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>
          <img 
            src={service.image_url} 
            alt={service.name}
            loading="lazy"
            className="w-16 h-16 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
            }}
          />
        </TableCell>
        <TableCell className="font-mono text-sm">{service.service_id}</TableCell>
        <TableCell className="font-medium">{service.name}</TableCell>
        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
          {service.description}
        </TableCell>
        <TableCell className="text-sm">{service.price_range}</TableCell>
        <TableCell className="font-mono">{service.sort_order}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openServiceDialog(service)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteService(service.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const fetchStores = async () => {
    setIsLoadingStores(true);
    try {
      const { data, error } = await apiFetchStores();
      if (error) throw error;
      setStores(data ?? []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    } finally {
      setIsLoadingStores(false);
    }
  };

  const fetchSiteAssets = async () => {
    setIsLoadingSite(true);
    try {
      const { data, error } = await apiFetchSiteAssets();
      if (error) throw error;
      setSiteAssets(data ?? []);
    } catch (err) {
      console.error("Error fetching site_assets:", err);
      setSiteAssets([]);
    } finally {
      setIsLoadingSite(false);
    }
  };

  const fetchSiteContent = async () => {
    try {
      const { data, error } = await apiFetchSiteContent();
      if (error) throw error;
      setSiteContent(data ?? []);
    } catch (err) {
      console.error("Error fetching site_content:", err);
      setSiteContent([]);
    }
  };

  const saveSiteAsset = async (key: string, file: File, altText?: string) => {
    setIsSavingSiteAsset(key);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${key === "logo" ? "logo" : "cover"}/${key}-${Date.now()}.${ext}`;
      const { publicUrl, error: uploadError } = await uploadSiteAsset("site-assets", file, path);
      if (uploadError || !publicUrl) {
        toast.error(`上傳失敗：${(uploadError as Error)?.message ?? "未知錯誤"}`);
        return;
      }
      const row = siteAssets.find((a) => a.key === key);
      if (row) {
        const { error: updateError } = await updateSiteAsset(row.id, { path, url: publicUrl, alt_text: altText ?? row.alt_text });
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await insertSiteAsset({ key, path, url: publicUrl, alt_text: altText ?? null });
        if (insertError) throw insertError;
      }
      toast.success(key === "logo" ? "Logo 已更新" : "封面已更新");
      setSiteLogoFile(null);
      setSiteCoverFile(null);
      fetchSiteAssets();
    } catch (err: unknown) {
      toast.error("儲存失敗");
      console.error(err);
    } finally {
      setIsSavingSiteAsset(null);
    }
  };

  const openContentEdit = (row: SiteContentRow) => {
    setEditingContentId(row.id);
    setEditingContentJson(typeof row.content === 'string' ? row.content : JSON.stringify(row.content, null, 2));
  };

  const saveSiteContent = async () => {
    if (!editingContentId) return;
    setIsSavingContent(true);
    try {
      let content: unknown;
      try {
        content = JSON.parse(editingContentJson);
      } catch {
        toast.error("content 必須為合法 JSON");
        return;
      }
      const { error } = await apiUpdateSiteContent(editingContentId, content);
      if (error) throw error;
      toast.success("已儲存");
      setEditingContentId(null);
      fetchSiteContent();
    } catch (err) {
      toast.error("儲存失敗");
    } finally {
      setIsSavingContent(false);
    }
  };

  const openStoreDialog = (store?: StoreSetting) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({
        store_id: store.store_id,
        name: store.name,
        address: store.address || '',
        opening_time: store.opening_time,
        closing_time: store.closing_time,
        time_slot_duration: store.time_slot_duration,
        available_days: store.available_days,
      });
    } else {
      setEditingStore(null);
      setStoreForm({
        store_id: '',
        name: '',
        address: '',
        opening_time: '09:00',
        closing_time: '22:00',
        time_slot_duration: 60,
        available_days: ['1','2','3','4','5','6','0'],
      });
    }
    setIsStoreDialogOpen(true);
  };

  const saveStore = async () => {
    if (!storeForm.store_id || !storeForm.name) {
      toast.error("請填寫分店 ID 和名稱");
      return;
    }
    try {
      const payload = {
        store_id: storeForm.store_id,
        name: storeForm.name,
        address: storeForm.address || null,
        opening_time: storeForm.opening_time,
        closing_time: storeForm.closing_time,
        time_slot_duration: storeForm.time_slot_duration,
        available_days: storeForm.available_days,
        ...(editingStore ? { updated_at: new Date().toISOString() } : {}),
      };
      if (editingStore) {
        const { error } = await updateStore(editingStore.id, payload);
        if (error) throw error;
        toast.success("分店已更新");
      } else {
        const { error } = await createStore(payload);
        if (error) throw error;
        toast.success("分店已新增");
      }
      setIsStoreDialogOpen(false);
      fetchStores();
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === "23505") toast.error("此分店 ID 已存在");
      else toast.error("儲存失敗");
    }
  };

  const toggleStoreActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await apiToggleStoreActive(id, isActive);
      if (error) throw error;
      toast.success(isActive ? "分店已停用" : "分店已啟用");
      fetchStores();
    } catch (err) {
      toast.error("更新失敗");
    }
  };

  const deleteStore = async (id: string) => {
    if (!confirm("確定要刪除此分店嗎？")) return;
    try {
      const { error } = await apiDeleteStore(id);
      if (error) throw error;
      toast.success("分店已刪除");
      fetchStores();
    } catch (err) {
      toast.error("刪除失敗");
    }
  };

  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const { data, error } = await apiFetchAnnouncements();
      if (error) throw error;
      setAnnouncements(data ?? []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      toast.error("載入公告失敗");
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const openAnnouncementDialog = async (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementForm({
        title: announcement.title,
        content: announcement.content,
        image_url: announcement.image_url || '',
        is_active: announcement.is_active,
        priority: announcement.priority,
        start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
        end_date: announcement.end_date ? announcement.end_date.split('T')[0] : '',
      });
      setAnnouncementImagePreview(announcement.image_url || '');
      setSelectedAnnouncementImageFile(null);
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: '',
        content: '',
        image_url: '',
        is_active: true,
        priority: 0,
        start_date: '',
        end_date: '',
      });
      setAnnouncementImagePreview('');
      setSelectedAnnouncementImageFile(null);
    }
    
    const bucketExists = await checkAnnouncementBucketExists();
    if (!bucketExists) console.warn("Storage bucket 'announcement-images' 不存在");
    setIsAnnouncementDialogOpen(true);
  };

  const handleAnnouncementImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("圖片大小不能超過 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("請選擇圖片檔案");
        return;
      }
      setSelectedAnnouncementImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnnouncementImagePreview(reader.result as string);
        setAnnouncementForm({ ...announcementForm, image_url: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAnnouncement = async () => {
    if (!announcementForm.title) {
      toast.error("請填寫標題");
      return;
    }

    try {
      let finalImageUrl = announcementForm.image_url;

      if (selectedAnnouncementImageFile) {
        const fileExt = selectedAnnouncementImageFile.name.split('.').pop();
        const fileName = `announcement-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log("開始上傳圖片:", {
          fileName,
          filePath,
          fileSize: selectedAnnouncementImageFile.size,
          fileType: selectedAnnouncementImageFile.type
        });

        // 檢測 bucket 是否存在
        const bucketExists = await checkStorageBucket();
        
        if (!bucketExists) {
          console.log("Bucket 不存在，嘗試自動創建...");
          
          // 嘗試通過 Edge Function 自動創建 bucket
          try {
            const { data: createResult, error: createError } = await supabase.functions.invoke('create-storage-bucket', {
              body: { bucketName: 'announcement-images' }
            });

            if (createError || createResult?.error) {
              console.error("自動創建 bucket 失敗:", createError || createResult?.error);
              toast.error(
                "Storage bucket 不存在且自動創建失敗。請在 Supabase Dashboard → Storage 創建 'announcement-images' bucket（公開），或執行 CREATE_ANNOUNCEMENT_STORAGE_BUCKET.sql",
                { duration: 10000 }
              );
              return;
            }

            console.log("Bucket 自動創建成功:", createResult);
            toast.success("已自動創建 Storage bucket，正在上傳圖片...");
            // 等待一下讓 bucket 創建完成
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (err) {
            console.error("創建 bucket 時發生錯誤:", err);
            toast.error(
              "無法自動創建 bucket。請在 Supabase Dashboard → Storage 創建 'announcement-images' bucket（公開），或執行 CREATE_ANNOUNCEMENT_STORAGE_BUCKET.sql",
              { duration: 10000 }
            );
            return;
          }
        }

        const { publicUrl: uploadedUrl, error: uploadError } = await uploadAnnouncementImage(
          selectedAnnouncementImageFile,
          filePath
        );

        if (uploadError) {
          console.error("上傳錯誤詳情:", {
            error: uploadError,
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            errorCode: uploadError.error,
            name: uploadError.name
          });
          
          // 詳細的錯誤處理
          let errorMessage = `圖片上傳失敗：${uploadError.message || uploadError.error || '未知錯誤'}`;
          let errorHint = '';
          
          if ((uploadError as { __isAuthError?: boolean; name?: string })?.__isAuthError === true || (uploadError as { name?: string })?.name === "AuthSessionMissingError") {
            errorMessage = "未登入或 session 已過期";
            errorHint = "請執行 DEV_RLS_allow_anon_writes.sql 以允許未登入上傳（開發用），或登入後再試";
          } else if (uploadError.message?.includes('not found') || uploadError.message?.includes('does not exist') || uploadError.statusCode === 404) {
            errorMessage = "Storage bucket 'announcement-images' 不存在";
            errorHint = "請在 Supabase Dashboard → Storage → New bucket 創建，或執行 CREATE_ANNOUNCEMENT_STORAGE_BUCKET.sql";
          } else if (uploadError.message?.includes('new row violates row-level security policy') || uploadError.statusCode === 42501) {
            errorMessage = "權限不足：RLS 策略阻止上傳";
            errorHint = "請執行 DEV_RLS_allow_anon_writes.sql（開發用）或登入後再試。執行 CHECK_STORAGE_SETUP.sql 可檢查 RLS。";
          } else if (uploadError.message?.includes('JWT') || uploadError.message?.includes('token')) {
            errorMessage = "認證失敗：請重新登入";
            errorHint = "您的登入狀態可能已過期，請重新登入後再試";
          } else if (uploadError.statusCode === 413 || uploadError.message?.includes('too large')) {
            errorMessage = "文件太大：超過 5MB 限制";
            errorHint = "請選擇較小的圖片文件";
          }
          
          toast.error(
            errorHint ? `${errorMessage}\n${errorHint}` : errorMessage,
            { duration: 10000 }
          );
          
          // 在控制台輸出完整錯誤信息以便調試
          console.error("完整上傳錯誤信息:", JSON.stringify(uploadError, null, 2));
          
          return;
        }

        if (!uploadedUrl) {
          toast.error("圖片上傳失敗：未返回 URL");
          return;
        }
        finalImageUrl = uploadedUrl;
        if (editingAnnouncement?.image_url?.includes("announcement-images")) {
          const oldPath = editingAnnouncement.image_url.split("/announcement-images/").pop();
          if (oldPath) await removeAnnouncementImage(oldPath);
        }
      }

      const dataToSave = {
        title: announcementForm.title,
        content: announcementForm.content ?? "",
        image_url: finalImageUrl || null,
        is_active: announcementForm.is_active,
        priority: announcementForm.priority,
        start_date: announcementForm.start_date ? `${announcementForm.start_date}T00:00:00Z` : null,
        end_date: announcementForm.end_date ? `${announcementForm.end_date}T23:59:59Z` : null,
      };

      if (editingAnnouncement) {
        const { error } = await updateAnnouncement(editingAnnouncement.id, dataToSave);
        if (error) {
          toast.error(`更新失敗：${(error as Error).message || "未知錯誤"}`);
          return;
        }
        toast.success("公告已更新");
      } else {
        const { error } = await createAnnouncement(dataToSave);
        if (error) {
          const e = error as Error & { code?: string };
          if (e?.code === "42501") toast.error("權限不足，請確認您有管理員權限");
          else if (e?.code === "42P01") toast.error("公告表不存在，請先執行 migration");
          else toast.error(`新增失敗：${e?.message || "未知錯誤"}`);
          return;
        }
        toast.success("公告已新增");
      }
      setSelectedAnnouncementImageFile(null);
      setAnnouncementImagePreview("");
      setIsAnnouncementDialogOpen(false);
      fetchAnnouncements();
    } catch (err: unknown) {
      console.error("Error saving announcement:", err);
      toast.error(`儲存失敗：${(err as Error)?.message || "未知錯誤"}`);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("確定要刪除此公告嗎？")) return;
    try {
      const { error } = await apiDeleteAnnouncement(id);
      if (error) throw error;
      toast.success("公告已刪除");
      fetchAnnouncements();
    } catch (err) {
      toast.error("刪除失敗");
    }
  };

  const toggleAnnouncementActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await apiToggleAnnouncementActive(id, isActive);
      if (error) throw error;
      toast.success(isActive ? "公告已停用" : "公告已啟用");
      fetchAnnouncements();
    } catch (err) {
      toast.error("更新失敗");
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
        <div className="container mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-full gradient-gold flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-lg sm:text-xl font-medium leading-tight text-foreground">
              📋 Trinhnai 後台管理
            </h1>
          </div>
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0">
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link to="/crm">
                <MessageCircle className="w-4 h-4" />
                LINE CRM
                <ExternalLink className="w-3 h-3" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="shrink-0" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">後台尚未連接 Supabase</p>
            <p className="mt-1">
              {SUPABASE_CONFIG_MESSAGE} 目前只顯示空資料，新增、更新、刪除和圖片上傳都需要先補齊後端環境變數。
            </p>
          </div>
        )}
        <Tabs defaultValue="bookings" className="w-full">
          <div className="-mx-4 overflow-x-auto px-4 pb-2">
            <TabsList className="grid h-auto w-max min-w-[880px] grid-cols-6 mb-4 lg:w-full lg:max-w-5xl">
              <TabsTrigger value="bookings" className="flex items-center gap-2 px-3 py-2">
                <CalendarDays className="w-4 h-4" />
                預約記錄 ({filteredBookings.length})
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2 px-3 py-2">
                <Users className="w-4 h-4" />
                名單管理 ({leads.length})
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex items-center gap-2 px-3 py-2">
                <Bell className="w-4 h-4" />
                公告管理
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2 px-3 py-2">
                <Image className="w-4 h-4" />
                服務項目
              </TabsTrigger>
              <TabsTrigger value="stores" className="flex items-center gap-2 px-3 py-2">
                <Store className="w-4 h-4" />
                分店設定
              </TabsTrigger>
              <TabsTrigger value="site" className="flex items-center gap-2 px-3 py-2">
                <Globe className="w-4 h-4" />
                網站設定
              </TabsTrigger>
            </TabsList>
          </div>

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

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      公告管理
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      管理網站首頁公告訊息
                    </p>
                  </div>
                  <Button onClick={() => openAnnouncementDialog()} aria-label="新增公告">
                    <Plus className="w-4 h-4 mr-2" />
                    新增公告
                  </Button>
                </div>
              </div>

              {isLoadingAnnouncements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">載入公告中...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>狀態</TableHead>
                        <TableHead>標題</TableHead>
                        <TableHead>內容</TableHead>
                        <TableHead>優先級</TableHead>
                        <TableHead>開始日期</TableHead>
                        <TableHead>結束日期</TableHead>
                        <TableHead>建立時間</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            尚未建立任何公告
                          </TableCell>
                        </TableRow>
                      ) : (
                        announcements.map((announcement) => (
                          <TableRow key={announcement.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAnnouncementActive(announcement.id, announcement.is_active)}
                                className={announcement.is_active ? "text-green-600" : "text-gray-400"}
                                aria-label={announcement.is_active ? "停用公告" : "啟用公告"}
                              >
                                {announcement.is_active ? (
                                  <Power className="w-4 h-4" />
                                ) : (
                                  <PowerOff className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">{announcement.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                              {announcement.content}
                            </TableCell>
                            <TableCell className="font-mono">{announcement.priority}</TableCell>
                            <TableCell className="text-sm">
                              {announcement.start_date ? format(parseISO(announcement.start_date), 'yyyy/MM/dd') : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {announcement.end_date ? format(parseISO(announcement.end_date), 'yyyy/MM/dd') : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(parseISO(announcement.created_at), 'yyyy/MM/dd HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAnnouncementDialog(announcement)}
                                  aria-label="編輯公告"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteAnnouncement(announcement.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  aria-label="刪除公告"
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

          {/* Services Tab */}
          <TabsContent value="services">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary" />
                      服務項目管理
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      管理網站和 LINE 顯示的服務項目，拖拽可調整順序
                    </p>
                  </div>
                  <Button onClick={() => openServiceDialog()} aria-label="新增服務">
                    <Plus className="w-4 h-4 mr-2" />
                    新增服務
                  </Button>
                </div>
              </div>

              {isLoadingServices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">載入服務中...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>狀態</TableHead>
                          <TableHead>圖片</TableHead>
                          <TableHead>服務 ID</TableHead>
                          <TableHead>服務名稱</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead>價格範圍</TableHead>
                          <TableHead>排序</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                              尚未建立任何服務
                            </TableCell>
                          </TableRow>
                        ) : (
                          <SortableContext items={services.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {services.map((service) => (
                              <SortableServiceRow key={service.id} service={service} />
                            ))}
                          </SortableContext>
                        )}
                      </TableBody>
                    </Table>
                  </DndContext>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary" />
                      分店設定
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      管理網站和 LINE 顯示的分店資訊
                    </p>
                  </div>
                  <Button onClick={() => openStoreDialog()} aria-label="新增分店">
                    <Plus className="w-4 h-4 mr-2" />
                    新增分店
                  </Button>
                </div>
              </div>

              {isLoadingStores ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">載入分店中...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>狀態</TableHead>
                        <TableHead>分店 ID</TableHead>
                        <TableHead>分店名稱</TableHead>
                        <TableHead>地址</TableHead>
                        <TableHead>營業時間</TableHead>
                        <TableHead>時段間隔</TableHead>
                        <TableHead>營業日</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            尚未建立任何分店
                          </TableCell>
                        </TableRow>
                      ) : (
                        stores.map((store) => (
                          <TableRow key={store.id}>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStoreActive(store.id, store.is_active)}
                                className={store.is_active ? "text-green-600" : "text-gray-400"}
                                aria-label={store.is_active ? "停用分店" : "啟用分店"}
                              >
                                {store.is_active ? (
                                  <Power className="w-4 h-4" />
                                ) : (
                                  <PowerOff className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{store.store_id}</TableCell>
                            <TableCell className="font-medium">{store.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {store.address || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {store.opening_time} - {store.closing_time}
                            </TableCell>
                            <TableCell className="text-sm">{store.time_slot_duration} 分鐘</TableCell>
                            <TableCell className="text-sm">
                              {['日', '一', '二', '三', '四', '五', '六']
                                .filter((_, i) => store.available_days.includes(i.toString()))
                                .join('、') || '無'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openStoreDialog(store)}
                                  aria-label="編輯分店"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteStore(store.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  aria-label="刪除分店"
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

          {/* 網站設定：Logo、封面、全站區塊 */}
          <TabsContent value="site">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
            >
              <div className="p-6 border-b border-border/50">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  網站設定
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  編輯 Logo、首頁封面與全站區塊文案
                </p>
              </div>
              <div className="p-6 space-y-8">
                {isLoadingSite ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Logo */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Logo</h3>
                      <div className="flex flex-wrap items-end gap-4">
                        {(siteAssets.find((a) => a.key === 'logo')?.url) && (
                          <img
                            src={siteAssets.find((a) => a.key === 'logo')!.url!}
                            alt="Logo"
                            className="h-16 object-contain border rounded"
                          />
                        )}
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSiteLogoFile(e.target.files?.[0] ?? null)}
                            className="max-w-xs"
                          />
                          <Button
                            size="sm"
                            disabled={!siteLogoFile}
                            onClick={() => siteLogoFile && saveSiteAsset('logo', siteLogoFile)}
                          >
                            {isSavingSiteAsset === 'logo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isSavingSiteAsset === 'logo' ? '上傳中...' : '上傳 Logo'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 封面 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">首頁封面（Hero 圖）</h3>
                      <div className="flex flex-wrap items-end gap-4">
                        {(siteAssets.find((a) => a.key === 'hero_cover')?.url) && (
                          <img
                            src={siteAssets.find((a) => a.key === 'hero_cover')!.url!}
                            alt="封面"
                            className="max-h-32 w-auto object-cover rounded border"
                          />
                        )}
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSiteCoverFile(e.target.files?.[0] ?? null)}
                            className="max-w-xs"
                          />
                          <Button
                            size="sm"
                            disabled={!siteCoverFile}
                            onClick={() => siteCoverFile && saveSiteAsset('hero_cover', siteCoverFile)}
                          >
                            {isSavingSiteAsset === 'hero_cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isSavingSiteAsset === 'hero_cover' ? '上傳中...' : '上傳封面'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 全站區塊內容 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">全站區塊文案</h3>
                      <p className="text-xs text-muted-foreground">此欄顯示區塊文字摘要；點擊「編輯」可修改該區塊內容（如 hero 標題、導覽項目、Footer 等）</p>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>頁面</TableHead>
                              <TableHead>區塊</TableHead>
                              <TableHead className="max-w-[200px]">內容預覽</TableHead>
                              <TableHead>操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {siteContent.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="font-mono text-sm">{row.page_key}</TableCell>
                                <TableCell className="font-mono text-sm">{row.block_key}</TableCell>
                                <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={contentToPreviewText(row.content)}>
                                  {contentToPreviewText(row.content)}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => openContentEdit(row)}>
                                    <Edit2 className="w-4 h-4" />
                                    編輯
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 全站區塊編輯 Dialog */}
      <Dialog open={!!editingContentId} onOpenChange={(open) => !open && setEditingContentId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>編輯區塊內容（JSON）</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editingContentJson}
              onChange={(e) => setEditingContentJson(e.target.value)}
              rows={14}
              className="font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingContentId(null)}>取消</Button>
            <Button onClick={saveSiteContent} disabled={isSavingContent}>
              {isSavingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              {editingService ? '編輯服務項目' : '新增服務項目'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              <label className="text-sm font-medium">選擇服務 *</label>
              <Select value={selectedServiceId} onValueChange={handleServiceSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇現有服務或新增服務" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">➕ 新增服務</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service.service_id} value={service.service_id}>
                      {service.name} ({service.service_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                選擇現有服務進行編輯，或選擇「新增服務」來建立新服務
              </p>
            </div>

            {selectedServiceId === 'new' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">服務 ID *</label>
                  <Input
                    placeholder="例如：nail, lash, 美甲"
                    value={serviceForm.service_id}
                    onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    用於系統識別，可使用中文或英文
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">服務名稱 *</label>
                  <Input
                    placeholder="例如：💅 美甲服務"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">服務 ID</label>
                  <Input
                    value={serviceForm.service_id}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">服務名稱 *</label>
                  <Input
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">服務描述 *</label>
              <Input
                placeholder="例如：凝膠指甲 | 光療指甲 | 指甲彩繪"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">價格範圍 *</label>
                <Input
                  placeholder="例如：NT$ 150 - 990"
                  value={serviceForm.price_range}
                  onChange={(e) => setServiceForm({ ...serviceForm, price_range: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">排序</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={serviceForm.sort_order}
                  onChange={(e) => setServiceForm({ ...serviceForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">服務圖片 *</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('service-image-upload')?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {selectedImageFile ? selectedImageFile.name : '上傳圖片'}
                </Button>
                <input
                  id="service-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                支援 JPG、PNG、WebP 格式，檔案大小限制 5MB
              </p>
              {imagePreview && (
                <div className="mt-2 flex justify-center bg-muted/30 p-4 rounded">
                  <div className="relative" style={{ width: '280px' }}>
                    <img 
                      src={imagePreview} 
                      alt="預覽"
                      className="w-full object-cover rounded shadow-md"
                      style={{
                        aspectRatio: serviceForm.aspect_ratio.replace(':', '/'),
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                      {serviceForm.aspect_ratio}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flex 圖片尺寸</label>
              <Select 
                value={serviceForm.aspect_ratio} 
                onValueChange={(value) => setServiceForm({ ...serviceForm, aspect_ratio: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20:13">20:13 (寬版 - 推薦)</SelectItem>
                  <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                  <SelectItem value="1.51:1">1.51:1 (寬)</SelectItem>
                  <SelectItem value="16:9">16:9 (超寬)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                選擇 LINE Flex Message 的圖片比例
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsServiceDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button onClick={saveService}>
              <Save className="w-4 h-4 mr-2" />
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Store Dialog */}
      <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              {editingStore ? '編輯分店設定' : '新增分店'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">分店 ID *</label>
                <Input
                  placeholder="例如：yuanhua"
                  value={storeForm.store_id}
                  onChange={(e) => setStoreForm({ ...storeForm, store_id: e.target.value })}
                  disabled={!!editingStore}
                />
                <p className="text-xs text-muted-foreground">
                  英文小寫，用於系統識別
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">分店名稱 *</label>
                <Input
                  placeholder="例如：中壢元化店"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">地址</label>
              <Input
                placeholder="例如：中壢區元化路XX號"
                value={storeForm.address}
                onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">開始營業</label>
                <Input
                  type="time"
                  value={storeForm.opening_time}
                  onChange={(e) => setStoreForm({ ...storeForm, opening_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">結束營業</label>
                <Input
                  type="time"
                  value={storeForm.closing_time}
                  onChange={(e) => setStoreForm({ ...storeForm, closing_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">時段間隔（分鐘）</label>
                <Input
                  type="number"
                  value={storeForm.time_slot_duration}
                  onChange={(e) => setStoreForm({ ...storeForm, time_slot_duration: parseInt(e.target.value) || 60 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">營業日</label>
              <div className="flex gap-2">
                {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                  <Button
                    key={index}
                    variant={storeForm.available_days.includes(index.toString()) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const dayStr = index.toString();
                      if (storeForm.available_days.includes(dayStr)) {
                        setStoreForm({
                          ...storeForm,
                          available_days: storeForm.available_days.filter(d => d !== dayStr)
                        });
                      } else {
                        setStoreForm({
                          ...storeForm,
                          available_days: [...storeForm.available_days, dayStr]
                        });
                      }
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                點擊選擇營業日
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsStoreDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button onClick={saveStore}>
              <Save className="w-4 h-4 mr-2" />
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingAnnouncement ? '編輯公告' : '新增公告'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4 pb-4 overflow-y-auto overflow-x-hidden min-h-0 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">標題 *</label>
              <Input
                placeholder="公告標題"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                className="w-full min-h-[2.5rem]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">內容（選填）</label>
              <Textarea
                placeholder="公告內容（支援換行，選填）"
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">圖片（選填）</label>
              <div className="flex flex-col gap-3">
                {announcementImagePreview && (
                  <div className="relative w-full max-w-md mx-auto">
                    <img
                      src={announcementImagePreview}
                      alt="預覽"
                      className="w-full h-auto rounded-lg border border-border object-cover max-h-64"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setAnnouncementImagePreview('');
                        setSelectedAnnouncementImageFile(null);
                        setAnnouncementForm({ ...announcementForm, image_url: '' });
                      }}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAnnouncementImageSelect}
                    className="hidden"
                    id="announcement-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('announcement-image-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    上傳圖片
                  </Button>
                  <p className="text-xs text-muted-foreground">建議尺寸：16:9，最大 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">優先級</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  數字越大優先級越高
                </p>
              </div>

              <div className="space-y-2 flex items-center pt-6">
                <Checkbox
                  id="announcement-active"
                  checked={announcementForm.is_active}
                  onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, is_active: Boolean(checked) })}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="announcement-active"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-2"
                >
                  啟用公告
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">開始日期（選填）</label>
                <Input
                  type="date"
                  value={announcementForm.start_date}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">結束日期（選填）</label>
                <Input
                  type="date"
                  value={announcementForm.end_date}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAnnouncementDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button onClick={saveAnnouncement}>
              <Save className="w-4 h-4 mr-2" />
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
