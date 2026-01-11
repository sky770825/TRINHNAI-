import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Calendar, Loader2, CheckCircle, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { bookingSchema, type BookingFormData } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
  "21:00", "22:00", "23:00", "24:00"
];

export const BookingModal = ({ isOpen, onClose }: BookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      lineId: "",
      store: undefined,
      date: "",
      time: "",
      service: undefined,
      notes: "",
      privacy: false,
    },
  });

  const stores = [
    { value: "yuanhua" as const, label: "中壢元化店（前站）" },
    { value: "zhongfu" as const, label: "中壢忠福店（黃昏市場對面）" },
  ];

  const services = [
    { value: "nail" as const, labelKey: "booking.service.nail" },
    { value: "lash" as const, labelKey: "booking.service.lash" },
    { value: "tattoo" as const, labelKey: "booking.service.tattoo" },
    { value: "waxing" as const, labelKey: "booking.service.waxing" },
  ];

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      // Save booking to database
      const { error: dbError } = await supabase
        .from('bookings')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          line_id: data.lineId || null,
          store: data.store,
          service: data.service,
          booking_date: data.date,
          booking_time: data.time,
          notes: data.notes || null,
          status: 'pending',
        });

      if (dbError) {
        console.error("Error saving booking:", dbError);
      }

      // Send to webhook
      try {
        await fetch('https://sky770825.zeabur.app/webhook/lovabletext', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            lineId: data.lineId || null,
            store: data.store,
            service: data.service,
            date: data.date,
            time: data.time,
            notes: data.notes || null,
          }),
        });
        console.log("Webhook sent successfully");
      } catch (webhookError) {
        console.error("Error sending to webhook:", webhookError);
      }

      // Send booking confirmation emails
      const { error } = await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          lineId: data.lineId || null,
          store: data.store,
          service: data.service,
          date: data.date,
          time: data.time,
          notes: data.notes || null,
          admin_email: "sky19880825@gmail.com",
        },
      });

      if (error) {
        console.error("Error sending booking confirmation:", error);
      } else {
        console.log("Booking confirmation emails sent successfully");
      }

      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
        onClose();
      }, 2500);
    } catch (error) {
      console.error("Error in booking submission:", error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Modal Container - for centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-lg bg-background rounded-2xl shadow-elevated overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-soft">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-medium text-foreground">
                    {t("booking.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("booking.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mb-6 shadow-card">
                    <CheckCircle className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-medium text-foreground mb-2">
                    {t("booking.success").split("!")[0]}!
                  </h3>
                  <p className="text-muted-foreground text-center flex items-center gap-2">
                    {t("booking.success").split("!")[1]} <Heart className="w-4 h-4 text-primary fill-primary" />
                  </p>
                </motion.div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.name")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("booking.name")}
                              maxLength={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Email <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="example@email.com"
                              maxLength={255}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.phone")}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="0912-345-678"
                              maxLength={20}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* LINE ID */}
                    <FormField
                      control={form.control}
                      name="lineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.line")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="LINE ID"
                              maxLength={50}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Store */}
                    <FormField
                      control={form.control}
                      name="store"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            門市 <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="選擇門市" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stores.map((store) => (
                                <SelectItem key={store.value} value={store.value}>
                                  {store.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Service */}
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("booking.service")} <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("booking.service")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.value} value={service.value}>
                                  {t(service.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("booking.date")} <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("booking.time")} <span className="text-destructive">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("booking.time")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("booking.note")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("booking.note")}
                              rows={3}
                              maxLength={500}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Privacy */}
                    <FormField
                      control={form.control}
                      name="privacy"
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                              {t("booking.privacy")} <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Submit */}
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        t("booking.submit")
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
