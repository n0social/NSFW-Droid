/**
 * DNS checks for droplet Exim DKIM (no secrets).
 * Publish the TXT from `./scripts/print-exim-dkim-dns.sh` on the droplet.
 */
import { promises as dns } from "node:dns";

export type EximDnsCheck = {
  selector: string;
  domain: string;
  dkimHost: string;
  issues: string[];
};

function dkimSelector(): string {
  return process.env.DKIM_SELECTOR?.trim() || "nsfwdroid";
}

function dkimDomain(fromHeader: string): string {
  const angle = /<([^>]+)>$/.exec(fromHeader.trim());
  const email = angle ? angle[1] : fromHeader.trim();
  const at = email.lastIndexOf("@");
  if (at === -1) return process.env.DKIM_DOMAIN?.trim() || "nsfwdroid.com";
  return email.slice(at + 1).toLowerCase();
}

/** Returns human-readable issues before the first live Exim send. */
export async function checkEximDomainDns(fromHeader: string): Promise<EximDnsCheck> {
  const selector = dkimSelector();
  const domain = dkimDomain(fromHeader);
  const dkimHost = `${selector}._domainkey.${domain}`;
  const issues: string[] = [];

  let txtRecords: string[][] = [];
  try {
    txtRecords = await dns.resolveTxt(dkimHost);
  } catch {
    issues.push(
      `No DKIM TXT at ${dkimHost}. On the droplet run ./scripts/print-exim-dkim-dns.sh and publish the record in DNS.`,
    );
    return { selector, domain, dkimHost, issues };
  }

  const flat = txtRecords.map((chunks) => chunks.join("")).join(" ");
  if (!/v=DKIM1/i.test(flat) || !/p=/i.test(flat)) {
    issues.push(
      `DKIM TXT at ${dkimHost} does not look like a valid public key. Re-run print-exim-dkim-dns.sh and fix DNS.`,
    );
  }

  try {
    const rootTxt = await dns.resolveTxt(domain);
    const rootFlat = rootTxt.map((c) => c.join("")).join(" ");
    if (!/v=spf1/i.test(rootFlat)) {
      issues.push(`No SPF TXT on ${domain}. Include the droplet IP in SPF (see newsletter-exim-runbook.md).`);
    }
  } catch {
    issues.push(`Could not read SPF TXT on ${domain}.`);
  }

  return { selector, domain, dkimHost, issues };
}
