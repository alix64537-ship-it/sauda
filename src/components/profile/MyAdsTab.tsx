import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, FileText, Inbox, MapPin, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditListingDialog } from "@/components/market/EditListingDialog";
import { RelativeDate } from "@/components/market/RelativeDate";
import { jobStyle } from "@/components/market/job-style";
import { formatPrice, type Listing } from "@/lib/listings";
import { deleteListing, setListingStatus, updateListing, type ListingPatch } from "@/lib/market-api";
import { cn } from "@/lib/utils";
import { EmptyState, ListSkeleton } from "./EmptyState";

type Props = { listings: Listing[] | undefined; loading: boolean; onOpen: (id: string) => void };

export function MyAdsTab({ listings, loading, onOpen }: Props) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [editing, setEditing] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState<Listing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      queryClient.invalidateQueries({ queryKey: ["listings"] }),
      queryClient.invalidateQueries({ queryKey: ["favorite-listings"] }),
    ]);

  if (loading) return <ListSkeleton />;
  const all = listings ?? [];
  const active = all.filter((l) => l.status !== "archived");
  const archived = all.filter((l) => l.status === "archived");
  const shown = filter === "active" ? active : archived;

  const changeStatus = async (l: Listing, status: "active" | "archived") => {
    setBusyId(l.id);
    try {
      await setListingStatus(l.id, status);
      await refresh();
      if (status === "archived") toast.success(l.mode === "jobs" ? "Вакансия закрыта и перенесена в архив" : "Отмечено как продано, объявление в архиве");
      else toast.success("Объявление снова в ленте");
    } catch {
      toast.error("Не удалось изменить статус");
    } finally {
      setBusyId(null);
    }
  };

  const save = async (patch: ListingPatch) => {
    if (!editing) return;
    try {
      await updateListing(editing, patch);
      await refresh();
      setEditing(null);
      toast.success("Изменения сохранены");
    } catch {
      toast.error("Не удалось сохранить изменения");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const l = deleting;
    setDeleting(null);
    setBusyId(l.id);
    try {
      await deleteListing(l);
      await refresh();
      toast("Объявление удалено");
    } catch {
      toast.error("Не удалось удалить объявление");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-muted p-1" role="tablist" aria-label="Статус объявлений">
          {([
            { id: "active", label: "Активные", count: active.length },
            { id: "archived", label: "В архиве", count: archived.length },
          ] as const).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                filter === t.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label} <span className="text-muted-foreground">{t.count}</span>
            </button>
          ))}
        </div>
        <Button asChild size="sm" className="h-9 rounded-xl">
          <Link to="/" search={{ post: "goods" }}>
            <Plus /> Подать объявление
          </Link>
        </Button>
      </div>

      {shown.length === 0 ? (
        filter === "active" ? (
          <EmptyState icon={FileText} title="Активных объявлений нет" text="Подайте объявление или вакансию — они появятся здесь, и вы сможете ими управлять." />
        ) : (
          <EmptyState icon={Archive} title="Архив пуст" text="Сюда попадают проданные товары и закрытые вакансии." />
        )
      ) : (
        <ul className="space-y-3">
          {shown.map((l) => (
            <li key={l.id}>
              <MyListingRow
                listing={l}
                busy={busyId === l.id}
                onOpen={() => onOpen(l.id)}
                onEdit={() => setEditing(l)}
                onArchive={() => changeStatus(l, "archived")}
                onRestore={() => changeStatus(l, "active")}
                onDelete={() => setDeleting(l)}
              />
            </li>
          ))}
        </ul>
      )}

      <EditListingDialog listing={editing} onOpenChange={(o) => !o && setEditing(null)} onSave={save} />
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleting?.title}» исчезнет навсегда{deleting?.mode === "jobs" ? " вместе с откликами" : ""}. Если товар продан, лучше перенести его в архив.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function MyListingRow({
  listing: l,
  busy,
  onOpen,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  listing: Listing;
  busy: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const isJob = l.mode === "jobs";
  const archived = l.status === "archived";
  const style = jobStyle(l.category);
  const Icon = style.icon;

  return (
    <article className={cn("rounded-2xl border bg-card p-3 shadow-card sm:p-4", archived && "bg-muted/40")}>
      <button type="button" onClick={onOpen} className="flex w-full gap-3 text-left" aria-label={`Открыть: ${l.title}`}>
        <span className={cn("relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24", archived && "opacity-60")}>
          {l.images[0] ? (
            <img src={l.images[0]} alt="" className="size-full object-cover" loading="lazy" />
          ) : isJob ? (
            <span className={cn("grid size-full place-items-center", style.tint)}>
              <Icon className="size-7" />
            </span>
          ) : (
            <span className="grid size-full place-items-center text-xs text-muted-foreground">Нет фото</span>
          )}
        </span>
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                archived ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground",
              )}
            >
              {archived ? (isJob ? "Закрыта" : "Продано") : "Активно"}
            </span>
            <span className="text-[11px] text-muted-foreground">{isJob ? "Вакансия" : l.category}</span>
          </span>
          <span className="line-clamp-2 block text-sm font-medium leading-snug sm:text-[15px]">{l.title}</span>
          <span className="block font-semibold">{formatPrice(l)}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {l.city} · <RelativeDate ts={l.createdAt} />
          </span>
        </span>
      </button>

      <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
        <Button size="sm" variant="outline" className="h-9 rounded-lg" onClick={onEdit} disabled={busy}>
          <Pencil /> Редактировать
        </Button>
        {archived ? (
          <Button size="sm" variant="soft" className="h-9 rounded-lg" onClick={onRestore} disabled={busy}>
            <RotateCcw /> Вернуть в ленту
          </Button>
        ) : (
          <Button size="sm" variant="soft" className="h-9 rounded-lg" onClick={onArchive} disabled={busy}>
            <Archive /> {isJob ? "Закрыть вакансию" : "Продано"}
          </Button>
        )}
        {isJob && (
          <Button asChild size="sm" variant="ghost" className="h-9 rounded-lg">
            <Link to="/profile" search={{ tab: "applications" }}>
              <Inbox /> Отклики
            </Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-9 rounded-lg text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={busy}
          aria-label="Удалить объявление"
        >
          <Trash2 /> <span className="hidden sm:inline">Удалить</span>
        </Button>
      </div>
    </article>
  );
}
