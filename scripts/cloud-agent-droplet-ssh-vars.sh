#!/usr/bin/env bash
# Shared Cloud Agent → droplet SSH settings (source from other cloud-agent-*.sh).
NSFWDROID_DROPLET_HOST="${NSFWDROID_DROPLET_HOST:-159.203.136.220}"
NSFWDROID_SSH_HOST_ALIAS="${NSFWDROID_SSH_HOST_ALIAS:-nsfwdroid-droplet}"
# Prefer dedicated deploy user; set NSFWDROID_DEPLOY_SSH_USER=root until droplet migration (see deploy-droplet.md).
NSFWDROID_DEPLOY_SSH_USER="${NSFWDROID_DEPLOY_SSH_USER:-nsfwdroid-deploy}"
NSFWDROID_APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
