import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/market/ListingCard";
import type { Listing } from "@/lib/listings";
import { EmptyState } from "./EmptyState";

type Props = {
  listings: Listing[] | undefined;
  loading: boolean;
  favorites: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
};

export function FavoritesTab({ listings, loading, favorites, onToggle, onOpen }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" aria-busy="true" aria-label="Загрузка">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl border bg-card" />
        ))}
      </div>
    );
  }
  const items = listings ?? [];
  if (items.length === 0) {
    return (
      <EmptyState icon={Heart} title="В избранном пока пусто" text="Нажимайте на сердечко в карточке, чтобы сохранить понравившиеся объявления и вакансии.">
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/" search={{}}>Смотреть объявления</Link>
        </Button>
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} favorite={favorites.has(l.id)} onToggleFavorite={() => onToggle(l.id)} onOpen={() => onOpen(l.id)} />
      ))}
    </div>
  );
}
