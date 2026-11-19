import type { Metadata } from "next";
import { AgeGate } from "@/components/AgeGate";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Are you over 18?",
};

/** Shown in place of the catalog until the in-house age gate sets age_verified. */
export default function AgeWallPage() {
  return (
    <main className="min-h-screen bg-[#14061C]">
      <AgeGate open />
    </main>
  );
}
