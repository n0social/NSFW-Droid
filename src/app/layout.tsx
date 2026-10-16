import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { isFirebaseAnalyticsEnabled } from "@/lib/firebase/config";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { siteName, siteUrl } from "@/lib/site";
import { themeToCssVariables } from "@/lib/themes/css-vars";
import { resolveThemeForRequest } from "@/lib/themes/preferences";
import { CookieNoticeBar } from "@/components/site/CookieNoticeBar";
import { MaintenanceNoticeBanner } from "@/components/site/MaintenanceNoticeBanner";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  verification: {
    google: "BXBbvduSwlB899d8SScucuK5H8FtDBNT9zz7wOtj9lM",
    other: {
      "6a97888e-site-verification": "8bb54aacf7c0714b30d3348ce1f1092c",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#14061C",
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
        <MaintenanceNoticeBanner />
        {!useFirebaseAnalytics && <GoogleAnalytics />}
        <FirebaseProvider>
        <AuthProvider>
          <FavoritesProvider>
          <ThemeProvider
            activeThemeId={active.id}
            activeThemeName={active.name}
            scheduledThemeId={scheduled.id}
            isSignedIn={signedIn}
          />
          {children}
          <CookieNoticeBar />
          </FavoritesProvider>
        </AuthProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
