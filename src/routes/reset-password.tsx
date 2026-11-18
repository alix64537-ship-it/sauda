import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/market/Header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Новый пароль — Сауда" },
      { name: "description", content: "Задайте новый пароль для входа в Сауда." },
      { property: "og:title", content: "Новый пароль — Сауда" },
      { property: "og:description", content: "Задайте новый пароль для входа в Сауда." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && isRecovery)) setState("ready");
    });
    const t = setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        setState((s) => (s === "ready" ? s : data.session && isRecovery ? "ready" : "invalid"));
      });
    }, 1200);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError("Не удалось сохранить пароль. Он должен быть не короче 6 символов.");
    toast.success("Пароль обновлен");
    void navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-6"><Logo /></div>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-card">
        <h1 className="font-display text-xl font-semibold">Новый пароль</h1>
        {state === "checking" && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Проверяем ссылку…</p>
        )}
        {state === "invalid" && (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-muted-foreground">Ссылка недействительна или устарела. Запросите новую в окне входа.</p>
            <Button className="h-11 w-full rounded-xl" onClick={() => navigate({ to: "/" })}>На главную</Button>
          </div>
        )}
        {state === "ready" && (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Придумайте пароль</Label>
              <Input id="new-password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Не меньше 6 символов" className="h-11" autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
              {busy && <Loader2 className="animate-spin" />} Сохранить пароль
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
