import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/sections/Footer";
import { BookingModal } from "@/components/BookingModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { lookupPublicBookings, type PublicBookingLookup } from "@/api/publicBooking";
import heroNails from "@/assets/hero-nails.jpg";

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: {
    label: "待門市確認",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  confirmed: {
    label: "已確認",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "已取消",
    className: "border-stone-200 bg-stone-100 text-stone-600",
  },
};

const sourceLabels: Record<PublicBookingLookup["source"], string> = {
  website: "官網預約",
  line: "LINE OA",
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}/${month}/${day}`;
}

function getBookingTimeValue(booking: PublicBookingLookup) {
  return `${booking.bookingDate}T${booking.bookingTime || "00:00"}`;
}

function maskPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (digits.length < 4) return "已留存";
  return `末四碼 ${digits.slice(-4)}`;
}

const Member = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<PublicBookingLookup[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const upcomingBookings = useMemo(() => {
    if (!bookings) return [];
    const nowKey = new Date().toISOString().slice(0, 16);
    return bookings.filter((booking) => getBookingTimeValue(booking) >= nowKey && booking.status !== "cancelled");
  }, [bookings]);

  const confirmedCount = useMemo(
    () => bookings?.filter((booking) => booking.status === "confirmed").length ?? 0,
    [bookings],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 8) {
      setError("請輸入預約時留下的手機或電話，至少 8 碼。");
      setBookings(null);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const result = await lookupPublicBookings(phone);
      setBookings(result);
    } catch (lookupError) {
      setBookings(null);
      setError(lookupError instanceof Error ? lookupError.message : "目前無法查詢預約，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f3ee]">
      <Header onBookingClick={() => setIsBookingOpen(true)} />

      <main className="pt-24">
        <section className="relative overflow-hidden border-b border-primary/10 bg-[linear-gradient(135deg,#fffaf6_0%,#f4e8de_48%,#f7f0ea_100%)]">
          <div className="container mx-auto grid gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/65 px-4 py-2 text-sm font-medium text-primary shadow-soft backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                官網與 LINE OA 預約同步查詢
              </div>
              <h1 className="font-display text-4xl font-medium leading-tight text-foreground sm:text-5xl">
                會員專區
                <span className="block text-2xl text-primary sm:text-3xl">查詢妳的預約紀錄</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
                輸入預約時留下的手機或電話，即可查看最近的預約狀態、門市、服務與時間。查詢只顯示必要資訊，完整異動仍由門市協助確認。
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/70 bg-white/62 p-4 shadow-soft">
                  <CalendarDays className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">預約時間</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">查看日期、時段與狀態</p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white/62 p-4 shadow-soft">
                  <Store className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">預約門市</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">元化店、忠福店同步</p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white/62 p-4 shadow-soft">
                  <MessageCircle className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">預約來源</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">官網與 LINE OA 合併</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="flex flex-col overflow-hidden rounded-lg border border-white/70 bg-white/76 shadow-elevated backdrop-blur"
            >
              <div className="order-2 aspect-[16/9] overflow-hidden lg:order-1">
                <img src={heroNails} alt="Trinhnai nail styling" className="h-full w-full object-cover" />
              </div>
              <form onSubmit={handleSubmit} className="order-1 space-y-5 p-5 sm:p-6 lg:order-2">
                <div>
                  <Label htmlFor="member-phone" className="text-sm text-foreground">
                    預約電話
                  </Label>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="member-phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="例：0909-318-666"
                        className="h-12 rounded-lg border-primary/20 bg-white pl-10"
                        autoComplete="tel"
                      />
                    </div>
                    <Button type="submit" className="h-12 rounded-lg px-5" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      查詢
                    </Button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    為了保護隱私，頁面不會顯示 Email、完整備註或後台內部資料。
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>查詢失敗</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-12 lg:py-16">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Booking Lookup</p>
              <h2 className="mt-2 font-display text-3xl font-medium text-foreground">預約查詢結果</h2>
            </div>
            <Button variant="outline" onClick={() => setIsBookingOpen(true)}>
              重新預約
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {bookings === null ? (
            <div className="rounded-lg border border-dashed border-primary/25 bg-white/58 p-8 text-center shadow-soft">
              <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">輸入電話後即可查詢</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                系統會同步比對官網預約與 LINE OA 預約，適合客人回來確認日期、時段與目前狀態。
              </p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-lg border border-primary/15 bg-white/72 p-8 text-center shadow-card">
              <Search className="mx-auto mb-4 h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">查不到這支電話的預約</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                請確認是否使用預約時留下的電話。若是從 LINE 對話預約但未留下電話，請直接私訊官方帳號協助查詢。
              </p>
              <Button className="mt-6" onClick={() => setIsBookingOpen(true)}>
                建立新預約
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-primary/10 bg-white/70 p-5 shadow-soft">
                  <p className="text-sm text-muted-foreground">查詢筆數</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{bookings.length}</p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/70 p-5 shadow-soft">
                  <p className="text-sm text-muted-foreground">尚未到店</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{upcomingBookings.length}</p>
                </div>
                <div className="rounded-lg border border-primary/10 bg-white/70 p-5 shadow-soft">
                  <p className="text-sm text-muted-foreground">已確認</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{confirmedCount}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {bookings.map((booking) => {
                  const meta = statusMeta[booking.status] ?? statusMeta.pending;
                  return (
                    <article
                      key={`${booking.source}-${booking.id}`}
                      className="rounded-lg border border-primary/12 bg-white/78 p-5 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <Badge variant="outline" className={meta.className}>
                          {meta.label}
                        </Badge>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                          {sourceLabels[booking.source]}
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-foreground">{booking.serviceLabel}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(booking.bookingDate)} · {booking.bookingTime}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                          <Store className="h-4 w-4 text-primary" />
                          <span className="truncate">{booking.storeLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                          <UserRound className="h-4 w-4 text-primary" />
                          <span className="truncate">{booking.name}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{maskPhone(booking.phone)}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                          {booking.status === "confirmed" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Clock3 className="h-4 w-4 text-primary" />
                          )}
                          <span>編號 {booking.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default Member;
