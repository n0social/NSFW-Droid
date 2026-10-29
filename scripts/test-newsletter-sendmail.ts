import { buildSendmailMessage } from "../src/lib/newsletter/send-email";

process.env.NEWSLETTER_FROM = "NSFW Droid <newsletter@nsfwdroid.com>";

const message = buildSendmailMessage({
  to: "member@example.com",
  subject: "Weekly games",
  html: "<p>Hello</p>",
  text: "Hello",
  listUnsubscribeUrl: "https://www.nsfwdroid.com/api/newsletter/unsubscribe?token=abc",
});

const problems: string[] = [];
if (!message.includes("From: NSFW Droid <newsletter@nsfwdroid.com>\r\n")) {
  problems.push("missing from");
}
if (!message.includes("To: member@example.com\r\n")) problems.push("missing to");
if (!message.includes("Content-Type: text/plain; charset=UTF-8")) problems.push("missing text part");
if (!message.includes("Content-Type: text/html; charset=UTF-8")) problems.push("missing html part");
if (!message.includes("List-Unsubscribe: <https://www.nsfwdroid.com/api/newsletter/unsubscribe?token=abc>")) {
  problems.push("missing unsubscribe");
}
if (!message.trimEnd().endsWith("--")) problems.push("missing closing boundary");

let threw = false;
try {
  buildSendmailMessage({
    to: "bad\r\nBcc: x@y.z",
    subject: "x",
    html: "<p>x</p>",
  });
} catch {
  threw = true;
}
if (!threw) problems.push("header injection was accepted");

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("ok");
