import { useEffect, useRef, useState } from "react";
import { Briefcase, ImagePlus, Loader2, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CITIES, GOODS_CATEGORIES, JOB_CATEGORIES, normalizeTelegram, type Mode } from "@/lib/listings";
import type { ListingDraft } from "@/lib/market-api";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultMode: Mode;
  defaultCity: string;
  user: { name: string; phone: string | null; telegram: string | null; city: string | null; since: string } | null;
  onSubmit: (draft: ListingDraft, files: File[]) => Promise<void>;
};

const MAX_IMAGES = 6;

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const toNumber = (v: string) => {
  const n = Number(v.replace(/\D/g, ""));
  return v.trim() && Number.isFinite(n) ? n : null;
};

export function PostAdDialog({ open, onOpenChange, defaultMode, defaultCity, user, onSubmit }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [price, setPrice] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [telegram, setTelegram] = useState("");
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(defaultMode);
    const cities = CITIES as readonly string[];
    setCity(cities.includes(defaultCity) ? defaultCity : user?.city && cities.includes(user.city) ? user.city : "");
    if (user?.phone) setPhone(user.phone);
    if (user?.telegram) setTelegram((t) => t || `@${user.telegram}`);
  }, [open, defaultMode, defaultCity, user]);

  const reset = () => {
    setTitle(""); setCategory(""); setPrice(""); setPriceMax(""); setCompany("");
    setDescription(""); setTelegram(""); setImages([]); setSubmitted(false); setFileError(null);
  };

  const categories = mode === "goods" ? GOODS_CATEGORIES : JOB_CATEGORIES;
  const errors = {
    title: title.trim().length < 5 ? "Минимум 5 символов" : null,
    category: !category ? "Выберите категорию" : null,
    city: !city ? "Выберите город" : null,
    description: description.trim().length < 20 ? "Опишите подробнее — минимум 20 символов" : null,
    phone: phone.replace(/\D/g, "").length < 11 ? "Укажите номер полностью" : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const err = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, MAX_IMAGES - images.length);
    const tooBig = list.filter((f) => f.size > 10 * 1024 * 1024);
    const ok = list.filter((f) => f.size <= 10 * 1024 * 1024);
    if (tooBig.length) setFileError("Фото больше 10 МБ не загрузятся");
    else setFileError(null);
    const urls = await Promise.all(ok.map(readFile));
    setImages((prev) => [...prev, ...ok.map((file, i) => ({ url: urls[i]!, file }))].slice(0, MAX_IMAGES));
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setCategory("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors || busy) return;
    const p = toNumber(price);
    const pm = mode === "jobs" ? toNumber(priceMax) : null;
    const companyName = company.trim() || user?.name || "Работодатель";
    const draft: ListingDraft = {
      mode,
      title: title.trim(),
      category,
      city,
      price: p,
      priceMax: pm,
      priceSuffix: mode === "jobs" && (p || pm) ? "/ мес" : null,
      company: mode === "jobs" ? companyName : null,
      description: description.trim(),
      phone: phone.trim(),
      telegram: normalizeTelegram(telegram) ?? (telegram.trim().replace(/^@/, "") || null),
      sellerName: mode === "jobs" ? companyName : user?.name || "Частное лицо",
      sellerType: mode === "jobs" ? "Работодатель" : "Частное лицо",
      sellerSince: user?.since ?? "",
    };
    setBusy(true);
    try {
      await onSubmit(draft, images.map((i) => i.file));
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
        <DialogHeader className="border-b px-5 pb-4 pt-5 text-left sm:px-6">
          <DialogTitle className="font-display text-xl">Новое объявление</DialogTitle>
          <DialogDescription>Заполните информацию — объявление появится в ленте сразу.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Тип объявления">
              {([
                { id: "goods", label: "Товар / Услуга", icon: ShoppingBag },
                { id: "jobs", label: "Вакансия", icon: Briefcase },
              ] as const).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  role="radio"
                  aria-checked={mode === t.id}
                  onClick={() => switchMode(t.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                    mode === t.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className={cn("size-4", mode === t.id && "text-primary")} />
                  {t.label}
                </button>
              ))}
            </div>

            <Field label={mode === "goods" ? "Название" : "Должность"} error={err("title")} htmlFor="ad-title">
              <Input
                id="ad-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder={mode === "goods" ? "Например, iPhone 13 128 ГБ" : "Например, Продавец-консультант"}
                className="h-11"
              />
            </Field>

            {mode === "jobs" && (
              <Field label="Компания" htmlFor="ad-company" hint="Необязательно">
                <Input id="ad-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Название компании или ваше имя" className="h-11" />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Категория" error={err("category")}>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11" aria-label="Категория">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Город" error={err("city")}>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-11" aria-label="Город объявления">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {mode === "goods" ? (
              <Field label="Цена, ₸" htmlFor="ad-price" hint="Оставьте пустым — будет «Договорная»">
                <Input id="ad-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d\s]/g, ""))} placeholder="0" className="h-11" />
              </Field>
            ) : (
              <Field label="Зарплата в месяц, ₸" hint="Можно указать только одно значение">
                <div className="grid grid-cols-2 gap-3">
                  <Input inputMode="numeric" aria-label="Зарплата от" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d\s]/g, ""))} placeholder="От" className="h-11" />
                  <Input inputMode="numeric" aria-label="Зарплата до" value={priceMax} onChange={(e) => setPriceMax(e.target.value.replace(/[^\d\s]/g, ""))} placeholder="До" className="h-11" />
                </div>
              </Field>
            )}

            <Field label="Описание" error={err("description")} htmlFor="ad-desc">
              <Textarea
                id="ad-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={3000}
                placeholder={mode === "goods" ? "Состояние, комплектация, причина продажи…" : "Обязанности, требования, условия работы…"}
              />
            </Field>

            <div className="space-y-1.5">
              <Label>Фотографии</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
                  dragging ? "border-primary bg-accent" : "border-input hover:border-primary/60 hover:bg-muted",
                )}
              >
                <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
                  <ImagePlus className="size-5" />
                </span>
                <p className="text-sm font-medium">Перетащите фото сюда или нажмите, чтобы выбрать</p>
                <p className="text-xs text-muted-foreground">До {MAX_IMAGES} фото · JPG, PNG · до 10 МБ</p>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
              </div>
              {fileError && <p className="text-xs font-medium text-destructive">{fileError}</p>}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-6">
                  {images.map(({ url: src }, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
                      <img src={src} alt={`Фото ${i + 1}`} className="size-full object-cover" />
                      {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">Главное</span>}
                      <button type="button" aria-label="Удалить фото" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-card/90 shadow-card">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Телефон" error={err("phone")} htmlFor="ad-phone">
                <Input id="ad-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 700 000 00 00" className="h-11" />
              </Field>
              <Field label="Telegram" htmlFor="ad-tg" hint="Необязательно">
                <Input id="ad-tg" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" className="h-11" />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 border-t bg-card px-5 py-4 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 flex-1 rounded-xl sm:flex-none">
              Отмена
            </Button>
            <Button type="submit" disabled={busy} className="h-11 flex-1 rounded-xl shadow-cta">
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Публикуем…" : "Опубликовать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, hint, htmlFor, children }: { label: string; error?: string | null; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
