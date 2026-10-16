import { screenCandidateText } from "../src/lib/tos-screen";

type Case = { text: string; expectHold: boolean; expectRule?: string };

const cases: Case[] = [
  { text: "Wholesome dating sim", expectHold: false },
  { text: "Incest fantasy visual novel", expectHold: true, expectRule: "incest_taboo" },
  { text: "Step-mom corruption RPG", expectHold: true, expectRule: "incest_taboo" },
  { text: "tags: taboo-family step-sister", expectHold: true, expectRule: "incest_taboo" },
  { text: "CNC kink simulator", expectHold: true, expectRule: "fiction_nonconsent" },
  { text: "consensual non-consent romance", expectHold: true, expectRule: "fiction_nonconsent" },
  { text: "non-consensual themes tag", expectHold: true, expectRule: "fiction_nonconsent" },
  { text: "loli beach episode", expectHold: true, expectRule: "prohibited_minors" },
  { text: "bestiality farm sim", expectHold: true, expectRule: "bestiality" },
];

let failed = 0;
for (const c of cases) {
  const r = screenCandidateText(c.text);
  const holdOk = r.hold === c.expectHold;
  const ruleOk =
    !c.expectRule || (c.expectHold && r.matchedRules.includes(c.expectRule));
  if (!holdOk || !ruleOk) {
    failed += 1;
    console.error("FAIL:", c.text, "got", r);
  }
}

if (failed > 0) {
  console.error(`${failed} case(s) failed`);
  process.exit(1);
}
console.log(`ok (${cases.length} cases)`);
