<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Marketplace data lives in `src/lib/listings.ts` (types, mock data, filter/sort, ₸ formatting) and UI in `src/components/market/`; keep business rules there so they stay unit-testable.
- Listings, favorites, profiles and photos live in Lovable Cloud. Public listing reads go through the `listListings` server function (publishable key, RLS) so the feed SSRs; writes (post, delete, favorite, uploads) use the browser client in `src/lib/market-api.ts` under RLS.
- The `listing-images` bucket is private (workspace blocks public buckets); images are stored as paths and served via signed URLs rewritten to the browser-reachable backend URL.
- Auth state comes from `AuthProvider` (`src/hooks/use-auth.tsx`), the single `onAuthStateChange` subscriber; posting and favorites require sign-in.
- Render posting dates only after hydration (see `RelativeDate`): server and browser time zones differ.
