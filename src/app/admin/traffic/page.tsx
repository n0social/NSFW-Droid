import { redirect } from "next/navigation";
import { AdminTraffic } from "@/components/AdminTraffic";
import { isAdminSession } from "@/lib/admin-auth";

export default async function AdminTrafficPage() {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }
  return <AdminTraffic />;
}
