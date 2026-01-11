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
  Download, ClipboardList, ExternalLink, Settings, Plus, Trash2,
  Key, Power, PowerOff, ArrowUp, ArrowDown, Store, Image, Upload,
  Ban, CalendarX
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

interface ServiceSetting {
  id: string;
  service_id: string;
  name: string;
  description: string;
  price_range: string;
  image_url: string;
  aspect_ratio: string;
  is_active: boolean;
  sort_order: number;
}

interface StoreSetting {
  id: string;
  store_id: string;
  name: string;
  address: string | null;
  opening_time: string;
  closing_time: string;
  time_slot_duration: number;
  available_days: string[];
  is_active: boolean;
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
  
  // Services state
  const [services, setServices] = useState<ServiceSetting[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceSetting | null>(null);
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
  
  // Bookings state
  const [bookings, setBookings] = useState<LineBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<string>("all");

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
    fetchBotSettings();
    fetchKeywords();
    fetchServices();
    fetchStores();
    fetchBookings();
  }, []);

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
    if (!keywordForm.keyword.trim() || !keywordForm.response_content.trim()) {
      toast.error("請填寫關鍵字和回覆內容");
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
    } catch (err: any) {
      console.error("Error saving keyword:", err);
      if (err.code === '23505') {
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

  // Services functions
  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('service_settings')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const openServiceDialog = (service?: ServiceSetting) => {
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
    } else {
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
    }
    setSelectedImageFile(null);
    setIsServiceDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("圖片大小不能超過 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("請選擇圖片檔案");
        return;
      }
      setSelectedImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setServiceForm({ ...serviceForm, image_url: '' }); // Clear URL when file selected
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

      // If user selected a new image file, upload it
      if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split('.').pop();
        const fileName = `${serviceForm.service_id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload new image
        const { error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(filePath, selectedImageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("圖片上傳失敗");
          return;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(filePath);

        finalImageUrl = publicUrl;

        // Delete old image if updating
        if (editingService && editingService.image_url.includes('service-images')) {
          const oldPath = editingService.image_url.split('/service-images/').pop();
          if (oldPath) {
            await supabase.storage
              .from('service-images')
              .remove([oldPath]);
          }
        }
      }

      if (editingService) {
        const { error } = await supabase
          .from('service_settings')
          .update({
            service_id: serviceForm.service_id,
            name: serviceForm.name,
            description: serviceForm.description,
            price_range: serviceForm.price_range,
            image_url: finalImageUrl,
            aspect_ratio: serviceForm.aspect_ratio,
            sort_order: serviceForm.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingService.id);
        
        if (error) throw error;
        toast.success("服務已更新");
      } else {
        const { error } = await supabase
          .from('service_settings')
          .insert({
            service_id: serviceForm.service_id,
            name: serviceForm.name,
            description: serviceForm.description,
            price_range: serviceForm.price_range,
            image_url: finalImageUrl,
            aspect_ratio: serviceForm.aspect_ratio,
            sort_order: serviceForm.sort_order,
          });
        
        if (error) throw error;
        toast.success("服務已新增");
      }
      
      setIsServiceDialogOpen(false);
      setSelectedImageFile(null);
      setImagePreview('');
      fetchServices();
    } catch (err: any) {
      console.error("Error saving service:", err);
      if (err.code === '23505') {
        toast.error("此服務 ID 已存在");
      } else {
        toast.error("儲存失敗");
      }
    }
  };

  const toggleServiceActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('service_settings')
        .update({ is_active: !isActive })
        .eq('id', id);
      
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
      // Find service to get image URL
      const service = services.find(s => s.id === id);
      
      // Delete from database
      const { error } = await supabase
        .from('service_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      // Delete image from storage if it's in our bucket
      if (service && service.image_url.includes('service-images')) {
        const imagePath = service.image_url.split('/service-images/').pop();
        if (imagePath) {
          await supabase.storage
            .from('service-images')
            .remove([imagePath]);
        }
      }
      
      toast.success("服務已刪除");
      fetchServices();
    } catch (err) {
      toast.error("刪除失敗");
    }
  };

  // Stores functions
  const fetchStores = async () => {
    setIsLoadingStores(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*');
      
      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error("Error fetching stores:", err);
    } finally {
      setIsLoadingStores(false);
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
      if (editingStore) {
        const { error } = await supabase
          .from('store_settings')
          .update({
            store_id: storeForm.store_id,
            name: storeForm.name,
            address: storeForm.address || null,
            opening_time: storeForm.opening_time,
            closing_time: storeForm.closing_time,
            time_slot_duration: storeForm.time_slot_duration,
            available_days: storeForm.available_days,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStore.id);
        
        if (error) throw error;
        toast.success("分店已更新");
      } else {
        const { error } = await supabase
          .from('store_settings')
          .insert({
            store_id: storeForm.store_id,
            name: storeForm.name,
            address: storeForm.address || null,
            opening_time: storeForm.opening_time,
            closing_time: storeForm.closing_time,
            time_slot_duration: storeForm.time_slot_duration,
            available_days: storeForm.available_days,
          });
        
        if (error) throw error;
        toast.success("分店已新增");
      }
      
      setIsStoreDialogOpen(false);
      fetchStores();
    } catch (err: any) {
      console.error("Error saving store:", err);
      if (err.code === '23505') {
        toast.error("此分店 ID 已存在");
      } else {
        toast.error("儲存失敗");
      }
    }
  };

  const toggleStoreActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(isActive ? "分店已停用" : "分店已啟用");
      fetchStores();
    } catch (err) {
      toast.error("更新失敗");
    }
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
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('line_bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user?.email || 'admin',
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      toast.success("預約已確認");
      fetchBookings();
    } catch (err) {
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
            <TabsTrigger value="keywords" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              關鍵字管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              機器人設定
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              服務項目
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              分店設定
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
                                {kw.response_type === 'registration' ? '報名流程' : '文字回覆'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {kw.response_type === 'registration' 
                                  ? '啟動報名流程' 
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
                      管理 LINE 預約的服務項目和圖片
                    </p>
                  </div>
                  <Button onClick={() => openServiceDialog()}>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>狀態</TableHead>
                        <TableHead>圖片</TableHead>
                        <TableHead>服務 ID</TableHead>
                        <TableHead>名稱</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>價格</TableHead>
                        <TableHead>排序</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                            尚未設定任何服務項目
                          </TableCell>
                        </TableRow>
                      ) : (
                        services.map((service) => (
                          <TableRow key={service.id}>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
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
                      分店設定管理
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      設定分店營業時間和可預約時段
                    </p>
                  </div>
                  <Button onClick={() => openStoreDialog()}>
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
                        <TableHead>名稱</TableHead>
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
                            尚未設定任何分店
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
                              {store.available_days.length === 7 ? '全週' : `${store.available_days.length} 天`}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openStoreDialog(store)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
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
                    <Select value={bookingFilter} onValueChange={setBookingFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="狀態篩選" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="pending">待確認</SelectItem>
                        <SelectItem value="confirmed">已確認</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchBookings}>
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
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
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
                              <TableCell>{booking.service}</TableCell>
                              <TableCell>{booking.store}</TableCell>
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              {editingKeyword ? '編輯關鍵字' : '新增關鍵字'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                <Select 
                  value={keywordForm.response_type} 
                  onValueChange={(value) => setKeywordForm({ ...keywordForm, response_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文字回覆</SelectItem>
                    <SelectItem value="registration">啟動報名流程</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {keywordForm.response_type === 'text' && (
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

            {keywordForm.response_type === 'registration' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
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

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              {editingService ? '編輯服務項目' : '新增服務項目'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">服務 ID *</label>
                <Input
                  placeholder="例如：nail, lash"
                  value={serviceForm.service_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
                  disabled={!!editingService}
                />
                <p className="text-xs text-muted-foreground">
                  英文小寫，用於系統識別
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              {editingStore ? '編輯分店設定' : '新增分店'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
    </div>
  );
};

export default CRM;
