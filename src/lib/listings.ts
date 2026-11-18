export type Mode = "goods" | "jobs";
export type SortKey = "new" | "cheap" | "expensive";

export const CITIES = ["Караганда", "Астана", "Алматы", "Шымкент"] as const;
export const ALL_CITIES = "Все города";

export const GOODS_CATEGORIES = [
  "Электроника",
  "Услуги",
  "Учеба и книги",
  "Недвижимость",
  "Спорт и хобби",
] as const;

export const JOB_CATEGORIES = ["Подработка", "Полный день", "Удаленка", "Стажировка"] as const;

export type ListingStatus = "active" | "archived";

export type Listing = {
  id: string;
  /** "archived" = sold / vacancy closed; only the owner sees it */
  status?: ListingStatus | undefined;
  /** Author's account id; null for demo listings */
  userId?: string | null | undefined;
  mode: Mode;
  title: string;
  category: string;
  city: string;
  /** Price for goods, lower salary bound for jobs. null = договорная */
  price: number | null;
  /** Upper salary bound for jobs */
  priceMax?: number | null | undefined;
  priceFrom?: boolean | undefined;
  priceSuffix?: string | undefined;
  description: string;
  images: string[];
  createdAt: number;
  seller: {
    name: string;
    type: string;
    since: string;
    rating?: number | undefined;
  };
  phone: string;
  telegram?: string | undefined;
  /** Raw storage paths of images (for cleanup on delete) */
  imagePaths?: string[] | undefined;
  company?: string | undefined;
  schedule?: string | undefined;
};


export function formatTenge(value: number): string {
  const grouped = String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${grouped}\u00A0₸`;
}

export function formatPrice(l: Pick<Listing, "price" | "priceMax" | "priceFrom" | "priceSuffix">): string {
  if (l.price == null && l.priceMax == null) return "Договорная";
  const suffix = l.priceSuffix ? ` ${l.priceSuffix}` : "";
  if (l.price != null && l.priceMax != null && l.priceMax !== l.price) {
    const grouped = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
    return `${grouped(l.price)}–${formatTenge(l.priceMax)}${suffix}`;
  }
  if (l.price == null && l.priceMax != null) return `до ${formatTenge(l.priceMax)}${suffix}`;
  return `${l.priceFrom ? "от " : ""}${formatTenge(l.price as number)}${suffix}`;
}

export type ListingRow = {
  id: string;
  user_id: string | null;
  mode: string;
  title: string;
  category: string;
  city: string;
  price: number | null;
  price_max: number | null;
  price_from: boolean;
  price_suffix: string | null;
  description: string;
  images: string[];
  phone: string;
  telegram: string | null;
  company: string | null;
  schedule: string | null;
  seller_name: string;
  seller_type: string;
  seller_since: string | null;
  seller_rating: number | null;
  created_at: string;
  status?: string | null | undefined;
};

/** Converts a database row into the app's Listing shape. `resolveImage` turns a storage path into a viewable URL. */
export function rowToListing(row: ListingRow, resolveImage: (path: string) => string | undefined): Listing {
  return {
    id: row.id,
    status: row.status === "archived" ? "archived" : "active",
    userId: row.user_id,
    mode: row.mode === "jobs" ? "jobs" : "goods",
    title: row.title,
    category: row.category,
    city: row.city,
    price: row.price,
    priceMax: row.price_max,
    priceFrom: row.price_from,
    priceSuffix: row.price_suffix ?? undefined,
    description: row.description,
    images: row.images.map(resolveImage).filter((u): u is string => !!u),
    imagePaths: row.images,
    createdAt: Date.parse(row.created_at),
    seller: {
      name: row.seller_name,
      type: row.seller_type,
      since: row.seller_since ?? "",
      rating: row.seller_rating ?? undefined,
    },
    phone: row.phone,
    telegram: row.telegram ?? undefined,
    company: row.company ?? undefined,
    schedule: row.schedule ?? undefined,
  };
}

export type Filters = {
  mode: Mode;
  city: string;
  category: string | null;
  query: string;
  priceFrom: number | null;
  priceTo: number | null;
  sort: SortKey;
  onlyIds?: Set<string> | null | undefined;
  ownerId?: string | null | undefined;
};

/** Value used for price filtering & sorting: for salary ranges, the upper bound counts. */
export function comparablePrice(l: Listing): number | null {
  return l.priceMax ?? l.price;
}

export function filterListings(items: Listing[], f: Filters): Listing[] {
  const q = f.query.trim().toLowerCase();
  const result = items.filter((l) => {
    if (l.mode !== f.mode) return false;
    if (f.onlyIds && !f.onlyIds.has(l.id)) return false;
    if (f.ownerId && l.userId !== f.ownerId) return false;
    if (f.city !== ALL_CITIES && l.city !== f.city) return false;
    if (f.category && l.category !== f.category) return false;
    if (q) {
      const hay = `${l.title} ${l.description} ${l.category} ${l.company ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    const low = l.price ?? l.priceMax;
    const high = l.priceMax ?? l.price;
    if (f.priceFrom != null && (high == null || high < f.priceFrom)) return false;
    if (f.priceTo != null && (low == null || low > f.priceTo)) return false;
    return true;
  });

  return result.sort((a, b) => {
    if (f.sort === "new") return b.createdAt - a.createdAt;
    const pa = comparablePrice(a);
    const pb = comparablePrice(b);
    // Listings without a price always go last
    if (pa == null && pb == null) return b.createdAt - a.createdAt;
    if (pa == null) return 1;
    if (pb == null) return -1;
    return f.sort === "cheap" ? pa - pb : pb - pa;
  });
}


