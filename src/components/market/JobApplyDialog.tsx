import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationDraft } from "@/lib/market-api";
import type { Listing } from "@/lib/listings";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  listing: Listing | null;
  defaults: { name: string; contact: string };
  onSubmit: (d: ApplicationDraft) => Promise<void>;
};

export function JobApplyDialog({ open, onOpenChange, listing, defaults, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(defaults.name);
    setContact(defaults.contact);
    setMessage("");
    setSubmitted(false);
  }, [open, defaults.name, defaults.contact]);

  const errors = {
    name: name.trim().length < 2 ? "Укажите имя" : null,
    contact: contact.trim().length < 5 ? "Оставьте телефон или ник в Telegram" : null,
    message: message.trim().length > 1500 ? "Не больше 1500 символов" : null,
  };
  const err = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean) || busy) return;
    setBusy(true);
    try {
      await onSubmit({ applicantName: name.trim(), contactInfo: contact.trim(), message: message.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl">Отклик на вакансию</DialogTitle>
          <DialogDescription>
            {listing ? `«${listing.title}»${listing.company ? ` · ${listing.company}` : ""}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="apply-name">Ваше имя</Label>
            <Input id="apply-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Например, Айдана Серикова" className="h-11" autoComplete="name" />
            {err("name") && <p className="text-xs font-medium text-destructive">{err("name")}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apply-contact">Телефон или Telegram</Label>
            <Input id="apply-contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={100} placeholder="+7 700 000 00 00 или @username" className="h-11" />
            {err("contact") && <p className="text-xs font-medium text-destructive">{err("contact")}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="apply-message">Сообщение</Label>
              <span className="text-xs text-muted-foreground">Необязательно</span>
            </div>
            <Textarea
              id="apply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1500}
              rows={4}
              placeholder="Коротко о себе: опыт, когда готовы выйти, удобный график…"
            />
            {err("message") && <p className="text-xs font-medium text-destructive">{err("message")}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={busy} className="h-11 flex-1 rounded-xl shadow-cta">
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Отправляем…" : "Отправить отклик"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
