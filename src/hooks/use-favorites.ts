import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { favoritesQueryOptions, setFavorite } from "@/lib/market-api";

const EMPTY = new Set<string>();

/** The signed-in user's liked listing ids with an optimistic toggle. */
export function useFavorites(onRequireAuth: (reason: string) => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery(favoritesQueryOptions(user?.id));
  const favorites = useMemo(() => (user ? data ?? EMPTY : EMPTY), [user, data]);

  const mutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => setFavorite(user!.id, id, value),
    onMutate: async ({ id, value }) => {
      const key = favoritesQueryOptions(user?.id).queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Set<string>>(key);
      const next = new Set(prev ?? []);
      if (value) next.add(id);
      else next.delete(id);
      queryClient.setQueryData(key, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(favoritesQueryOptions(user?.id).queryKey, ctx?.prev);
      toast.error("Не удалось обновить избранное");
    },
    onSuccess: (_d, { value }) => {
      if (value) toast.success("Добавлено в избранное");
      else toast("Удалено из избранного");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["favorite-listings"] }),
  });

  const toggle = (id: string) => {
    if (!user) return onRequireAuth("Войдите, чтобы сохранять объявления в избранное.");
    mutation.mutate({ id, value: !favorites.has(id) });
  };

  return { favorites, toggle };
}
