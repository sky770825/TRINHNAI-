import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnouncementModal = ({ isOpen, onClose }: AnnouncementModalProps) => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchActiveAnnouncement();
    }
  }, [isOpen]);

  const fetchActiveAnnouncement = async () => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error fetching announcement:", error);
        setAnnouncement(null);
        return;
      }

      if (data) {
        // Check if announcement is within date range
        const nowDate = new Date();
        const startDate = data.start_date ? parseISO(data.start_date) : null;
        const endDate = data.end_date ? parseISO(data.end_date) : null;

        if (startDate && isBefore(nowDate, startDate)) {
          setAnnouncement(null);
          return;
        }

        if (endDate && isAfter(nowDate, endDate)) {
          setAnnouncement(null);
          return;
        }

        setAnnouncement(data);
      } else {
        setAnnouncement(null);
      }
    } catch (err) {
      console.error("Error fetching announcement:", err);
      setAnnouncement(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || isLoading || !announcement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{announcement.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {announcement.content}
          </div>
          
          {(announcement.start_date || announcement.end_date) && (
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              {announcement.start_date && (
                <div>開始日期：{format(parseISO(announcement.start_date), 'yyyy年MM月dd日', { locale: zhTW })}</div>
              )}
              {announcement.end_date && (
                <div>結束日期：{format(parseISO(announcement.end_date), 'yyyy年MM月dd日', { locale: zhTW })}</div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="default">
            我知道了
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
