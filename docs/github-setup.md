# Private GitHub repository

Use a **private** repo for this project. That hides the code; it does **not** replace [SECURITY.md](../SECURITY.md) — still no `.env` or API keys in git.

## 1. Create the repo on GitHub

1. GitHub → **New repository**.
2. Name: e.g. `NSFW-Droid` (your choice).
3. Visibility: **Private**.
4. Do **not** add a README, `.gitignore`, or license (this folder already has them).
5. Create repository.

## 2. Push this codebase

From your machine (with this folder cloned):

```bash
git remote add github https://github.com/YOUR_USER/YOUR_REPO.git
# or SSH: git@github.com:YOUR_USER/YOUR_REPO.git

git push -u github main
```

If you already use Cursor’s `origin` remote, keep it and add `github` as a second remote, or rename:

```bash
git remote rename origin cursor
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 3. Secrets (never in the repo)

| Where | What |
| --- | --- |
| Local | `.env` (gitignored) — copy from `.env.example` |
| GitHub Actions (later) | **Settings → Secrets and variables → Actions** |
| DigitalOcean | Droplet / App Platform environment variables |

Do not paste keys into issues, PRs, or commit messages.

## 4. Dependabot (optional — skip for now)

**Dependabot** is GitHub’s bot that opens pull requests when npm dependencies have security updates. It is **not required** to ship.

- **Skip:** do nothing; your repo works fine without it.
- **Enable later:** **Settings → Security → Code security and analysis → Dependabot alerts / version updates**.

No Dependabot config is checked into this repo until you choose to enable it.

## 5. Collaborators

**Settings → Collaborators** — invite only people who need access. Everyone with read access can clone; treat the repo as sensitive anyway.

## 6. Relation to `n0social/NSFW-Droid`

The planning docs may have started from the public planning repo (`upstream`). Your **private** repo is the application + docs going forward. You can drop the `upstream` remote or keep it to pull occasional doc updates:

```bash
git remote -v
# git remote remove upstream   # optional
```
