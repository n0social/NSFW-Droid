/**
 * Send one newsletter-format test message via the configured transport (Exim sendmail on droplet).
 *
 * Usage:
 *   NEWSLETTER_TRANSPORT=sendmail tsx scripts/send-newsletter-test.ts --to you@example.com
 */
import "dotenv/config";
import { newsletterFromAddress } from "../src/lib/newsletter/config";
import { checkLocalMailDns } from "../src/lib/newsletter/local-dns";
import { newsletterTransport, sendNewsletterEmail } from "../src/lib/newsletter/send";

async function main() {
  const toArg = process.argv.find((a) => a.startsWith("--to="))?.slice(5);
  const toIdx = process.argv.indexOf("--to");
  const to = (toArg ?? (toIdx >= 0 ? process.argv[toIdx + 1] : "")).trim();
  if (!to || !to.includes("@")) {
    console.error("Usage: tsx scripts/send-newsletter-test.ts --to you@example.com");
    process.exit(1);
  }

  const transport = newsletterTransport();
  const from = newsletterFromAddress();
  console.log(JSON.stringify({ transport, from, to }, null, 2));

  if (transport === "sendmail") {
    const dns = await checkLocalMailDns(from);
    if (dns.issues.length) {
      console.error("DNS issues:", dns.issues.join(" | "));
      process.exit(1);
    }
    if (dns.warnings.length) {
      console.warn("DNS warnings:", dns.warnings.join(" | "));
    }
  }

  const result = await sendNewsletterEmail({
    to,
    subject: "NSFW Droid mail test",
    html: "<p>If you received this, Exim delivery from the droplet is working.</p>",
    text: "If you received this, Exim delivery from the droplet is working.",
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
