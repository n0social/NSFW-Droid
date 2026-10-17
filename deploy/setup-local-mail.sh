#!/usr/bin/env bash
# Local outbound mail on the droplet: Exim accepts mail on 127.0.0.1:25,
# signs DKIM for nsfwdroid.com, and delivers directly. DigitalOcean blocks
# outbound port 25 until support unblocks it; Exim queues until then.
set -euo pipefail

DOMAIN="${MAIL_DOMAIN:-nsfwdroid.com}"
HOSTNAME="${MAIL_HOSTNAME:-mail.${DOMAIN}}"
SELECTOR="${MAIL_DKIM_SELECTOR:-nsfwdroid}"
KEY_DIR=/etc/exim4/dkim
KEY_PATH="${KEY_DIR}/${DOMAIN}.key"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq exim4-daemon-light openssl

install -d -o root -g Debian-exim -m 750 "$KEY_DIR"
if [[ ! -s "$KEY_PATH" ]]; then
  openssl genrsa -out "$KEY_PATH" 2048
fi
chown root:Debian-exim "$KEY_PATH"
chmod 640 "$KEY_PATH"

cat > /etc/exim4/exim4.conf.localmacros <<EOF
MAIN_HARDCODE_PRIMARY_HOSTNAME = ${HOSTNAME}
MAIN_TRUSTED_USERS = www-data
DKIM_CANON = relaxed
DKIM_SELECTOR = ${SELECTOR}
DKIM_DOMAIN = ${DOMAIN}
DKIM_PRIVATE_KEY = ${KEY_PATH}
EOF

cat > /etc/exim4/update-exim4.conf.conf <<EOF
dc_eximconfig_configtype='internet'
dc_other_hostnames='${HOSTNAME}'
dc_local_interfaces='127.0.0.1 ; ::1'
dc_readhost=''
dc_relay_domains=''
dc_minimaldns='false'
dc_relay_nets=''
dc_smarthost=''
CFILEMODE='644'
dc_use_split_config='false'
dc_hide_mailname=''
dc_mailname_in_oh='true'
dc_localdelivery='mail_spool'
EOF

printf '%s\n' "$DOMAIN" > /etc/mailname

update-exim4.conf
systemctl enable exim4
systemctl restart exim4

echo "Exim listening:"
ss -lnt | awk 'NR==1 || /:25 /'
echo "DKIM public TXT ${SELECTOR}._domainkey.${DOMAIN}:"
p=$(openssl rsa -in "$KEY_PATH" -pubout -outform DER 2>/dev/null | openssl base64 -A)
printf 'v=DKIM1; k=rsa; p=%s\n' "$p"
