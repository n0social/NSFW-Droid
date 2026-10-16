import { notFound } from "next/navigation";
import { isAdminSession } from "@/lib/admin-auth";
import { ManualListingClient } from "./ManualListingClient";

export const dynamic = "force-dynamic";

export default async function ManualListingPage() {
  if (!(await isAdminSession())) {
    notFound();
  }
  return <ManualListingClient />;
}
