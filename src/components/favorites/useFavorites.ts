"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "firebase/auth";

export function useFavorites(user: User | null) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/account/favorites")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.listing_ids) return;
        setIds(new Set(data.listing_ids as string[]));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleFavorite = useCallback(async (listingId: string) => {
    const res = await fetch("/api/account/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listing_id: listingId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setIds((prev) => {
      const next = new Set(prev);
      if (data.favorited) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
  }, []);

  return { favoriteIds: ids, favoritesLoading: loading, toggleFavorite };
}
