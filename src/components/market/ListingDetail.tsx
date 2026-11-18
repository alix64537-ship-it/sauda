import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BadgeCheck, CalendarClock, Check, CheckCircle2, Copy, Inbox, Trash2, ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle, Phone, Send, ShieldCheck, Star, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatPrice, telegramLink, whatsappLink, whatsappPhone, type Listing } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./ListingCard";
import { jobStyle } from "./job-style";
import { RelativeDate } from "./RelativeDate";

type Props = {
  listing: Listing | null;
  onOpenChange: (o: boolean) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
  /** The signed-in user posted this listing */
  isOwner?: boolean;
  onDelete?: () => Promise<void>;
  /** Vacancies: the user already applied */
  applied?: boolean;
  onApply?: () => void;
};

function maskPhone(p: string) {
  return p.replace(/\d{2} \d{2}$/, "XX XX");
}

function Gallery({ listing }: { listing: Listing }) {
  const [idx, setIdx] = useState(0);
  const imgs = listing.images;
  const style = jobStyle(listing.category);
  const Icon = style.icon;

  if (listing.mode === "jobs" && imgs.length === 0) {
    return (
      <div className={cn("flex aspect-[16/9] flex-col justify-between rounded-2xl p-6", style.tint)}>
        <span className="grid size-14 place-items-center rounded-2xl bg-card/70">
          <Icon className="size-7" />
        </span>
        <div>
          <p className="text-sm font-medium opacity-80">{listing.company}</p>
          <p className="font-display text-lg font-semibold">{listing.category}</p>
        </div>
      </div>
    );
  }
  if (imgs.length === 0) {
    return <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-muted text-sm text-muted-foreground">Нет фото</div>;
  }

  const go = (d: number) => setIdx((i) => (i + d + imgs.length) % imgs.length);
  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <img src={imgs[idx]} alt={`${listing.title} — фото ${idx + 1}`} className="size-full object-cover" />
        {imgs.length > 1 && (
          <>
            <button aria-label="Предыдущее фото" onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-card">
              <ChevronLeft className="size-5" />
            </button>
            <button aria-label="Следующее фото" onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 shadow-card">
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-overlay px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {idx + 1} / {imgs.length}
            </span>
          </>
        )}
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {imgs.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Фото ${i + 1}`}
              className={cn("h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition", i === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListingDetail({ listing, onOpenChange, favorite, onToggleFavorite, isOwner, onDelete, applied, onApply }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    setRevealed(false);
    setCopied(false);
    setConfirmDelete(false);
  }, [listing?.id]);

  if (!listing) return null;
  const isJob = listing.mode === "jobs";
  const phoneDigits = whatsappPhone(listing.phone) ?? listing.phone.replace(/\D/g, "");
  const wa = whatsappLink(listing.phone, listing);
  const tg = telegramLink(listing.telegram);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(listing.phone);
      setCopied(true);
      toast.success("Номер скопирован");
    } catch {
      toast.error("Не удалось скопировать — выделите номер вручную");
    }
  };

  return (
    <Dialog open={!!listing} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 p-4 pt-14 sm:p-6 sm:pt-14 md:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0 space-y-5">
              <Gallery key={listing.id} listing={listing} />
              <section className="space-y-2">
                <h3 className="font-display text-base font-semibold">{isJob ? "Описание вакансии" : "Описание"}</h3>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/85">{listing.description}</p>
              </section>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Tag className="size-3.5" /> Категория</dt>
                  <dd className="mt-0.5 font-medium">{listing.category}</dd>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5" /> Город</dt>
                  <dd className="mt-0.5 font-medium">{listing.city}</dd>
                </div>
                {listing.schedule && (
                  <div className="col-span-2 rounded-xl bg-muted p-3">
                    <dt className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3.5" /> График</dt>
                    <dd className="mt-0.5 font-medium">{listing.schedule}</dd>
                  </div>
                )}
              </dl>
            </div>

            <aside className="min-w-0 space-y-4 md:sticky md:top-0 md:self-start">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  <RelativeDate ts={listing.createdAt} />
                  <span>·</span>
                  <span>№ {listing.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <DialogTitle className="text-xl font-semibold leading-snug sm:text-2xl">{listing.title}</DialogTitle>
                <DialogDescription className="sr-only">Подробности объявления</DialogDescription>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-2xl font-semibold text-foreground">{formatPrice(listing)}</p>
                  <FavoriteButton active={favorite} onClick={onToggleFavorite} className="border" />
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-semibold text-accent-foreground">
                    {listing.seller.name.replace(/[«»"]/g, "").charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate font-semibold">
                      {listing.seller.name}
                      {listing.seller.rating && <BadgeCheck className="size-4 shrink-0 text-primary" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{listing.seller.type} · {listing.seller.since}</p>
                    {listing.seller.rating && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium">
                        <Star className="size-3.5 fill-warning text-warning" /> {listing.seller.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {isJob ? (
                    isOwner ? (
                      <Button asChild size="lg" variant="soft" className="h-12 w-full rounded-xl text-base">
                        <Link to="/profile" search={{ tab: "applications" }}>
                          <Inbox /> Смотреть отклики
                        </Link>
                      </Button>
                    ) : applied ? (
                      <Button size="lg" disabled className="h-12 w-full rounded-xl text-base">
                        <CheckCircle2 /> Вы уже откликнулись
                      </Button>
                    ) : (
                      <>
                        <Button size="lg" onClick={onApply} className="h-12 w-full rounded-xl text-base shadow-cta">
                          <Send /> Откликнуться на вакансию
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">Работодатель получит ваше имя, контакт и сообщение</p>
                      </>
                    )
                  ) : (
                    <>
                      {revealed ? (
                        <div className="flex h-12 items-center gap-2 rounded-xl border border-primary/30 bg-accent pl-4 pr-1.5">
                          <a href={`tel:+${phoneDigits}`} className="flex min-w-0 flex-1 items-center gap-2 truncate font-display text-lg font-semibold text-accent-foreground">
                            <Phone className="size-4 shrink-0" /> {listing.phone}
                          </a>
                          <Button size="sm" variant="outline" onClick={copyPhone} className="h-9 shrink-0 rounded-lg bg-card" aria-label="Скопировать номер">
                            {copied ? <Check /> : <Copy />}
                            {copied ? "Скопировано" : "Копировать"}
                          </Button>
                        </div>
                      ) : (
                        <Button size="lg" onClick={() => setRevealed(true)} className="h-12 w-full rounded-xl text-base shadow-cta">
                          <Phone /> Показать телефон
                          <span className="text-sm font-normal opacity-80">{maskPhone(listing.phone)}</span>
                        </Button>
                      )}
                      {wa && (
                        <Button asChild variant="soft" className="h-11 w-full rounded-xl">
                          <a href={wa} target="_blank" rel="noreferrer">
                            <MessageCircle /> Написать в WhatsApp
                          </a>
                        </Button>
                      )}
                      {tg && (
                        <Button asChild variant="soft" className="h-11 w-full rounded-xl">
                          <a href={tg} target="_blank" rel="noreferrer">
                            <Send /> Написать в Telegram
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isOwner && onDelete && (
                <div className="rounded-2xl border border-dashed p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{isJob ? "Это ваша вакансия" : "Это ваше объявление"}</p>
                    <Link to="/profile" search={{ tab: "ads" }} className="text-sm font-medium text-primary hover:underline">
                      Управлять
                    </Link>
                  </div>
                  {confirmDelete ? (
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="destructive"
                        className="h-10 flex-1 rounded-xl"
                        disabled={deleting}
                        onClick={async () => {
                          setDeleting(true);
                          try {
                            await onDelete();
                          } finally {
                            setDeleting(false);
                          }
                        }}
                      >
                        Да, удалить
                      </Button>
                      <Button variant="outline" className="h-10 flex-1 rounded-xl" onClick={() => setConfirmDelete(false)}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" className="mt-2 h-10 px-2 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                      <Trash2 /> Удалить объявление
                    </Button>
                  )}
                </div>
              )}

              <div className="flex gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
                <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                <p>
                  {isJob
                    ? "Работодатель не вправе требовать оплату за трудоустройство или обучение."
                    : "Не переводите предоплату незнакомым людям. Встречайтесь в людных местах и проверяйте товар."}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
