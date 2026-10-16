import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) {
    notFound();
  }
  return <AdminDashboard />;
}
