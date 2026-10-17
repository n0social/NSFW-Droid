import "dotenv/config";

async function main() {
  const base = process.env.MASTODON_INSTANCE_URL?.trim().replace(/\/$/, "");
  const token = process.env.MASTODON_ACCESS_TOKEN?.trim();
  if (!base || !token) {
    throw new Error("Set MASTODON_INSTANCE_URL and MASTODON_ACCESS_TOKEN");
  }
  const res = await fetch(`${base}/api/v1/accounts/verify_credentials`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`verify_${res.status}:${body.slice(0, 300)}`);
  }
  const acct = JSON.parse(body) as { acct?: string; id?: string; display_name?: string };
  console.log(JSON.stringify({ ok: true, acct: acct.acct, id: acct.id, display_name: acct.display_name }));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
