import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Heart, Plus, SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Header, Logo } from "@/components/market/Header";
import { CategoryPills, FilterBar, SearchHero } from "@/components/market/SearchFilters";
import { ListingCard } from "@/components/market/ListingCard";
import { ListingViewer } from "@/components/market/ListingViewer";
import { PostAdDialog } from "@/components/market/PostAdDialog";
import { AuthDialog } from "@/components/market/AuthDialog";
import { ALL_CITIES, CITIES, filterListings, type Mode, type SortKey } from "@/lib/listings";
import { createListing, listingsQueryOptions, type ListingDraft } from "@/lib/market-api";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/")({
  /** ?post=goods|jobs opens the "new ad" form (used by links from the profile) */
  validateSearch: (s: Record<string, unknown>): { post?: Mode } =>
    s["post"] === "goods" || s["post"] === "jobs" ? { post: s["post"] } : {},
  head: () => ({
    meta: [
      { title: "Сауда — объявления, работа и подработка в Казахстане" },
      {
        name: "description",
        content: "Покупайте, продавайте и находите работу рядом: объявления и вакансии в Алматы, Астане, Караганде и Шымкенте.",
      },
      { property: "og:title", content: "Сауда — объявления, работа и подработка" },
      {
        property: "og:description",
        content: "Товары, услуги, недвижимость и вакансии по всему Казахстану. Подайте объявление бесплатно.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listingsQueryOptions()),
  component: Index,
});

function pluralListings(n: number, mode: Mode) {
  const forms = mode === "goods" ? ["объявление", "объявления", "объявлений"] : ["вакансия", "вакансии", "вакансий"];
  const m10 = n % 10;
  const m100 = n % 100;
  const f = m10 === 1 && m100 !== 11 ? forms[0] : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? forms[1] : forms[2];
  return `${n} ${f}`;
}

function Index() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { post } = Route.useSearch();
  const { user, profile, ready, displayName, signOut } = useAuth();
  const { data: listings } = useSuspenseQuery(listingsQueryOptions());

  const [mode, setMode] = useState<Mode>("goods");
  const [city, setCity] = useState(ALL_CITIES);
  const [category, setCategory] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [sort, setSort] = useState<SortKey>("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);

  const requireAuth = (reason: string) => {
    setAuthReason(reason);
    setAuthOpen(true);
  };
  const { favorites, toggle: toggleFavorite } = useFavorites(requireAuth);

  // Start the feed in the user's default city (once, and only if they haven't picked one yet)
  const cityTouched = useRef(false);
  useEffect(() => {
    if (cityTouched.current || !profile?.city) return;
    if ((CITIES as readonly string[]).includes(profile.city)) setCity(profile.city);
    cityTouched.current = true;
  }, [profile?.city]);
  const changeCity = (c: string) => {
    cityTouched.current = true;
    setCity(c);
  };

  // Links like /?post=jobs open the posting form
  useEffect(() => {
    if (!post || !ready) return;
    changeMode(post);
    if (user) setPostOpen(true);
    else requireAuth("Войдите, чтобы подать объявление.");
    void navigate({ to: "/", search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post, ready, user]);

  const visible = useMemo(
    () =>
      filterListings(listings, {
        mode,
        city,
        category,
        query,
        priceFrom: priceFrom ? Number(priceFrom) : null,
        priceTo: priceTo ? Number(priceTo) : null,
        sort,
      }),
    [listings, mode, city, category, query, priceFrom, priceTo, sort],
  );

  const opened = listings.find((l) => l.id === openId) ?? null;

  function changeMode(m: Mode) {
    setMode(m);
    setCategory(null);
    setPriceFrom("");
    setPriceTo("");
  }

  const openPost = () => {
    if (!user) return requireAuth("Войдите, чтобы подать объявление.");
    setPostOpen(true);
  };

  const resetFilters = () => {
    setCategory(null);
    setPriceFrom("");
    setPriceTo("");
    setSort("new");
    setQuery("");
    setQueryInput("");
  };
  const canReset = !!(category || priceFrom || priceTo || sort !== "new" || query);

  const handlePublish = async (draft: ListingDraft, files: File[]) => {
    if (!user) return requireAuth("Войдите, чтобы подать объявление.");
    try {
      const id = await createListing(user.id, draft, files);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["listings"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      ]);
      setPostOpen(false);
      setMode(draft.mode);
      setCategory(null);
      setSort("new");
      if (city !== ALL_CITIES && city !== draft.city) setCity(ALL_CITIES);
      toast.success("Объявление опубликовано", {
        description: draft.title,
        action: { label: "Открыть", onClick: () => setOpenId(id) },
      });
    } catch {
      toast.error("Не удалось опубликовать объявление. Попробуйте еще раз.");
    }
  };

  const sinceYear = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const postUser = user
    ? { name: displayName, phone: profile?.phone ?? null, telegram: profile?.telegram ?? null, city: profile?.city ?? null, since: `на Сауда с ${sinceYear} года` }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        mode={mode}
        onModeChange={changeMode}
        city={city}
        onCityChange={changeCity}
        onPost={openPost}
        user={user ? { name: displayName } : null}
        onLogin={() => requireAuth("")}
        onLogout={async () => {
          await signOut();
          toast("Вы вышли из профиля");
        }}
        favoritesCount={favorites.size}
      />

      <main>
        <SearchHero mode={mode} query={queryInput} onQueryChange={setQueryInput} onSubmit={() => setQuery(queryInput)} />

        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-28 sm:py-8 md:pb-12">
          <CategoryPills mode={mode} value={category} onChange={setCategory} />
          <FilterBar
            mode={mode}
            priceFrom={priceFrom}
            priceTo={priceTo}
            onPriceFrom={setPriceFrom}
            onPriceTo={setPriceTo}
            sort={sort}
            onSort={setSort}
            onReset={resetFilters}
            canReset={canReset}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold sm:text-xl">
              {category ?? (mode === "goods" ? "Свежие объявления" : "Свежие вакансии")}
              <span className="ml-2 align-middle font-sans text-sm font-normal text-muted-foreground">
                {pluralListings(visible.length, mode)}
                {city !== ALL_CITIES && ` · ${city}`}
              </span>
            </h2>
            {favorites.size > 0 && (
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/profile" search={{ tab: "favorites" }}>
                  <Heart className="fill-favorite text-favorite" /> Избранное · {favorites.size}
                </Link>
              </Button>
            )}
          </div>

          {visible.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  favorite={favorites.has(l.id)}
                  onToggleFavorite={() => toggleFavorite(l.id)}
                  onOpen={() => setOpenId(l.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
                <SearchX className="size-6" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">Ничего не найдено</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Попробуйте изменить запрос, город или диапазон цены.</p>
              {canReset && (
                <Button variant="outline" onClick={resetFilters} className="mt-5 rounded-xl">
                  Сбросить фильтры
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 pb-28 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:pb-6">
          <Logo />
          <p>© 2026 Сауда. Объявления и работа по всему Казахстану.</p>
        </div>
      </footer>

      {/* Mobile post button */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pb-4 pt-6 md:hidden">
        <Button onClick={openPost} className="h-12 w-full rounded-xl text-base shadow-cta">
          <Plus /> Подать объявление
        </Button>
      </div>

      <ListingViewer listing={opened} onClose={() => setOpenId(null)} onRequireAuth={requireAuth} />
      <PostAdDialog
        open={postOpen}
        onOpenChange={setPostOpen}
        defaultMode={mode}
        defaultCity={city}
        user={postUser}
        onSubmit={handlePublish}
      />
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} reason={authReason} />
    </div>
  );
}
