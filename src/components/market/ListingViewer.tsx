import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import type { Listing } from "@/lib/listings";
import { AlreadyAppliedError, applyToJob, deleteListing, myApplicationsQueryOptions, type ApplicationDraft } from "@/lib/market-api";
import { JobApplyDialog } from "./JobApplyDialog";
import { ListingDetail } from "./ListingDetail";

type Props = {
  listing: Listing | null;
  onClose: () => void;
  onRequireAuth: (reason: string) => void;
};

/** Listing details with favorites, owner delete and the vacancy application flow wired in. */
export function ListingViewer({ listing, onClose, onRequireAuth }: Props) {
  const queryClient = useQueryClient();
  const { user, profile, displayName } = useAuth();
  const { favorites, toggle } = useFavorites(onRequireAuth);
  const { data: appliedIds } = useQuery(myApplicationsQueryOptions(user?.id));
  const [applyOpen, setApplyOpen] = useState(false);

  const isOwner = !!user && !!listing?.userId && listing.userId === user.id;

  const handleDelete = async () => {
    if (!listing) return;
    try {
      await deleteListing(listing);
      onClose();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["listings"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      ]);
      toast("Объявление удалено");
    } catch {
      toast.error("Не удалось удалить объявление");
    }
  };

  const openApply = () => {
    if (!user) return onRequireAuth("Войдите, чтобы откликнуться на вакансию.");
    setApplyOpen(true);
  };

  const submitApplication = async (d: ApplicationDraft) => {
    if (!user || !listing) return;
    try {
      await applyToJob(user.id, listing.id, d);
      setApplyOpen(false);
      toast.success("Отклик отправлен", { description: "Работодатель свяжется с вами по указанному контакту." });
    } catch (e) {
      if (e instanceof AlreadyAppliedError) {
        setApplyOpen(false);
        toast("Вы уже откликались на эту вакансию");
      } else {
        toast.error("Не удалось отправить отклик. Попробуйте еще раз.");
        return;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
  };

  const defaultContact = profile?.phone || (profile?.telegram ? `@${profile.telegram}` : "");

  return (
    <>
      <ListingDetail
        listing={listing}
        onOpenChange={(o) => !o && onClose()}
        favorite={listing ? favorites.has(listing.id) : false}
        onToggleFavorite={() => listing && toggle(listing.id)}
        isOwner={isOwner}
        onDelete={handleDelete}
        applied={!!listing && !!appliedIds?.has(listing.id)}
        onApply={openApply}
      />
      <JobApplyDialog
        open={applyOpen && !!listing}
        onOpenChange={setApplyOpen}
        listing={listing}
        defaults={{ name: displayName, contact: defaultContact }}
        onSubmit={submitApplication}
      />
    </>
  );
}
