import { useState, type ReactNode } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reason?: string | null | undefined;
};

type FormProps = {
  reason?: string | null | undefined;
  /** Called after a successful sign-in */
  onDone: () => void;
  /** Same-site path a full-page social sign-in returns to; defaults to the site root */
  oauthReturnPath?: string;
  heading: (title: string, description: string) => ReactNode;
};

type View = "signin" | "signup" | "forgot" | "check-email";

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Неверный email или пароль",
  "Email not confirmed": "Подтвердите email — мы отправили письмо со ссылкой",
  "User already registered": "Этот email уже зарегистрирован. Попробуйте войти",
};
function ru(m: string): string {
  if (ERRORS[m]) return ERRORS[m];
  const low = m.toLowerCase();
  if (low.includes("email") && (low.includes("not allowed") || low.includes("invalid"))) return "Этот email не подходит — проверьте адрес";
  if (low.includes("pwned") || low.includes("leaked") || low.includes("weak")) return "Этот пароль слишком простой или встречался в утечках. Придумайте другой";
  if (low.includes("password")) return "Пароль должен быть не короче 6 символов";
  if (low.includes("rate limit") || low.includes("too many")) return "Слишком много попыток. Подождите немного и попробуйте снова";
  return "Не получилось. Попробуйте еще раз";
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

export function AuthDialog({ open, onOpenChange, reason }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] max-w-sm overflow-y-auto rounded-2xl">
        {open && (
          <AuthForm
            reason={reason}
            onDone={() => onOpenChange(false)}
            heading={(title, description) => (
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-xl">{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>
            )}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AuthForm({ reason, onDone, oauthReturnPath, heading }: FormProps) {
  const [view, setView] = useState<View>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const social = async (provider: "google" | "lovable") => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}${oauthReturnPath ?? ""}` });
    if (result.error) {
      setError("Не удалось войти. Попробуйте еще раз");
      return;
    }
    if (result.redirected) return;
    onDone();
    toast.success("Вы вошли в Сауда");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (view === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return setError(ru(error.message));
        onDone();
        toast.success("Вы вошли в Сауда");
      } else if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
        });
        if (error) return setError(ru(error.message));
        if (data.session) {
          onDone();
          toast.success(`Добро пожаловать, ${name.trim()}!`);
        } else setView("check-email");
      } else if (view === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return setError(ru(error.message));
        setView("check-email");
      }
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<View, string> = {
    signin: "Вход в Сауда",
    signup: "Регистрация",
    forgot: "Восстановление пароля",
    "check-email": "Проверьте почту",
  };

  const description =
    view === "check-email"
      ? `Мы отправили письмо на ${email}. Перейдите по ссылке в нем, чтобы продолжить.`
      : view === "forgot"
        ? "Укажите email — пришлем ссылку для нового пароля."
        : reason || "Подавайте объявления, сохраняйте избранное и общайтесь с продавцами.";

  return (
    <>
      {heading(titles[view], description)}

        {view === "check-email" ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
              <MailCheck className="size-6" />
            </span>
            <Button variant="outline" className="h-11 w-full rounded-xl" onClick={() => setView("signin")}>
              Вернуться ко входу
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {view !== "forgot" && (
              <>
                <div className="grid grid-cols-2 rounded-xl bg-muted p-1" role="tablist">
                  {(["signin", "signup"] as const).map((v) => (
                    <button
                      key={v}
                      role="tab"
                      aria-selected={view === v}
                      onClick={() => { setView(v); setError(null); }}
                      className={cn(
                        "rounded-lg py-2 text-sm font-medium transition-all",
                        view === v ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
                      )}
                    >
                      {v === "signin" ? "Вход" : "Регистрация"}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Button type="button" variant="google" className="h-11 w-full rounded-xl" onClick={() => social("google")}>
                    <GoogleLogo /> Продолжить с Google
                  </Button>
                  <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>
                    Продолжить с Lovable
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> или по email <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form className="space-y-3" onSubmit={submit}>
              {view === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">Как вас зовут</Label>
                  <Input id="auth-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Айдана" className="h-11" autoComplete="name" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <Input id="auth-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.kz" className="h-11" autoComplete="email" />
              </div>
              {view !== "forgot" && (
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <Label htmlFor="auth-password">Пароль</Label>
                    {view === "signin" && (
                      <button type="button" onClick={() => { setView("forgot"); setError(null); }} className="text-xs font-medium text-primary hover:underline">
                        Забыли пароль?
                      </button>
                    )}
                  </div>
                  <Input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={view === "signup" ? "Не меньше 6 символов" : "Ваш пароль"}
                    className="h-11"
                    autoComplete={view === "signup" ? "new-password" : "current-password"}
                  />
                </div>
              )}
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy} className="h-11 w-full rounded-xl">
                {busy && <Loader2 className="animate-spin" />}
                {view === "signin" ? "Войти" : view === "signup" ? "Создать аккаунт" : "Отправить ссылку"}
              </Button>
              {view === "forgot" && (
                <Button type="button" variant="ghost" className="w-full" onClick={() => setView("signin")}>
                  Назад ко входу
                </Button>
              )}
            </form>
          </div>
        )}
    </>
  );
}
