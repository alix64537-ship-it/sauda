import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rowToListing, type Listing } from "./listings";

export const LISTING_IMAGES_BUCKET = "listing-images";
const SIGNED_URL_TTL = 60 * 60 * 6; // 6 hours

/** Public, read-only: everyone can browse listings. Uses the publishable key with RLS. */
export const listListings = createServerFn({ method: "GET" }).handler(async (): Promise<Listing[]> => {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);

  const paths = Array.from(new Set(data.flatMap((r) => r.images)));
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(LISTING_IMAGES_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    // Signed links must point at the browser-reachable backend address.
    const browserBase = (import.meta.env["VITE_SUPABASE_URL"] as string).replace(/\/+$/, "");
    for (const s of signed ?? []) {
      if (!s.signedUrl || !s.path) continue;
      const idx = s.signedUrl.indexOf("/storage/v1/");
      urlByPath.set(s.path, idx >= 0 ? browserBase + s.signedUrl.slice(idx) : s.signedUrl);
    }
  }

  return data.map((row) => rowToListing(row, (p) => urlByPath.get(p)));
});
