# TOS review and auto-publish

**Date:** 14 October 2026

NSFW-Droid lists outbound links to adult games. Most ingest and developer submissions are **published automatically** when they pass automated TOS screening. Items that look **prohibited or high legal risk** stay in the admin queue for human review.

This is **not** a moral filter on extreme fiction between consenting adults. It targets categories that typical adult catalog terms forbid.

## Automatic publish (default in production)

When `NODE_ENV=production` (or `AUTO_PUBLISH=1`, or legacy `DEMO_AUTO_PUBLISH=1` for local demos), a new `candidate` with `review_status = pending` is promoted to a public `listing` immediately if screening finds **no hold rules**.

Reviewer id on auto-approved rows: `auto_publish`.

## Manual review queue

A candidate stays **pending** when:

1. **TOS hold** — screening matched one or more rules (metadata in `raw_payload.tosScreen`), or
2. **Strict mode** — auto-publish is disabled (`AUTO_PUBLISH=0`, `INGEST_REQUIRE_REVIEW=1`, or non-production without demo flags).

Admins use **https://www.nsfwdroid.com/admin** (or local `/admin`). Pending rows show a **TOS hold** banner with rule summaries when flagged. Approve or reject as usual.

## Heuristic rules (keyword / pattern)

Implemented in `src/lib/tos-screen.ts`. Matched rule ids are stored on the candidate.

| Rule id | Intent |
| --- | --- |
| `prohibited_minors` | Underage sexual content (e.g. loli/shota, pedo, explicit ages under 18) |
| `bestiality` | Bestiality / zoophilia |
| `real_person_nonconsent` | Revenge porn, deepfake porn, celebrity leaks, “real rape” framing |
| `illegal_violence` | Snuff or similar presented as real |
| `incest_taboo` | Incest or taboo family sexual themes (title, tags, slugs — hold for staff, not a moral ban on all extreme fiction) |
| `fiction_nonconsent` | CNC / non-consent fantasy slugs and phrases (distinct from real-person leaks in `real_person_nonconsent`) |

False positives are possible (e.g. “step-” in a non-sexual title). Staff can **approve** after review or **reject** with a reason.

These holds align with the content line in `docs/considerations.md` and ingest maturity rules; browse may still surface similar tag slugs via `src/lib/tag-filter.ts`, but **auto-publish** stops until `/admin` approves.

## Environment variables

| Variable | Effect |
| --- | --- |
| `AUTO_PUBLISH=1` | Force auto-publish when TOS-clear (any environment) |
| `AUTO_PUBLISH=0` | Never auto-publish; manual approval only |
| *(unset)* | Auto-publish when `NODE_ENV=production` |
| `INGEST_REQUIRE_REVIEW=1` | Same as strict manual mode (overrides auto) |
| `DEMO_AUTO_PUBLISH=1` | Legacy local demo flag; enables auto-publish in dev |

Production droplet: set `AUTO_PUBLISH=1` in `/etc/nsfwdroid.env` (see [deploy-droplet.md](deploy-droplet.md)).

## Developer form

`POST /api/submissions` creates a `candidate` and runs the same pipeline. TOS-held submissions remain queued; clear submissions publish when auto-publish is on.
