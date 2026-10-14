import { cookies } from "next/headers";
import { Storefront } from "@/components/Storefront";
import {
  AGE_VERIFIED_COOKIE,
  BLUR_COVERS_COOKIE,
  parseAgeVerified,
  parseBlurCovers,
} from "@/lib/cookies";
import { getListingsForStorefront } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const jar = await cookies();
  const ageVerified = parseAgeVerified(jar.get(AGE_VERIFIED_COOKIE)?.value);
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  let data: Awaited<ReturnType<typeof getListingsForStorefront>> = {
    topGrossing: [],
    newReleases: [],
    all: [],
  };
  try {
    data = await getListingsForStorefront();
  } catch {
    /* DB not up — empty state */
  }

  return (
    <div className="min-h-screen bg-[#14061C] text-[#FFF1F7]">
      <Storefront
        ageVerified={ageVerified}
        blurCovers={blurCovers}
        topGrossing={data.topGrossing}
        newReleases={data.newReleases}
      />
    </div>
  );
}
