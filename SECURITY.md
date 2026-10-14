# Secrets and this repository

This project is intended for **public GitHub**. Do **not** commit:

- `.env` or any file containing API keys, passwords, or tokens
- `data/affiliate-export.json` if it includes live tracking URLs you treat as confidential
- Database connection strings with real passwords
- Steam Web API keys, age-vendor keys, affiliate credentials, or DigitalOcean/Spaces tokens

**Safe in git:**

- `.env.example` — variable **names** only, values empty
- Example JSON such as `data/affiliate-export.example.json` with placeholder URLs

**Local development:** copy `.env.example` → `.env` (`.env` is gitignored).

**Production:** set environment variables on the DigitalOcean Droplet, App Platform, or your CI secret store — not in markdown and not in tracked files.

If a secret is ever pushed by mistake, rotate it at the provider immediately and purge it from git history.
