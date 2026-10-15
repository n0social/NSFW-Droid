"use client";

import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";

/** Footer for client-only pages that cannot read the httpOnly age cookie. */
export function SiteFooterClient() {
  const [ageVerified, setAgeVerified] = useState(false);

  useEffect(() => {
    void fetch("/api/age-verified", { credentials: "include" })
      .then((res) => res.json())
      .then((body: { ok?: boolean }) => setAgeVerified(Boolean(body?.ok)))
      .catch(() => setAgeVerified(false));
  }, []);

  return <SiteFooter ageVerified={ageVerified} />;
}
