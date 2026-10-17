/**
 * Verify newsletter DNS for the active transport (Exim on droplet or Brevo).
 *
 * Usage: tsx scripts/check-newsletter-dns.ts
 */
import "dotenv/config";
import { newsletterFromAddress } from "../src/lib/newsletter/config";
import { checkBrevoDomainDns } from "../src/lib/newsletter/brevo-dns";
import { checkLocalMailDns } from "../src/lib/newsletter/local-dns";
import { newsletterTransport } from "../src/lib/newsletter/send";

async function main() {
  const from = newsletterFromAddress();
  const transport = newsletterTransport();
  const result =
    transport === "sendmail" ? await checkLocalMailDns(from) : await checkBrevoDomainDns(from);
  console.log(JSON.stringify({ from, transport, ...result }, null, 2));
  if (result.issues.length) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
