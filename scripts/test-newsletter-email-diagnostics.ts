import assert from "node:assert/strict";
import {
  diagnoseEmailSendFailure,
  isTransientSendmailError,
} from "../src/lib/newsletter/email-diagnostics";

assert.equal(isTransientSendmailError("sendmail_exit_1:451 temporary"), true);
assert.equal(diagnoseEmailSendFailure("sendmail_spawn:ENOENT", "sendmail").code, "sendmail_missing");
console.log("test-newsletter-email-diagnostics: ok");
