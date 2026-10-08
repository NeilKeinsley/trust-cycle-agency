#!/bin/bash
# Start-up wrapper for Railway. Untested: see the note at the top of Dockerfile.
set -e

# Railway has been reported to start this image with two Apache MPMs enabled,
# which stops Apache ("More than one MPM loaded"). Keep prefork only.
rm -f /etc/apache2/mods-enabled/mpm_event.* /etc/apache2/mods-enabled/mpm_worker.*
a2enmod mpm_prefork >/dev/null 2>&1 || true

# Listen on the port Railway routes to.
if [ -n "$PORT" ]; then
	sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
	sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf
fi

# First boot: install WordPress and switch ACF on once the database answers.
# Runs beside Apache, because the stock entrypoint (below) is what copies the
# WordPress files into place and must stay the main process.
(
	wp() { command wp --allow-root --path=/var/www/html "$@"; }
	for _ in $(seq 1 60); do
		[ -f /var/www/html/wp-load.php ] && wp db check >/dev/null 2>&1 && break
		sleep 5
	done
	if ! wp core is-installed >/dev/null 2>&1; then
		wp core install \
			--url="${WP_SITE_URL:?set WP_SITE_URL}" \
			--title="Trust Cycle Agency CMS" \
			--admin_user="${WP_ADMIN_USER:?set WP_ADMIN_USER}" \
			--admin_password="${WP_ADMIN_PASSWORD:?set WP_ADMIN_PASSWORD}" \
			--admin_email="${WP_ADMIN_EMAIL:?set WP_ADMIN_EMAIL}" \
			--skip-email
		wp option update blog_public 0
		wp rewrite structure '/%postname%/' --hard
	fi
	wp plugin activate advanced-custom-fields || true
) &

# The stock entrypoint only copies WordPress into the web root when its first
# argument is apache2-foreground, so hand over with the original command.
exec docker-entrypoint.sh "$@"
