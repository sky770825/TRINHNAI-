import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Bell, Sparkles } from "lucide-react";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
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
        .maybeSingle();

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
    <AnimatePresence>
      {isOpen && announcement && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
            {/* Image Section */}
            {announcement.image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-64 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5"
              >
                <img
                  src={announcement.image_url}
                  alt={announcement.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              </motion.div>
            )}

            <div className="p-6 space-y-4">
              <DialogHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl font-bold leading-tight">
                    {announcement.title}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="whitespace-pre-line text-foreground leading-relaxed text-base">
                  {announcement.content}
                </div>
                
                {(announcement.start_date || announcement.end_date) && (
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50 text-sm">
                    {announcement.start_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">開始日期：</span>
                        <span>{format(parseISO(announcement.start_date), 'yyyy年MM月dd日', { locale: zhTW })}</span>
                      </div>
                    )}
                    {announcement.end_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">結束日期：</span>
                        <span>{format(parseISO(announcement.end_date), 'yyyy年MM月dd日', { locale: zhTW })}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-end pt-2"
              >
                <Button 
                  onClick={onClose} 
                  size="lg"
                  className="min-w-[120px]"
                >
                  我知道了
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
