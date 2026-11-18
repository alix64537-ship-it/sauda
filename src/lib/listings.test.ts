import { describe, expect, it } from "vitest";
import { ALL_CITIES, filterListings, formatPrice, formatTenge, rowToListing, type Filters, type ListingRow } from "./listings";
import { MOCK_LISTINGS } from "./listings.fixtures";

const base: Filters = {
  mode: "goods",
  city: ALL_CITIES,
  category: null,
  query: "",
  priceFrom: null,
  priceTo: null,
  sort: "new",
};

describe("formatTenge", () => {
  it("groups thousands and adds ₸", () => {
    expect(formatTenge(420000).replace(/\u00A0/g, " ")).toBe("420 000 ₸");
  });
});

describe("formatPrice", () => {
  it("shows salary range", () => {
    expect(formatPrice({ price: 250000, priceMax: 400000, priceSuffix: "/ мес" }).replace(/\u00A0/g, " ")).toBe(
      "250 000–400 000 ₸ / мес",
    );
  });
  it("shows Договорная without price", () => {
    expect(formatPrice({ price: null })).toBe("Договорная");
  });
});

describe("filterListings", () => {
  it("has 6 goods and 6 jobs", () => {
    expect(filterListings(MOCK_LISTINGS, base)).toHaveLength(6);
    expect(filterListings(MOCK_LISTINGS, { ...base, mode: "jobs" })).toHaveLength(6);
  });
  it("filters by city", () => {
    const r = filterListings(MOCK_LISTINGS, { ...base, city: "Караганда" });
    expect(r.every((l) => l.city === "Караганда")).toBe(true);
    expect(r).toHaveLength(2);
  });
  it("sorts cheaper first", () => {
    const r = filterListings(MOCK_LISTINGS, { ...base, sort: "cheap" });
    expect(r[0]?.price).toBe(12000);
    expect(r.at(-1)?.price).toBe(420000);
  });
  it("applies price range От / До", () => {
    const r = filterListings(MOCK_LISTINGS, { ...base, priceFrom: 100000, priceTo: 300000 });
    expect(r.map((l) => l.id).sort()).toEqual(["g2", "g6"]);
  });
});

describe("ownership", () => {
  it("'Мои объявления' shows only the signed-in user's listings", () => {
    const mine = { ...MOCK_LISTINGS[0]!, id: "x1", userId: "user-a" };
    const theirs = { ...MOCK_LISTINGS[1]!, id: "x2", userId: "user-b" };
    const r = filterListings([mine, theirs], { ...base, ownerId: "user-a" });
    expect(r.map((l) => l.id)).toEqual(["x1"]);
  });
});

describe("rowToListing", () => {
  it("maps a database row and resolves image paths", () => {
    const row: ListingRow = {
      id: "1", user_id: null, mode: "jobs", title: "Бариста", category: "Полный день", city: "Астана",
      price: 220000, price_max: 300000, price_from: false, price_suffix: "/ мес", description: "…",
      images: ["demo/a.jpg"], phone: "+7 700", telegram: null, company: "Coffee", schedule: null,
      seller_name: "Coffee", seller_type: "Работодатель", seller_since: null, seller_rating: null,
      created_at: "2026-11-16T10:00:00Z",
    };
    const l = rowToListing(row, (p) => `https://cdn/${p}`);
    expect(l.mode).toBe("jobs");
    expect(l.images).toEqual(["https://cdn/demo/a.jpg"]);
    expect(l.createdAt).toBe(Date.parse("2026-11-16T10:00:00Z"));
  });
});
