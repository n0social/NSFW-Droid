import { siteUrl } from "@/lib/site";

export type AdminHostLocations = {
  /** Origin of the public catalog, no trailing slash (`https://www.nsfwdroid.com`). */
  publicBase: string;
  /** Origin of the admin portal, no trailing slash (`https://admin.nsfwdroid.com`). */
  adminBase: string;
  /** Host header value for the public site, port included when non-default. */
  publicHost: string;
  /** Host header value for the admin portal. */
  adminHost: string;
};

export type HostRedirect = {
  location: string;
  status: 307 | 308;
};

type HostEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  ADMIN_HOST?: string;
};

function splitHost(host: string): { hostname: string; port: string } {
  const trimmed = host.trim().toLowerCase().replace(/\.$/, "");
  const colon = trimmed.lastIndexOf(":");
  if (colon > 0 && /^\d+$/.test(trimmed.slice(colon + 1))) {
    return { hostname: trimmed.slice(0, colon), port: trimmed.slice(colon + 1) };
  }
  return { hostname: trimmed, port: "" };
}

/** True when the request host is the configured site, ignoring a missing port on either side. */
export function hostsMatch(requestHost: string, configuredHost: string): boolean {
  const request = splitHost(requestHost);
  const configured = splitHost(configuredHost);
  if (!request.hostname || request.hostname !== configured.hostname) return false;
  if (!request.port || !configured.port) return true;
  return request.port === configured.port;
}

export function isConfiguredAdminHost(
  hostHeader: string | null | undefined,
  locations: AdminHostLocations,
): boolean {
  if (!hostHeader) return false;
  return hostsMatch(hostHeader, locations.adminHost);
}

export function isAdminAppPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

/** Static files the admin UI loads. Catalog HTML is not included. */
export function isAdminStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/apple-icon.png" ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/icons/")
  );
}

function safePath(pathname: string): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\")) {
    return "/";
  }
  return pathname;
}

function safeSearch(search: string): string {
  if (!search || search === "?") return "";
  if (!search.startsWith("?") || search.includes("\n") || search.includes("\r")) return "";
  return search;
}

/**
 * Public catalog stays on `www` (or local `localhost`). Admin UI and `/api/admin/*`
 * live on `admin.nsfwdroid.com`, `admin.localhost`, or `ADMIN_HOST`.
 */
export function resolveAdminHostLocations(env?: HostEnv): AdminHostLocations {
  const source = env ?? {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    ADMIN_HOST: process.env.ADMIN_HOST,
  };
  const rawSite = (source.NEXT_PUBLIC_SITE_URL || siteUrl).replace(/\/$/, "");
  const publicUrl = new URL(rawSite.includes("://") ? rawSite : `https://${rawSite}`);
  const publicBase = `${publicUrl.protocol}//${publicUrl.host}`;
  const publicHost = publicUrl.host;

  const explicit = source.ADMIN_HOST?.trim();
  if (explicit) {
    const withProto = explicit.includes("://") ? explicit : `${publicUrl.protocol}//${explicit}`;
    const adminUrl = new URL(withProto);
    if (!adminUrl.port && publicUrl.port) {
      adminUrl.port = publicUrl.port;
    }
    return {
      publicBase,
      publicHost,
      adminBase: `${adminUrl.protocol}//${adminUrl.host}`,
      adminHost: adminUrl.host,
    };
  }

  const hostname = publicUrl.hostname.toLowerCase();
  if (hostname === "www.nsfwdroid.com" || hostname === "nsfwdroid.com") {
    return {
      publicBase,
      publicHost,
      adminBase: "https://admin.nsfwdroid.com",
      adminHost: "admin.nsfwdroid.com",
    };
  }

  const port = publicUrl.port ? `:${publicUrl.port}` : "";
  const protocol = publicUrl.protocol === "https:" ? "https:" : "http:";
  return {
    publicBase,
    publicHost,
    adminBase: `${protocol}//admin.localhost${port}`,
    adminHost: `admin.localhost${port}`,
  };
}

/**
 * Host split for the admin portal.
 * Returns null when the request should stay on this host (canonical apex → www is separate).
 */
export function hostRedirectForRequest(
  hostHeader: string | null | undefined,
  pathname: string,
  search: string,
  locations: AdminHostLocations = resolveAdminHostLocations(),
): HostRedirect | null {
  if (!hostHeader) return null;
  const path = safePath(pathname);
  const query = safeSearch(search);
  const onAdmin = hostsMatch(hostHeader, locations.adminHost);

  if (onAdmin) {
    if (path === "/") {
      return { location: `${locations.adminBase}/admin${query}`, status: 308 };
    }
    if (isAdminAppPath(path) || isAdminStaticAsset(path)) return null;
    return { location: `${locations.publicBase}${path}${query}`, status: 307 };
  }

  if (isAdminAppPath(path)) {
    return { location: `${locations.adminBase}${path}${query}`, status: 308 };
  }

  return null;
}
