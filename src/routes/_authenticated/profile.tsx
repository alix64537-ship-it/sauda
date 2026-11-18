import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Heart, Inbox, Settings } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/market/Header";
import { ListingViewer } from "@/components/market/ListingViewer";
import { AuthDialog } from "@/components/market/AuthDialog";
import { MyAdsTab } from "@/components/profile/MyAdsTab";
import { ApplicationsTab } from "@/components/profile/ApplicationsTab";
import { FavoritesTab } from "@/components/profile/FavoritesTab";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { favoriteListingsQueryOptions, myListingsQueryOptions } from "@/lib/market-api";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "ads", label: "Мои объявления", short: "Объявления", icon: FileText },
  { id: "applications", label: "Отклики", short: "Отклики", icon: Inbox },
  { id: "favorites", label: "Избранное", short: "Избранное", icon: Heart },
  { id: "settings", label: "Настройки", short: "Настройки", icon: Settings },
] as const;
type Tab = (typeof TABS)[number]["id"];

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (s: Record<string, unknown>): { tab: Tab } => ({
    tab: TABS.some((t) => t.id === s["tab"]) ? (s["tab"] as Tab) : "ads",
  }),
  head: () => ({
    meta: [
      { title: "Мой профиль — Сауда" },
      { name: "description", content: "Ваши объявления, отклики на вакансии, избранное и настройки профиля на Сауда." },
      { property: "og:title", content: "Мой профиль — Сауда" },
      { property: "og:description", content: "Управляйте объявлениями, откликами и избранным." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile, displayName, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const requireAuth = (reason: string) => {
    setAuthReason(reason);
    setAuthOpen(true);
  };
  const { favorites, toggle } = useFavorites(requireAuth);
  const [openId, setOpenId] = useState<string | null>(null);

  const mine = useQuery(myListingsQueryOptions(user?.id));
  const favs = useQuery(favoriteListingsQueryOptions(user?.id));
  const opened = [...(mine.data ?? []), ...(favs.data ?? [])].find((l) => l.id === openId) ?? null;

  const activeCount = mine.data?.filter((l) => l.status !== "archived").length ?? 0;
  const sinceYear = user?.created_at ? new Date(user.created_at).getFullYear() : null;

  const setTab = (t: Tab) => void navigate({ to: "/profile", search: { tab: t }, replace: true });

  return (
    <div className="min-h-screen bg-background">
      <Header
        onPost={() => void navigate({ to: "/", search: { post: "goods" } })}
        user={user ? { name: displayName } : null}
        onLogin={() => requireAuth("")}
        onLogout={async () => {
          await signOut();
          toast("Вы вышли из профиля");
          void navigate({ to: "/", search: {}, replace: true });
        }}
        favoritesCount={favorites.size}
      />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 pb-16 sm:py-8">
        <section className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent font-display text-xl font-semibold text-accent-foreground sm:size-16">
            {(displayName || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-semibold sm:text-xl">{displayName || "Профиль"}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {[profile?.city, user?.email].filter(Boolean).join(" · ")}
            </p>
            {sinceYear && <p className="text-xs text-muted-foreground">На Сауда с {sinceYear} года</p>}
          </div>
          <dl className="hidden gap-6 text-center sm:flex">
            <div>
              <dt className="text-xs text-muted-foreground">Активных</dt>
              <dd className="font-display text-lg font-semibold">{activeCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">В избранном</dt>
              <dd className="font-display text-lg font-semibold">{favorites.size}</dd>
            </div>
          </dl>
        </section>

        <div role="tablist" aria-label="Разделы профиля" className="grid grid-cols-4 gap-1 rounded-2xl border bg-card p-1 shadow-card sm:flex">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors sm:flex-1 sm:flex-row sm:justify-center sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="size-5 shrink-0 sm:size-4" />
                <span className="w-full truncate text-center sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        {tab === "ads" && <MyAdsTab listings={mine.data} loading={mine.isPending} onOpen={setOpenId} />}
        {tab === "applications" && <ApplicationsTab listings={mine.data} loadingListings={mine.isPending} onOpen={setOpenId} />}
        {tab === "favorites" && (
          <FavoritesTab listings={favs.data} loading={favs.isPending} favorites={favorites} onToggle={toggle} onOpen={setOpenId} />
        )}
        {tab === "settings" && <SettingsTab />}
      </main>

      <ListingViewer listing={opened} onClose={() => setOpenId(null)} onRequireAuth={requireAuth} />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} reason={authReason} />
    </div>
  );
}
