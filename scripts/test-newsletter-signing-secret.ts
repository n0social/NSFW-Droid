import assert from "node:assert/strict";

async function withEnv(
  patch: Record<string, string | undefined>,
  fn: () => void | Promise<void>,
): Promise<void> {
  const prior = new Map<string, string | undefined>();
  for (const key of Object.keys(patch)) {
    prior.set(key, process.env[key]);
    const value = patch[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    await fn();
  } finally {
    for (const [key, value] of prior) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

async function main(): Promise<void> {
  const config = await import("../src/lib/newsletter/config");
  const tokens = await import("../src/lib/newsletter/tokens");

  await withEnv(
    {
      NODE_ENV: "development",
      NEWSLETTER_TOKEN_SECRET: undefined,
      SESSION_SECRET: undefined,
    },
    () => {
      assert.equal(config.newsletterSigningSecretSource(), "dev_fallback");
      assert.equal(config.newsletterSigningSecret(), config.NEWSLETTER_DEV_SIGNING_SECRET);
      assert.equal(config.newsletterSigningSecretProductionIssue(), null);
      tokens.createUnsubscribeToken("sub-dev");
    },
  );

  await withEnv(
    {
      NODE_ENV: "production",
      NEWSLETTER_TOKEN_SECRET: undefined,
      SESSION_SECRET: undefined,
    },
    () => {
      assert.equal(config.isNewsletterSigningSecretWeak(), true);
      const issue = config.newsletterSigningSecretProductionIssue();
      assert.ok(issue?.includes("SESSION_SECRET"));
      assert.throws(
        () => config.assertNewsletterSigningSecretProduction("test"),
        /refusing dev newsletter signing secret/,
      );
      assert.throws(
        () => tokens.createUnsubscribeToken("sub-id"),
        /refusing dev newsletter signing secret/,
      );
    },
  );

  await withEnv(
    {
      NODE_ENV: "production",
      SESSION_SECRET: "prod-session-secret",
      NEWSLETTER_TOKEN_SECRET: undefined,
    },
    () => {
      assert.equal(config.newsletterSigningSecretSource(), "session_secret");
      assert.equal(config.newsletterSigningSecretProductionIssue(), null);
      const token = tokens.createUnsubscribeToken("sub-ok");
      assert.ok(token.includes("."));
    },
  );

  await withEnv(
    {
      NODE_ENV: "production",
      NEWSLETTER_TOKEN_SECRET: "dedicated-newsletter-hmac",
      SESSION_SECRET: "prod-session-secret",
    },
    () => {
      assert.equal(config.newsletterSigningSecretSource(), "newsletter_token_secret");
      assert.equal(config.newsletterSigningSecret(), "dedicated-newsletter-hmac");
    },
  );

  console.log("test-newsletter-signing-secret: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
