#!/bin/bash
# Start-up wrapper for Railway (first deployed 2026-10-08).
set -e

# Railway has been reported to start this image with two Apache MPMs enabled,
# which stops Apache ("More than one MPM loaded"). Keep prefork only.
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
a2enmod mpm_prefork >/dev/null 2>&1 || true

# Apache stays on port 80: set the Railway domain's target port to 80.
# (Following Railway's injected PORT instead left the domain pointing at a
# port nothing listened on: 502 on the first deploy.)

# First boot: install WordPress and switch ACF on once the database answers.
# Runs beside Apache, because the stock entrypoint (below) is what copies the
# WordPress files into place and must stay the main process.
(
	wp() { command wp --allow-root --path=/var/www/html "$@"; }
	# The image has no mysql client, so "wp db check" can never pass. Ask PHP.
	db_ready() {
		php -r '[$h, $p] = explode(":", getenv("WORDPRESS_DB_HOST")) + [1 => 3306]; mysqli_report(MYSQLI_REPORT_OFF); exit(@mysqli_connect($h, getenv("WORDPRESS_DB_USER"), getenv("WORDPRESS_DB_PASSWORD"), getenv("WORDPRESS_DB_NAME"), (int) $p) ? 0 : 1);'
	}
	for _ in $(seq 1 60); do
		[ -f /var/www/html/wp-config.php ] && db_ready && break
		sleep 5
	done
	echo "[tca] database reachable, checking the WordPress install"
	if ! wp core is-installed >/dev/null 2>&1; then
		# Without WP_ADMIN_PASSWORD, WP-CLI makes a random one and prints it once
		# in this deploy's log ("Admin password: ..."). Change it after first login.
		wp core install \
			--url="${WP_SITE_URL:?set WP_SITE_URL}" \
			--title="Trust Cycle Agency CMS" \
			--admin_user="${WP_ADMIN_USER:?set WP_ADMIN_USER}" \
			${WP_ADMIN_PASSWORD:+--admin_password="$WP_ADMIN_PASSWORD"} \
			--admin_email="${WP_ADMIN_EMAIL:?set WP_ADMIN_EMAIL}" \
			--skip-email
	fi
	# Repeated on every boot on purpose: cheap, and it repairs a half-finished first boot.
	wp option update blog_public 0 || true
	wp rewrite structure '/%postname%/' --hard || true
	# Setting or changing WP_ADMIN_PASSWORD and redeploying resets the admin's password.
	if [ -n "$WP_ADMIN_PASSWORD" ]; then
		wp user update "$WP_ADMIN_USER" --user_pass="$WP_ADMIN_PASSWORD" --skip-email >/dev/null || true
	fi
	wp plugin activate advanced-custom-fields || true
	echo "[tca] setup finished"
) &

# The stock entrypoint only copies WordPress into the web root when its first
# argument is apache2-foreground, so hand over with the original command.
exec docker-entrypoint.sh "$@"
