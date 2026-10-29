import { redirect } from "next/navigation";
import { AdminSearch } from "@/components/AdminSearch";
import { isAdminSession } from "@/lib/admin-auth";

export default async function AdminSearchPage() {
  if (!(await isAdminSession())) {
    redirect("/admin/login");
  }
  return <AdminSearch />;
}
