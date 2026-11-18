import { BookOpen, Dumbbell, Home, LayoutGrid, Search, Smartphone, Wrench, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GOODS_CATEGORIES, JOB_CATEGORIES, type Mode, type SortKey } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { JOB_STYLE } from "./job-style";

const GOODS_ICONS: Record<string, LucideIcon> = {
  Электроника: Smartphone,
  Услуги: Wrench,
  "Учеба и книги": BookOpen,
  Недвижимость: Home,
  "Спорт и хобби": Dumbbell,
};

export function SearchHero({
  mode,
  query,
  onQueryChange,
  onSubmit,
}: {
  mode: Mode;
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="bg-hero">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-7 sm:pb-10 sm:pt-10">
        <h1 className="max-w-2xl font-display text-2xl font-semibold leading-tight text-primary-foreground sm:text-4xl">
          {mode === "goods" ? "Покупайте и продавайте рядом с домом" : "Работа и подработка в вашем городе"}
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/80 sm:text-base">
          {mode === "goods"
            ? "Тысячи объявлений по всему Казахстану — от смартфонов до квартир."
            : "Вакансии с проверенными работодателями: полный день, смены и удаленка."}
        </p>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="mt-5 flex gap-2 rounded-2xl bg-card p-1.5 shadow-card-hover sm:mt-6 sm:max-w-3xl"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={mode === "goods" ? "Что вы ищете? Например, «ноутбук»" : "Должность или компания"}
              aria-label="Поиск"
              className="h-12 border-0 pl-10 text-base shadow-none focus-visible:ring-0"
            />
          </div>
          <Button type="submit" className="h-12 rounded-xl px-4 text-base sm:px-7">
            <Search className="sm:hidden" />
            <span className="hidden sm:inline">Найти</span>
          </Button>
        </form>
      </div>
    </section>
  );
}

export function CategoryPills({
  mode,
  value,
  onChange,
}: {
  mode: Mode;
  value: string | null;
  onChange: (c: string | null) => void;
}) {
  const cats = mode === "goods" ? GOODS_CATEGORIES : JOB_CATEGORIES;
  const items: { id: string | null; label: string; icon: LucideIcon }[] = [
    { id: null, label: "Все", icon: LayoutGrid },
    ...cats.map((c) => ({ id: c as string, label: c as string, icon: (mode === "goods" ? GOODS_ICONS[c] : JOB_STYLE[c]?.icon) ?? LayoutGrid })),
  ];
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.label}
            onClick={() => onChange(it.id)}
            aria-pressed={active}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-cta"
                : "bg-card text-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            <it.icon className="size-4" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterBar({
  mode,
  priceFrom,
  priceTo,
  onPriceFrom,
  onPriceTo,
  sort,
  onSort,
  onReset,
  canReset,
}: {
  mode: Mode;
  priceFrom: string;
  priceTo: string;
  onPriceFrom: (v: string) => void;
  onPriceTo: (v: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  onReset: () => void;
  canReset: boolean;
}) {
  const clean = (v: string) => v.replace(/[^\d]/g, "");
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-3 shadow-card sm:p-4">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{mode === "goods" ? "Цена, ₸" : "Зарплата, ₸"}</p>
        <div className="flex items-center gap-2">
          <Input inputMode="numeric" aria-label="От" placeholder="От" value={priceFrom} onChange={(e) => onPriceFrom(clean(e.target.value))} className="h-10 sm:w-36" />
          <span className="text-muted-foreground">—</span>
          <Input inputMode="numeric" aria-label="До" placeholder="До" value={priceTo} onChange={(e) => onPriceTo(clean(e.target.value))} className="h-10 sm:w-36" />
        </div>
      </div>
      <div className="flex-1 sm:flex-none">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Сортировка</p>
        <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
          <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Сортировка">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="cheap">Дешевле</SelectItem>
            <SelectItem value="expensive">Дороже</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {canReset && (
        <Button variant="ghost" onClick={onReset} className="h-10 text-muted-foreground">
          Сбросить
        </Button>
      )}
    </div>
  );
}
