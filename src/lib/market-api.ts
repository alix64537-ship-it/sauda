import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listListings, LISTING_IMAGES_BUCKET } from "./listings.functions";
import { rowToListing, type JobApplication, type Listing, type ListingRow, type ListingStatus, type Mode } from "./listings";

export const listingsQueryOptions = () =>
  queryOptions({
    queryKey: ["listings"],
    queryFn: () => listListings(),
    staleTime: 30_000,
  });

export const favoritesQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("listing_id");
      if (error) throw error;
      return new Set(data.map((r) => r.listing_id));
    },
  });

export async function setFavorite(userId: string, listingId: string, value: boolean) {
  const q = value
    ? supabase.from("favorites").insert({ user_id: userId, listing_id: listingId })
    : supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
  const { error } = await q;
  if (error) throw error;
}

export type ListingDraft = {
  mode: Mode;
  title: string;
  category: string;
  city: string;
  price: number | null;
  priceMax: number | null;
  priceSuffix: string | null;
  company: string | null;
  description: string;
  phone: string;
  telegram: string | null;
  sellerName: string;
  sellerType: string;
  sellerSince: string;
};

export async function createListing(userId: string, draft: ListingDraft, files: File[]) {
  const paths: string[] = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
    });
    if (error) {
      if (paths.length) await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(paths);
      throw error;
    }
    paths.push(path);
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: userId,
      mode: draft.mode,
      title: draft.title,
      category: draft.category,
      city: draft.city,
      price: draft.price,
      price_max: draft.priceMax,
      price_suffix: draft.priceSuffix,
      company: draft.company,
      description: draft.description,
      images: paths,
      phone: draft.phone,
      telegram: draft.telegram,
      seller_name: draft.sellerName,
      seller_type: draft.sellerType,
      seller_since: draft.sellerSince,
    })
    .select("id")
    .single();
  if (error) {
    if (paths.length) await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(paths);
    throw error;
  }
  return data.id;
}

export async function deleteListing(listing: Listing) {
  const { error } = await supabase.from("listings").delete().eq("id", listing.id);
  if (error) throw error;
  const own = (listing.imagePaths ?? []).filter((p) => !p.startsWith("demo/"));
  if (own.length) await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(own);
}

// ---------- Profile dashboard ----------

const SIGNED_URL_TTL = 60 * 60 * 6;

/** Maps rows to listings, signing private photo paths with the signed-in browser client. */
async function rowsToListings(rows: ListingRow[]): Promise<Listing[]> {
  const paths = Array.from(new Set(rows.flatMap((r) => r.images)));
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(LISTING_IMAGES_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of data ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }
  return rows.map((r) => rowToListing(r, (p) => urlByPath.get(p)));
}

/** All of the user's listings, active and archived. */
export const myListingsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-listings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return rowsToListings(data);
    },
  });

/** Listings the user liked, read through the favorites table. */
export const favoriteListingsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorite-listings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("created_at, listings(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data.map((r) => r.listings).filter((l): l is NonNullable<typeof l> => !!l);
      return rowsToListings(rows);
    },
  });

export type ListingPatch = {
  title: string;
  description: string;
  price: number | null;
  priceMax: number | null;
};

export async function updateListing(listing: Listing, patch: ListingPatch) {
  const isJob = listing.mode === "jobs";
  const { data, error } = await supabase
    .from("listings")
    .update({
      title: patch.title,
      description: patch.description,
      price: patch.price,
      price_max: isJob ? patch.priceMax : null,
      ...(isJob ? { price_suffix: patch.price != null || patch.priceMax != null ? "/ мес" : null } : {}),
    })
    .eq("id", listing.id)
    .select("id");
  if (error) throw error;
  if (!data.length) throw new Error("Listing not found");
}

export async function setListingStatus(id: string, status: ListingStatus) {
  const { data, error } = await supabase.from("listings").update({ status }).eq("id", id).select("id");
  if (error) throw error;
  if (!data.length) throw new Error("Listing not found");
}

export type ProfileSettings = {
  displayName: string;
  phone: string | null;
  telegram: string | null;
  city: string | null;
};

export async function saveProfile(userId: string, s: ProfileSettings) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: s.displayName,
    phone: s.phone,
    telegram: s.telegram,
    city: s.city,
  });
  if (error) throw error;
}

// ---------- Job applications ----------

export type ApplicationDraft = { applicantName: string; contactInfo: string; message: string };

export class AlreadyAppliedError extends Error {}

export async function applyToJob(userId: string, listingId: string, d: ApplicationDraft) {
  const { error } = await supabase.from("job_applications").insert({
    listing_id: listingId,
    applicant_id: userId,
    applicant_name: d.applicantName,
    contact_info: d.contactInfo,
    message: d.message,
  });
  if (error?.code === "23505") throw new AlreadyAppliedError("already applied");
  if (error) throw error;
}

/** Vacancy ids the user already applied to. */
export const myApplicationsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["my-applications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("job_applications").select("listing_id").eq("applicant_id", userId!);
      if (error) throw error;
      return new Set(data.map((r) => r.listing_id));
    },
  });

/** Applications received on the employer's own vacancies. */
export const receivedApplicationsQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["received-applications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<JobApplication[]> => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("id, listing_id, applicant_name, contact_info, message, created_at, listings!inner(user_id)")
        .eq("listings.user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((r) => ({
        id: r.id,
        listingId: r.listing_id,
        applicantName: r.applicant_name,
        contactInfo: r.contact_info,
        message: r.message,
        createdAt: Date.parse(r.created_at),
      }));
    },
  });
