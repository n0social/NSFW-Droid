import { SiteFooter } from "@/components/site/SiteFooter";
import { SubmitGameForm } from "@/components/SubmitGameForm";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";

export const metadata = { title: "Submit your game" };

export default async function SubmitPage() {
  const ageVerified = await isAgeVerifiedRequest();

  return (
    <div className="min-h-screen bg-[#14061C] px-4 py-10 text-[#FFF1F7]">
      <SubmitGameForm />
      <SiteFooter ageVerified={ageVerified} />
    </div>
  );
}
