import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox, MapPin, MessageCircle, Phone, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RelativeDate } from "@/components/market/RelativeDate";
import { useAuth } from "@/hooks/use-auth";
import { contactLinks, groupApplications, pluralRu, type JobApplication, type Listing } from "@/lib/listings";
import { receivedApplicationsQueryOptions } from "@/lib/market-api";
import { cn } from "@/lib/utils";
import { EmptyState, ListSkeleton } from "./EmptyState";

type Props = { listings: Listing[] | undefined; loadingListings: boolean; onOpen: (id: string) => void };

const APPLICATION_FORMS = ["отклик", "отклика", "откликов"] as const;

export function ApplicationsTab({ listings, loadingListings, onOpen }: Props) {
  const { user } = useAuth();
  const apps = useQuery(receivedApplicationsQueryOptions(user?.id));

  if (loadingListings || apps.isPending) return <ListSkeleton />;
  if (apps.isError) {
    return <EmptyState icon={Inbox} title="Не удалось загрузить отклики" text="Проверьте соединение и обновите страницу." />;
  }

  const groups = groupApplications(listings ?? [], apps.data).filter(
    (g) => g.listing.status !== "archived" || g.applications.length > 0,
  );
  const total = apps.data.length;

  if (groups.length === 0) {
    return (
      <EmptyState icon={Inbox} title="Откликов пока нет" text="Разместите вакансию — отклики соискателей появятся здесь, сгруппированные по вакансиям.">
        <Button asChild className="rounded-xl">
          <Link to="/" search={{ post: "jobs" }}>
            <Plus /> Разместить вакансию
          </Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pluralRu(total, APPLICATION_FORMS)} на {pluralRu(groups.length, ["вакансию", "вакансии", "вакансий"])}
      </p>
      {groups.map(({ listing, applications }) => (
        <article key={listing.id} className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <button
            type="button"
            onClick={() => onOpen(listing.id)}
            className="flex w-full items-start justify-between gap-3 border-b bg-muted/40 p-4 text-left hover:bg-muted"
          >
            <span className="min-w-0">
              <span className="line-clamp-2 block font-display text-base font-semibold">{listing.title}</span>
              <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> {listing.city}
                {listing.status === "archived" && " · вакансия закрыта"}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                applications.length ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {pluralRu(applications.length, APPLICATION_FORMS)}
            </span>
          </button>
          {applications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Пока никто не откликнулся.</p>
          ) : (
            <ul className="divide-y">
              {applications.map((a) => (
                <li key={a.id}>
                  <ApplicationItem application={a} />
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}

function ApplicationItem({ application: a }: { application: JobApplication }) {
  const links = contactLinks(a.contactInfo);
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">
          {a.applicantName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <p className="font-semibold">{a.applicantName}</p>
            <RelativeDate ts={a.createdAt} className="text-xs text-muted-foreground" />
          </div>
          <p className="select-all break-all text-sm text-foreground/80">{a.contactInfo}</p>
        </div>
      </div>
      {a.message && <p className="whitespace-pre-line rounded-xl bg-muted p-3 text-sm leading-relaxed">{a.message}</p>}
      {(links.tel || links.whatsapp || links.telegram) && (
        <div className="flex flex-wrap gap-2">
          {links.tel && (
            <Button asChild size="sm" variant="outline" className="h-9 rounded-lg">
              <a href={links.tel}>
                <Phone /> Позвонить
              </a>
            </Button>
          )}
          {links.whatsapp && (
            <Button asChild size="sm" variant="soft" className="h-9 rounded-lg">
              <a href={links.whatsapp} target="_blank" rel="noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
          {links.telegram && (
            <Button asChild size="sm" variant="soft" className="h-9 rounded-lg">
              <a href={links.telegram} target="_blank" rel="noreferrer">
                <Send /> Telegram
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
