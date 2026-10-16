/**
 * Lightweight DNS checks for Brevo (Sendinblue) deliverability (no secrets).
 * Publish the records from Brevo → Senders, Domains & Dedicated IPs → Domains.
 */
export type BrevoDnsCheck = {
  domain: string;
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

/** Returns human-readable issues before the first live Brevo send. */
export async function checkBrevoDomainDns(fromHeader: string): Promise<BrevoDnsCheck> {
  const domain = parseDomainFromFromHeader(fromHeader);
  if (!domain) {
    return { domain: "unknown", issues: ["Could not parse domain from From address."], warnings: [] };
  }

  const issues: string[] = [];
  const warnings: string[] = [];

  const rootTxtChunks = await dnsTxt(domain);
  const rootTxtFlat = rootTxtChunks.map((parts) => parts.join("")).join(" ");

  const hasBrevoCode = /brevo-code:/i.test(rootTxtFlat);
  const hasBrevoSpf =
    /include:spf\.brevo\.com/i.test(rootTxtFlat) ||
    /include:sendinblue\.com/i.test(rootTxtFlat);

  if (!hasBrevoCode) {
    warnings.push(
      `No brevo-code TXT on ${domain}. Add the Brevo domain verification code from the dashboard (Senders & Domains → Domains → Authenticate).`,
    );
  }

  if (!/v=spf1/i.test(rootTxtFlat)) {
    warnings.push(
      `No SPF TXT on ${domain}. Brevo recommends v=spf1 include:spf.brevo.com ~all (merge with existing SPF if you already have one).`,
    );
  } else if (!hasBrevoSpf) {
    issues.push(
      `SPF on ${domain} does not include spf.brevo.com (or legacy sendinblue.com). Update SPF per Brevo domain setup.`,
    );
  }

  const dkimHost = `mail._domainkey.${domain}`;
  const dkimTxt = await dnsTxt(dkimHost);
  if (!dkimTxt.length) {
    issues.push(
      `Missing Brevo DKIM TXT at ${dkimHost}. Copy the DKIM record from the Brevo domain authentication page.`,
    );
  }

  const sendSubdomain = `send.${domain}`;
  const sendCnames = await dnsCname(sendSubdomain);
  if (sendCnames.some((c) => /forge\.rmta\.net/i.test(c))) {
    warnings.push(
      `${sendSubdomain} still CNAMEs to Forge (${sendCnames.join(", ")}). Brevo does not use that host; safe to leave for other mail, but remove Resend-specific records if you are fully off Resend.`,
    );
  }

  return { domain, issues, warnings };
}
