import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import { formatPrice, type Listing } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { jobStyle } from "./job-style";
import { RelativeDate } from "./RelativeDate";

type Props = {
  listing: Listing;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
};

export function FavoriteButton({ active, onClick, className }: { active: boolean; onClick: () => void; className?: string }) {
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        setPop(true);
        onClick();
      }}
      onAnimationEnd={() => setPop(false)}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-card/90 shadow-card backdrop-blur transition-colors hover:bg-card",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-[18px] transition-colors",
          active ? "fill-favorite text-favorite" : "text-muted-foreground",
          pop && "animate-heart-pop",
        )}
      />
    </button>
  );
}

export function ListingCard({ listing, favorite, onToggleFavorite, onOpen }: Props) {
  const isJob = listing.mode === "jobs";
  const style = jobStyle(listing.category);
  const Icon = style.icon;

  return (
    <article
      role="button"
      aria-label={listing.title}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {!isJob && listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            loading="lazy"
            width={1024}
            height={768}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : isJob ? (
          <div className={cn("flex size-full flex-col items-start justify-between p-3 sm:p-4", style.tint)}>
            <span className="grid size-10 place-items-center rounded-xl bg-card/70 sm:size-12">
              <Icon className="size-5 sm:size-6" />
            </span>
            <div className="min-w-0 max-w-full">
              {listing.schedule && (
                <p className="mb-2 hidden line-clamp-2 text-sm font-medium leading-snug sm:[display:-webkit-box]">{listing.schedule}</p>
              )}
              <p className="truncate text-xs font-medium opacity-80">{listing.company}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide">{listing.category}</p>
            </div>
          </div>
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">Нет фото</div>
        )}
        <FavoriteButton active={favorite} onClick={onToggleFavorite} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground sm:text-[15px]">{listing.title}</h3>
        <p className={cn("font-semibold text-foreground", isJob ? "text-sm sm:text-base" : "text-base sm:text-lg")}>
          {formatPrice(listing)}
        </p>
        <div className="mt-auto flex flex-col gap-0.5 pt-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {listing.city}
          </span>
          <RelativeDate ts={listing.createdAt} />
        </div>
      </div>
    </article>
  );
}
