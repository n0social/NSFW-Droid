import { notFound } from "next/navigation";
import { AdminQueue } from "@/components/AdminQueue";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  if (!(await isAdminSession())) {
    notFound();
  }
  return <AdminQueue />;
}
