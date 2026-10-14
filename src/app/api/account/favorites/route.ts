import { NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/account-auth";
import {
  listFavoriteListingIds,
  listFavoriteListings,
  removeUserFavorite,
  toggleUserFavorite,
} from "@/lib/user-profile";

export async function GET(request: Request) {
  const uidOrRes = await requireSessionUserId();
  if (uidOrRes instanceof NextResponse) return uidOrRes;

  const url = new URL(request.url);
  const withListings = url.searchParams.get("listings") === "1";

  if (withListings) {
    const rows = await listFavoriteListings(uidOrRes);
    return NextResponse.json({
      ok: true,
      favorites: rows.map((r) => ({
        listing_id: r.listing.id,
        created_at: r.favorite.createdAt,
        listing: r.listing,
      })),
    });
  }

  const ids = await listFavoriteListingIds(uidOrRes);
  return NextResponse.json({ ok: true, listing_ids: ids });
}

export async function POST(request: Request) {
  const uidOrRes = await requireSessionUserId();
  if (uidOrRes instanceof NextResponse) return uidOrRes;

  const body = await request.json().catch(() => ({}));
  const listingId = String(body.listing_id ?? "");
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "missing_listing_id" }, { status: 400 });
  }

  const result = await toggleUserFavorite(uidOrRes, listingId);
  return NextResponse.json({ ok: true, listing_id: listingId, ...result });
}

export async function DELETE(request: Request) {
  const uidOrRes = await requireSessionUserId();
  if (uidOrRes instanceof NextResponse) return uidOrRes;

  const url = new URL(request.url);
  const listingId = url.searchParams.get("listing_id") ?? "";
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "missing_listing_id" }, { status: 400 });
  }

  const removed = await removeUserFavorite(uidOrRes, listingId);
  return NextResponse.json({ ok: true, listing_id: listingId, removed });
}
