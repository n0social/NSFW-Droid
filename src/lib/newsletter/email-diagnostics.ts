import { newsletterTransport } from "@/lib/newsletter/config";

export type EmailFailureDiagnostic = {
  code: string;
  summary: string;
  likelyCause: string;
  suggestedAction: string;
  transient: boolean;
  autoActionTaken?: string;
};

const TRANSIENT_SENDMAIL_PATTERNS: RegExp[] = [
  /temporary failure/i,
  /temporarily unavailable/i,
  /connection (refused|timed out|reset)/i,
  /resource temporarily unavailable/i,
  /\b421\b/,
  /\b451\b/,
  /\b452\b/,
  /cannot lock/i,
  /queue file/i,
];

const TRANSIENT_BREVO_PATTERNS: RegExp[] = [
  /^brevo_http_5\d\d:/,
  /^brevo_http_429:/,
  /rate limit/i,
];

function matchPatterns(haystack: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(haystack));
}

export function isTransientSendmailError(error: string): boolean {
  if (error.startsWith("sendmail_spawn:")) {
    const msg = error.slice("sendmail_spawn:".length);
    if (/ENOENT|not found/i.test(msg)) return false;
    return /EAGAIN|EBUSY|ETIMEDOUT|ECONNRESET|ECONNREFUSED/i.test(msg);
  }
  return matchPatterns(error, TRANSIENT_SENDMAIL_PATTERNS);
}

export function isTransientBrevoError(error: string): boolean {
  return matchPatterns(error, TRANSIENT_BREVO_PATTERNS);
}

export function isTransientEmailError(
  error: string,
  transport: "sendmail" | "brevo" = newsletterTransport(),
): boolean {
  return transport === "sendmail"
    ? isTransientSendmailError(error)
    : isTransientBrevoError(error);
}

export function diagnoseEmailSendFailure(
  error: string,
  transport: "sendmail" | "brevo" = newsletterTransport(),
): EmailFailureDiagnostic {
  const trimmed = error.trim();
  if (/^invalid_/.test(trimmed)) {
    return {
      code: trimmed,
      summary: "Invalid email header",
      likelyCause: trimmed,
      suggestedAction: "Fix subscriber address or template headers.",
      transient: false,
    };
  }

  if (transport === "sendmail") {
    if (error.startsWith("sendmail_spawn:") && /ENOENT|not found/i.test(error)) {
      return {
        code: "sendmail_missing",
        summary: "sendmail binary missing",
        likelyCause: error,
        suggestedAction: "Install Exim; set NEWSLETTER_TRANSPORT=sendmail.",
        transient: false,
      };
    }
    if (isTransientSendmailError(error)) {
      return {
        code: "exim_transient",
        summary: "Temporary Exim/sendmail failure",
        likelyCause: error.slice(0, 240),
        suggestedAction: "Check journalctl -u exim4; retries may succeed.",
        transient: true,
      };
    }
    return {
      code: "sendmail_failed",
      summary: "Sendmail error",
      likelyCause: error.slice(0, 240),
      suggestedAction: "Inspect exim mainlog and newsletter cron log.",
      transient: false,
    };
  }

  if (error === "missing_brevo_api_key") {
    return {
      code: "brevo_missing_key",
      summary: "BREVO_API_KEY missing",
      likelyCause: error,
      suggestedAction: "Set BREVO_API_KEY or use sendmail on droplet.",
      transient: false,
    };
  }
  if (isTransientBrevoError(error)) {
    return {
      code: "brevo_transient",
      summary: "Temporary Brevo API error",
      likelyCause: error.slice(0, 240),
      suggestedAction: "Retry later.",
      transient: true,
    };
  }
  return {
    code: "brevo_failed",
    summary: "Brevo API error",
    likelyCause: error.slice(0, 240),
    suggestedAction: "Check Brevo dashboard and DNS.",
    transient: false,
  };
}

export function formatEmailFailureForLog(
  context: string,
  error: string,
  diagnostic: EmailFailureDiagnostic,
): string {
  const lines = [
    `[${context}] ${diagnostic.summary}`,
    `  code: ${diagnostic.code}`,
    `  error: ${error}`,
    `  likely cause: ${diagnostic.likelyCause}`,
    `  suggested action: ${diagnostic.suggestedAction}`,
    `  transient: ${diagnostic.transient}`,
  ];
  if (diagnostic.autoActionTaken) lines.push(`  auto-action: ${diagnostic.autoActionTaken}`);
  return lines.join("\n");
}

export function formatEmailFailureForOpsAlert(
  context: string,
  error: string,
  diagnostic: EmailFailureDiagnostic,
  extra?: Record<string, string | number | boolean | null | undefined>,
): string {
  const parts = [
    `Context: ${context}`,
    `What broke: ${diagnostic.summary}`,
    `Technical: ${error}`,
    `Likely cause: ${diagnostic.likelyCause}`,
    `Suggested fix: ${diagnostic.suggestedAction}`,
    `Transport: ${newsletterTransport()}`,
  ];
  if (diagnostic.autoActionTaken) parts.push(`Auto-action taken: ${diagnostic.autoActionTaken}`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== null) parts.push(`${k}: ${v}`);
    }
  }
  return parts.join("\n");
}
