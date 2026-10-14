import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import {
  userFavorites,
  userProfiles,
  listings,
  type UserPreferences,
  type UserProfile,
} from "@/db/schema";

export async function upsertUserProfileFromSession(
  firebaseUid: string,
  email: string,
): Promise<void> {
  const db = await getDb();
  const now = new Date();
  await db
    .insert(userProfiles)
    .values({
      firebaseUid,
      email,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userProfiles.firebaseUid,
      set: {
        email,
        updatedAt: now,
      },
    });
}

export async function getUserProfile(firebaseUid: string): Promise<UserProfile | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.firebaseUid, firebaseUid))
    .limit(1);
  return row ?? null;
}

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const prefs: UserPreferences = {};
  if (o.theme_preference === "default" || o.theme_preference === "auto") {
    prefs.theme_preference = o.theme_preference;
  }
  if (typeof o.blur_covers === "boolean") {
    prefs.blur_covers = o.blur_covers;
  }
  return prefs;
}

export async function mergeUserPreferences(
  firebaseUid: string,
  patch: UserPreferences,
): Promise<UserProfile | null> {
  const existing = await getUserProfile(firebaseUid);
  if (!existing) return null;
  const merged = { ...parseUserPreferences(existing.preferences), ...patch };
  const db = await getDb();
  const now = new Date();
  const [row] = await db
    .update(userProfiles)
    .set({ preferences: merged, updatedAt: now })
    .where(eq(userProfiles.firebaseUid, firebaseUid))
    .returning();
  return row ?? null;
}

export async function updateUserProfileFields(
  firebaseUid: string,
  fields: {
    displayName?: string | null;
    newsletterOptIn?: boolean;
    preferences?: UserPreferences;
  },
): Promise<UserProfile | null> {
  const existing = await getUserProfile(firebaseUid);
  if (!existing) return null;

  const db = await getDb();
  const now = new Date();
  const set: Partial<typeof userProfiles.$inferInsert> = { updatedAt: now };

  if (fields.displayName !== undefined) {
    set.displayName = fields.displayName;
  }
  if (fields.newsletterOptIn !== undefined) {
    set.newsletterOptIn = fields.newsletterOptIn;
  }
  if (fields.preferences !== undefined) {
    set.preferences = {
      ...parseUserPreferences(existing.preferences),
      ...fields.preferences,
    };
  }

  const [row] = await db
    .update(userProfiles)
    .set(set)
    .where(eq(userProfiles.firebaseUid, firebaseUid))
    .returning();
  return row ?? null;
}

export async function listFavoriteListingIds(firebaseUid: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ listingId: userFavorites.listingId })
    .from(userFavorites)
    .where(eq(userFavorites.firebaseUid, firebaseUid));
  return rows.map((r) => r.listingId);
}

export async function listFavoriteListings(firebaseUid: string) {
  const db = await getDb();
  return db
    .select({
      favorite: userFavorites,
      listing: listings,
    })
    .from(userFavorites)
    .innerJoin(listings, eq(userFavorites.listingId, listings.id))
    .where(eq(userFavorites.firebaseUid, firebaseUid));
}

export async function toggleUserFavorite(
  firebaseUid: string,
  listingId: string,
): Promise<{ favorited: boolean }> {
  const db = await getDb();
  const [existing] = await db
    .select({ listingId: userFavorites.listingId })
    .from(userFavorites)
    .where(
      and(eq(userFavorites.firebaseUid, firebaseUid), eq(userFavorites.listingId, listingId)),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(userFavorites)
      .where(
        and(eq(userFavorites.firebaseUid, firebaseUid), eq(userFavorites.listingId, listingId)),
      );
    return { favorited: false };
  }

  await db.insert(userFavorites).values({ firebaseUid, listingId });
  return { favorited: true };
}

export async function removeUserFavorite(firebaseUid: string, listingId: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(userFavorites)
    .where(
      and(eq(userFavorites.firebaseUid, firebaseUid), eq(userFavorites.listingId, listingId)),
    )
    .returning({ listingId: userFavorites.listingId });
  return deleted.length > 0;
}
