import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { isFirebaseAnalyticsEnabled } from "@/lib/firebase/config";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { siteName, siteUrl } from "@/lib/site";
import { themeToCssVariables } from "@/lib/themes/css-vars";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { isSignedIn } from "@/lib/user-session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — 18+ game catalog`,
    template: `%s · ${siteName}`,
  },
  description:
    "Browse mature games on itch.io, Steam, and partner stores. Outbound links only — purchases on official storefronts.",
  openGraph: {
    title: siteName,
    description: "18+ game catalog with age gate and curated listings.",
    url: siteUrl,
    siteName,
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { active, scheduled } = await resolveThemeForRequest();
  const signedIn = await isSignedIn();
  const themeStyle = themeToCssVariables(active.colors);
  const useFirebaseAnalytics = isFirebaseAnalyticsEnabled();

  return (
    <html lang="en" data-theme={active.id} style={themeStyle}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {!useFirebaseAnalytics && <GoogleAnalytics />}
        <FirebaseProvider>
        <AuthProvider>
          <ThemeProvider
            activeThemeId={active.id}
            activeThemeName={active.name}
            scheduledThemeId={scheduled.id}
            isSignedIn={signedIn}
          />
          {children}
        </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
