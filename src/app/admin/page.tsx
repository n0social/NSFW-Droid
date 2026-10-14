import { redirect } from "next/navigation";
import { AdminQueue } from "@/components/AdminQueue";
import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }
  return <AdminQueue />;
}