// ---------- Contacts ----------

/** Digits for wa.me in international format; Kazakh numbers starting with 8 become 7. null if too short. */
export function whatsappPhone(phone: string): string | null {
  let d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = `7${d.slice(1)}`;
  else if (d.length === 10) d = `7${d}`;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

export function whatsappLink(phone: string, listing: Pick<Listing, "title" | "price" | "priceMax" | "priceFrom" | "priceSuffix">): string | null {
  const d = whatsappPhone(phone);
  if (!d) return null;
  const text = `Здравствуйте! Пишу по вашему объявлению «${listing.title}» (${formatPrice(listing)}) на Сауда. Оно еще актуально?`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

/** Accepts "@name", "name" or a t.me link. Returns the bare username, or null if it is not a valid Telegram username. */
export function normalizeTelegram(input: string | null | undefined): string | null {
  const v = (input ?? "")
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
  return /^[A-Za-z0-9_]{5,32}$/.test(v) ? v : null;
}

export function telegramLink(username: string | null | undefined): string | null {
  const u = normalizeTelegram(username);
  return u ? `https://t.me/${u}` : null;
}

/** Turns a free-form applicant contact ("+7 701…" or "@nick") into clickable links. */
export function contactLinks(contact: string): { tel: string | null; whatsapp: string | null; telegram: string | null } {
  const hasLetters = /[A-Za-z]/.test(contact);
  const phone = hasLetters ? null : whatsappPhone(contact);
  return {
    tel: phone ? `tel:+${phone}` : null,
    whatsapp: phone ? `https://wa.me/${phone}` : null,
    telegram: hasLetters ? telegramLink(contact) : null,
  };
}

// ---------- Job applications ----------

export type JobApplication = {
  id: string;
  listingId: string;
  applicantName: string;
  contactInfo: string;
  message: string;
  createdAt: number;
};

/** Groups applications under the employer's vacancies: vacancies with the newest applications first, empty ones last. */
export function groupApplications(vacancies: Listing[], applications: JobApplication[]) {
  const byListing = new Map<string, JobApplication[]>();
  for (const a of applications) {
    const list = byListing.get(a.listingId) ?? [];
    list.push(a);
    byListing.set(a.listingId, list);
  }
  return vacancies
    .filter((v) => v.mode === "jobs")
    .map((listing) => ({
      listing,
      applications: (byListing.get(listing.id) ?? []).sort((a, b) => b.createdAt - a.createdAt),
    }))
    .sort((a, b) => {
      const la = a.applications[0]?.createdAt ?? -1;
      const lb = b.applications[0]?.createdAt ?? -1;
      if (la !== lb) return lb - la;
      return b.listing.createdAt - a.listing.createdAt;
    });
}

/** Russian plural: pluralRu(5, ["отклик", "отклика", "откликов"]) → "5 откликов". */
export function pluralRu(n: number, forms: readonly [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  const f = m10 === 1 && m100 !== 11 ? forms[0] : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? forms[1] : forms[2];
  return `${n} ${f}`;
}
