/**
 * Lightweight DNS checks for Resend deliverability (no secrets).
 * Resend uses `send.<domain>` as the default MAIL FROM / return-path subdomain.
 */
export type ResendDnsCheck = {
  domain: string;
  sendSubdomain: string;
  issues: string[];
  warnings: string[];
};

function parseDomainFromFromHeader(from: string): string | null {
  const trimmed = from.trim();
  const angle = /<([^>]+)>$/.exec(trimmed);
  const email = (angle ? angle[1] : trimmed).trim();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return email.slice(at + 1).toLowerCase();
}

async function dnsTxt(host: string): Promise<string[][]> {
  const { Resolver } = await import("node:dns/promises");
  const resolver = new Resolver();
  try {
    return await resolver.resolveTxt(host);
  } catch {
    return [];
  }
}

async function dnsCname(host: string): Promise<string[]> {
  const { Resolver } = await import("node:dns/promises");
  const resolver = new Resolver();
  try {
    return await resolver.resolveCname(host);
  } catch {
    return [];
  }
}

/** Returns human-readable issues that often cause Gmail to drop mail after Resend accepts the API call. */
export async function checkResendMailFromDns(fromHeader: string): Promise<ResendDnsCheck> {
  const domain = parseDomainFromFromHeader(fromHeader);
  if (!domain || domain === "resend.dev") {
    return { domain: domain ?? "unknown", sendSubdomain: "", issues: [], warnings: [] };
  }

  const sendSubdomain = `send.${domain}`;
  const issues: string[] = [];
  const warnings: string[] = [];

  const cnames = await dnsCname(sendSubdomain);
  const txtChunks = await dnsTxt(sendSubdomain);
  const txtFlat = txtChunks.map((parts) => parts.join("")).join(" ");

  const pointsToForge = cnames.some((c) => /forge\.rmta\.net/i.test(c));
  const hasAmazonsesSpf = /include:amazonses\.com/i.test(txtFlat);

  if (pointsToForge) {
    issues.push(
      `${sendSubdomain} is a CNAME to ${cnames.join(", ")} (not Resend). Resend needs its own MAIL FROM records on an unused subdomain — use Resend “Custom return path” (e.g. resend-mail.${domain}) or free ${sendSubdomain} for Resend.`,
    );
  } else if (txtFlat && !hasAmazonsesSpf) {
    warnings.push(
      `${sendSubdomain} TXT exists but does not include amazonses.com — confirm Resend domain DNS matches the dashboard.`,
    );
  } else if (!txtFlat && !cnames.length) {
    warnings.push(
      `No DNS records found for ${sendSubdomain}. If the domain is verified in Resend, add the send-subdomain TXT/MX records from the Resend dashboard.`,
    );
  }

  const dkimHost = `resend._domainkey.${domain}`;
  const dkimTxt = await dnsTxt(dkimHost);
  if (!dkimTxt.length) {
    issues.push(`Missing Resend DKIM TXT at ${dkimHost}.`);
  }

  return { domain, sendSubdomain, issues, warnings };
}
