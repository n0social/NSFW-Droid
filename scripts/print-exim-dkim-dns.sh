#!/usr/bin/env bash
# Print the DKIM TXT record to publish in DNS (Cloudflare / registrar) for Exim-signed mail.
# Run on the droplet as root. Public key only — safe to share.
set -euo pipefail

MACROS=/etc/exim4/exim4.conf.localmacros
KEY="${DKIM_PRIVATE_KEY:-/etc/exim4/dkim/nsfwdroid.com.key}"
SELECTOR="${DKIM_SELECTOR:-nsfwdroid}"
DOMAIN="${DKIM_DOMAIN:-nsfwdroid.com}"

if [[ -f "$MACROS" ]]; then
  # shellcheck disable=SC1090
  source "$MACROS" 2>/dev/null || true
  KEY="${DKIM_PRIVATE_KEY:-$KEY}"
  SELECTOR="${DKIM_SELECTOR:-$SELECTOR}"
  DOMAIN="${DKIM_DOMAIN:-$DOMAIN}"
fi

if [[ ! -f "$KEY" ]]; then
  echo "Missing DKIM private key at $KEY" >&2
  exit 1
fi

pub=$(openssl rsa -in "$KEY" -pubout 2>/dev/null | openssl pkey -pubin -outform DER 2>/dev/null | tail -c +23 | base64 -w0)
host="${SELECTOR}._domainkey.${DOMAIN}"
value="v=DKIM1; k=rsa; p=${pub}"

echo "Add this DNS TXT record (Exim already signs outbound mail when present):"
echo ""
echo "  Name:  ${host}"
echo "  Type:  TXT"
echo "  Value: ${value}"
echo ""
echo "Verify after propagation:"
echo "  dig +short TXT ${host}"
echo ""
echo "SPF should already include the droplet IP (see dig TXT ${DOMAIN}). DMARC: _dmarc.${DOMAIN}"
