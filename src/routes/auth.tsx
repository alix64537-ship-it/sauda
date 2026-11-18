import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthForm } from "@/components/market/AuthDialog";
import { Logo } from "@/components/market/Header";
import { useAuth } from "@/hooks/use-auth";

/** Only same-site paths are allowed as a post-sign-in destination. */
function safePath(v: unknown): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/profile";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {},
  head: () => ({
    meta: [
      { title: "Вход — Сауда" },
      { name: "description", content: "Войдите в Сауда, чтобы управлять объявлениями, откликами и избранным." },
      { property: "og:title", content: "Вход в Сауда" },
      { property: "og:description", content: "Управляйте объявлениями, откликами на вакансии и избранным." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const target = safePath(redirect);

  useEffect(() => {
    if (ready && user) void navigate({ href: target, replace: true });
  }, [ready, user, target, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-card">
        <AuthForm
          reason="Войдите, чтобы открыть профиль: объявления, отклики и избранное."
          onDone={() => void navigate({ href: target, replace: true })}
          oauthReturnPath={`/auth?redirect=${encodeURIComponent(target)}`}
          heading={(title, description) => (
            <div className="space-y-1.5">
              <h1 className="font-display text-xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
