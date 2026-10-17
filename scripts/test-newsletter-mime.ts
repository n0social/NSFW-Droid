import { buildNewsletterMime } from "../src/lib/newsletter/sendmail";

process.env.NEWSLETTER_FROM = "NSFW Droid <newsletter@nsfwdroid.com>";

const { raw, messageId, envelopeFrom } = buildNewsletterMime({
  to: "reader@example.com",
  subject: "Thanks for being a member: Here's our favorite NSFW games of the week",
  html: "<p>Hello & welcome</p>",
  text: "Hello",
  listUnsubscribeUrl: "https://www.nsfwdroid.com/api/newsletter/unsubscribe?token=abc",
});

const problems: string[] = [];
if (envelopeFrom !== "newsletter@nsfwdroid.com") problems.push(`envelope ${envelopeFrom}`);
if (!raw.startsWith("From: NSFW Droid <newsletter@nsfwdroid.com>\r\n")) {
  problems.push("from header");
}
if (!raw.includes(`To: reader@example.com\r\n`)) problems.push("to");
if (!raw.includes(`Message-ID: ${messageId}\r\n`)) problems.push("message-id");
if (!raw.includes("List-Unsubscribe: <https://www.nsfwdroid.com/api/newsletter/unsubscribe?token=abc>")) {
  problems.push("list-unsubscribe");
}
if (!raw.includes("List-ID: <weekly.nsfwdroid.com>")) problems.push("list-id");
if (!raw.includes("Reply-To: NSFW Droid <newsletter@nsfwdroid.com>")) problems.push("reply-to");
if (!raw.includes("Content-Type: text/html; charset=UTF-8")) problems.push("html part");
const htmlB64 = Buffer.from("<p>Hello & welcome</p>", "utf8").toString("base64");
if (!raw.includes(htmlB64)) problems.push("html body");

if (problems.length) {
  console.error(problems.join(", "));
  process.exit(1);
}
console.log("ok");
