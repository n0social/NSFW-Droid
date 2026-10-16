import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { siteName } from "@/lib/site";

type Props = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

const MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: "You're on the list",
    body: "Thanks for confirming. Watch for our weekly favorite NSFW games — 18+ only.",
  },
  already: {
    title: "Already subscribed",
    body: "This email was already confirmed. You're all set for weekly picks.",
  },
  unsubscribed: {
    title: "Unsubscribed",
    body: "You won't receive weekly emails from us anymore. You can sign up again anytime from the site footer.",
  },
  already_unsubscribed: {
    title: "Already unsubscribed",
    body: "This address was already removed from the list.",
  },
  missing_token: {
    title: "Invalid link",
    body: "This link is missing a token. Use the link from your email or subscribe again from the footer.",
  },
  invalid_token: {
    title: "Invalid or expired link",
    body: "We couldn't verify this link. Try subscribing again from the site footer.",
  },
};

export default async function NewsletterPage({ searchParams }: Props) {
  const ageVerified = await isAgeVerifiedRequest();
  const params = await searchParams;
  const key = params.error ?? params.status ?? "";
  const info = MESSAGES[key] ?? {
    title: "Newsletter",
    body: "Manage your weekly games list from the site footer or links in our emails.",
  };

  return (
    <main className="min-h-screen bg-[#14061C] text-[#FDF4FF]">
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-[#FF4D8D]">{info.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#E9D5FF]/90">{info.body}</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-[44px] items-center rounded-xl bg-gradient-to-r from-[#C026D3] to-[#FF4D8D] px-6 font-bold text-white"
        >
          Back to {siteName}
        </Link>
      </div>
      <SiteFooter ageVerified={ageVerified} />
    </main>
  );
}
