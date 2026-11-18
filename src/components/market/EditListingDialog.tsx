import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Listing } from "@/lib/listings";
import type { ListingPatch } from "@/lib/market-api";

type Props = {
  listing: Listing | null;
  onOpenChange: (o: boolean) => void;
  onSave: (patch: ListingPatch) => Promise<void>;
};

const digitsOnly = (v: string) => v.replace(/[^\d\s]/g, "");
const toNumber = (v: string) => {
  const d = v.replace(/\D/g, "");
  return d ? Number(d) : null;
};

export function EditListingDialog({ listing, onOpenChange, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title);
    setPrice(listing.price != null ? String(listing.price) : "");
    setPriceMax(listing.priceMax != null ? String(listing.priceMax) : "");
    setDescription(listing.description);
    setSubmitted(false);
  }, [listing]);

  const isJob = listing?.mode === "jobs";
  const p = toNumber(price);
  const pm = isJob ? toNumber(priceMax) : null;
  const errors = {
    title: title.trim().length < 5 ? "Минимум 5 символов" : null,
    description: description.trim().length < 20 ? "Минимум 20 символов" : null,
    price: p != null && pm != null && pm < p ? "«До» должно быть больше «От»" : null,
  };
  const err = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || busy) return;
    setBusy(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), price: p, priceMax: pm });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!listing} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl">{isJob ? "Редактировать вакансию" : "Редактировать объявление"}</DialogTitle>
          <DialogDescription>Изменения сразу появятся в ленте.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">{isJob ? "Должность" : "Название"}</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="h-11" />
            {err("title") && <p className="text-xs font-medium text-destructive">{err("title")}</p>}
          </div>
          {isJob ? (
            <div className="space-y-1.5">
              <Label>Зарплата в месяц, ₸</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input inputMode="numeric" aria-label="Зарплата от" placeholder="От" value={price} onChange={(e) => setPrice(digitsOnly(e.target.value))} className="h-11" />
                <Input inputMode="numeric" aria-label="Зарплата до" placeholder="До" value={priceMax} onChange={(e) => setPriceMax(digitsOnly(e.target.value))} className="h-11" />
              </div>
              {err("price") && <p className="text-xs font-medium text-destructive">{err("price")}</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="edit-price">Цена, ₸</Label>
                <span className="text-xs text-muted-foreground">Пусто — «Договорная»</span>
              </div>
              <Input id="edit-price" inputMode="numeric" value={price} onChange={(e) => setPrice(digitsOnly(e.target.value))} className="h-11" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Описание</Label>
            <Textarea id="edit-desc" rows={6} maxLength={3000} value={description} onChange={(e) => setDescription(e.target.value)} />
            {err("description") && <p className="text-xs font-medium text-destructive">{err("description")}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={busy} className="h-11 flex-1 rounded-xl">
              {busy && <Loader2 className="animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
