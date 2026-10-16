/**
 * Verify Resend MAIL FROM / DKIM DNS for the configured newsletter From address.
 *
 * Usage: tsx scripts/check-newsletter-resend-dns.ts
 */
import "dotenv/config";
import { newsletterFromAddress } from "../src/lib/newsletter/config";
import { checkResendMailFromDns } from "../src/lib/newsletter/resend-dns";

async function main() {
  const from = newsletterFromAddress();
  const result = await checkResendMailFromDns(from);
  console.log(JSON.stringify({ from, ...result }, null, 2));
  if (result.issues.length) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
