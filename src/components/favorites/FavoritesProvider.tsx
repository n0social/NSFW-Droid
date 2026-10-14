"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFavorites } from "@/components/favorites/useFavorites";

type FavoritesContextValue = ReturnType<typeof useFavorites>;

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useFavorites(user);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavoritesContext(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavoritesContext must be used within FavoritesProvider");
  }
  return ctx;
}
