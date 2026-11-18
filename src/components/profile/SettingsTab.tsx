import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { CITIES, normalizeTelegram, whatsappPhone } from "@/lib/listings";
import { saveProfile } from "@/lib/market-api";

const NO_CITY = "none";

export function SettingsTab() {
  const queryClient = useQueryClient();
  const { user, profile, displayName } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [city, setCity] = useState(NO_CITY);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(profile?.display_name || displayName);
    setPhone(profile?.phone ?? "");
    setTelegram(profile?.telegram ? `@${profile.telegram}` : "");
    setCity(profile?.city && (CITIES as readonly string[]).includes(profile.city) ? profile.city : NO_CITY);
  }, [profile, displayName]);

  const errors = {
    name: name.trim().length < 2 ? "Минимум 2 символа" : name.trim().length > 80 ? "Не больше 80 символов" : null,
    phone: phone.trim() && !whatsappPhone(phone) ? "Укажите номер полностью, например +7 701 234 56 78" : null,
    telegram: telegram.trim() && !normalizeTelegram(telegram) ? "Ник — 5–32 символа: латинские буквы, цифры или _" : null,
  };
  const err = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!user || busy || Object.values(errors).some(Boolean)) return;
    setBusy(true);
    try {
      await saveProfile(user.id, {
        displayName: name.trim(),
        phone: phone.trim() || null,
        telegram: normalizeTelegram(telegram),
        city: city === NO_CITY ? null : city,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setSubmitted(false);
      toast.success("Настройки сохранены");
    } catch {
      toast.error("Не удалось сохранить настройки");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border bg-card p-4 shadow-card sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Настройки профиля</h2>
        <p className="text-sm text-muted-foreground">Эти данные подставятся в новые объявления и отклики.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="set-name">Имя и фамилия</Label>
          <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Например, Айдана Серикова" className="h-11" autoComplete="name" />
          {err("name") && <p className="text-xs font-medium text-destructive">{err("name")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-phone">Телефон</Label>
          <Input id="set-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 700 000 00 00" className="h-11" autoComplete="tel" />
          {err("phone") && <p className="text-xs font-medium text-destructive">{err("phone")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-tg">Telegram</Label>
          <Input id="set-tg" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" className="h-11" autoCapitalize="none" />
          {err("telegram") && <p className="text-xs font-medium text-destructive">{err("telegram")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Город по умолчанию</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-11" aria-label="Город по умолчанию">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CITY}>Не выбран</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-email">Email</Label>
          <Input id="set-email" value={user?.email ?? ""} readOnly disabled className="h-11" />
        </div>
      </div>
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={busy || !user} className="h-11 w-full rounded-xl sm:w-auto sm:px-8">
          {busy && <Loader2 className="animate-spin" />}
          Сохранить
        </Button>
      </div>
    </form>
  );
}
