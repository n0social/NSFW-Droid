/**
 * DNS checks for mail sent by Exim on the droplet (no vendor API).
 * Selector matches deploy/setup-local-mail.sh.
 */
export const LOCAL_MAIL_DKIM_SELECTOR = "nsfwdroid";
export const LOCAL_MAIL_HOST_LABEL = "mail";

export type LocalMailDnsCheck = {
  domain: string;
  issues: string[];
  warnings: string[];
};

function domainFromFromHeader(from: string): string | null {
  const trimmed = from.trim();
  const angle = /<([^>]+)>$/.exec(trimmed);
  const email = (angle ? angle[1] : trimmed).trim();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return email.slice(at + 1).toLowerCase();
}

async function resolver() {
  const { Resolver } = await import("node:dns/promises");
  return new Resolver();
}

export async function checkLocalMailDns(fromHeader: string): Promise<LocalMailDnsCheck> {
  const domain = domainFromFromHeader(fromHeader);
  const issues: string[] = [];
  const warnings: string[] = [];
  if (!domain) {
    return { domain: "", issues: ["From address has no domain"], warnings };
  }

  const dns = await resolver();
  const mailHost = `${LOCAL_MAIL_HOST_LABEL}.${domain}`;

  let mailIps: string[] = [];
  try {
    mailIps = await dns.resolve4(mailHost);
  } catch {
    issues.push(`${mailHost} has no A record (droplet public IP)`);
  }

  let spf = "";
  try {
    const txt = await dns.resolveTxt(domain);
    spf = txt.map((parts) => parts.join("")).find((row) => row.toLowerCase().startsWith("v=spf1")) ?? "";
  } catch {
    spf = "";
  }
  if (!spf) {
    issues.push(`${domain} has no SPF TXT record`);
  } else if (mailIps.length && !mailIps.some((ip) => spf.includes(`ip4:${ip}`))) {
    issues.push(`SPF for ${domain} does not include ip4:${mailIps[0]}`);
  }

  const dkimHost = `${LOCAL_MAIL_DKIM_SELECTOR}._domainkey.${domain}`;
  let dkim = "";
  try {
    const txt = await dns.resolveTxt(dkimHost);
    dkim = txt.map((parts) => parts.join("")).join("");
  } catch {
    dkim = "";
  }
  if (!dkim.includes("v=DKIM1") || !dkim.includes("p=")) {
    issues.push(`${dkimHost} is missing a DKIM TXT record`);
  }

  try {
    const dmarcTxt = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarc = dmarcTxt.map((parts) => parts.join("")).join("");
    if (!dmarc.toLowerCase().startsWith("v=dmarc1")) {
      warnings.push(`_dmarc.${domain} is not a DMARC record`);
    }
  } catch {
    warnings.push(`_dmarc.${domain} is not published`);
  }

  if (mailIps.length) {
    try {
      const ptrHosts = await dns.reverse(mailIps[0]);
      const want = mailHost.toLowerCase();
      const ok = ptrHosts.some(
        (h) => h.toLowerCase() === want || h.toLowerCase().endsWith(`.${want}`),
      );
      if (!ok) {
        warnings.push(
          `PTR for ${mailIps[0]} is ${ptrHosts.join(", ") || "missing"} (DigitalOcean should set rDNS to ${mailHost})`,
        );
      }
    } catch {
      warnings.push(
        `No PTR for ${mailIps[0]} (ask DigitalOcean for rDNS → ${mailHost} when unblocking port 25)`,
      );
    }
  }

  return { domain, issues, warnings };
}
