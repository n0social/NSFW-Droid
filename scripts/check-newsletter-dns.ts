/**
 * Verify Exim-on-droplet DNS for the configured newsletter From address.
 *
 * Usage: tsx scripts/check-newsletter-dns.ts
 */
import "dotenv/config";
import { newsletterFromAddress } from "../src/lib/newsletter/config";
import { checkLocalMailDns } from "../src/lib/newsletter/local-dns";
import { newsletterTransport } from "../src/lib/newsletter/send";

async function main() {
  const from = newsletterFromAddress();
  const transport = newsletterTransport();
  const result = await checkLocalMailDns(from);
  console.log(JSON.stringify({ from, transport, ...result }, null, 2));
  if (result.issues.length) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
