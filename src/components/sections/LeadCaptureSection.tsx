import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Loader2, CheckCircle, Heart } from "lucide-react";
import { bookingSchema, type BookingFormData } from "@/lib/validations";
import {
  PUBLIC_TIME_SLOTS,
  createPublicBooking,
  fetchAvailableBookingSlots,
  getTaipeiDateInputValue,
  sendBookingConfirmationEmail,
} from "@/api/publicBooking";

export const LeadCaptureSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState(PUBLIC_TIME_SLOTS);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

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
  const selectedStore = form.watch("store");
  const selectedService = form.watch("service");
  const selectedDate = form.watch("date");
  const minBookingDate = getTaipeiDateInputValue();

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

  useEffect(() => {
    if (!selectedStore || !selectedService || !selectedDate) {
      setAvailableTimeSlots(PUBLIC_TIME_SLOTS);
      setSlotError(null);
      return;
    }

    let isActive = true;
    setIsLoadingSlots(true);
    setSlotError(null);

    fetchAvailableBookingSlots({
      store: selectedStore,
      service: selectedService,
      date: selectedDate,
    })
      .then((slots) => {
        if (!isActive) return;
        setAvailableTimeSlots(slots);
        const currentTime = form.getValues("time");
        if (currentTime && !slots.includes(currentTime)) {
          form.setValue("time", "");
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.error("Error fetching available slots:", error);
        setAvailableTimeSlots([]);
        setSlotError("目前無法讀取可預約時段，請稍後再試或直接聯繫門市");
      })
      .finally(() => {
        if (isActive) setIsLoadingSlots(false);
      });

    return () => {
      isActive = false;
    };
  }, [form, selectedDate, selectedService, selectedStore]);

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      const bookingInput = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        lineId: data.lineId || undefined,
        store: data.store,
        service: data.service,
        date: data.date,
        time: data.time,
        notes: data.notes || undefined,
      };

      await createPublicBooking(bookingInput);

      try {
        await sendBookingConfirmationEmail(bookingInput);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      const latestSlots = await fetchAvailableBookingSlots({
        store: data.store,
        service: data.service,
        date: data.date,
      });
      setAvailableTimeSlots(latestSlots);

      setIsSuccess(true);
      toast({
        title: t("booking.success").split("!")[0] + "!",
        description: t("booking.success").split("!")[1],
      });

      // Reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
      }, 3000);
    } catch (error) {
      toast({
        title: "預約失敗",
        description: error instanceof Error ? error.message : "請稍後再試或聯繫我們",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background with marble texture */}
      <div className="absolute inset-0 bg-marble opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto"
        >
          {/* Card */}
          <div className="bg-background/95 backdrop-blur-md rounded-3xl shadow-elevated p-8 lg:p-10 border border-border/50">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-gold mb-4"
              >
                <Calendar className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <h2 className="font-display text-2xl lg:text-3xl font-medium text-foreground mb-2">
                {t("booking.title")}
              </h2>
              <p className="text-muted-foreground">
                {t("booking.subtitle")}
              </p>
            </div>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <div className="w-20 h-20 rounded-full gradient-gold flex items-center justify-center mb-6 shadow-card">
                  <CheckCircle className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-medium text-foreground mb-2">
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
                              min={minBookingDate}
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
                            disabled={!selectedStore || !selectedService || !selectedDate || isLoadingSlots || availableTimeSlots.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingSlots
                                      ? "讀取可約時段..."
                                      : availableTimeSlots.length === 0 && selectedStore && selectedService && selectedDate
                                        ? "目前已滿"
                                        : t("booking.time")
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingSlots ? (
                                <SelectItem value="loading" disabled>
                                  讀取可約時段...
                                </SelectItem>
                              ) : availableTimeSlots.length === 0 ? (
                                <SelectItem value="no-slots" disabled>
                                  目前沒有可預約時段
                                </SelectItem>
                              ) : (
                                availableTimeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {slotError && (
                            <p className="text-xs text-destructive">{slotError}</p>
                          )}
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
                    disabled={isSubmitting || isLoadingSlots}
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
    </section>
  );
};
