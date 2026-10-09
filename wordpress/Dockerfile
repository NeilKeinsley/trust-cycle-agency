# WordPress as the content admin for the Trust Cycle Agency site, for Railway.
# First built and deployed on Railway on 2026-10-08 (docs/HEADLESS_WP.md).
#
# Railway service settings: Root Directory = wordpress, domain target port 80,
# and the variables listed in docs/HEADLESS_WP.md, plus a volume at
# /var/www/html/wp-content/uploads: without it every redeploy deletes the
# pictures editors uploaded (blog posts, team photos).
FROM wordpress:php8.3-apache

# WP-CLI is not part of the Apache image; the first-boot setup needs it.
# A fixed release, checked against the hash its publishers list beside it
# (wp-cli-<version>.phar.sha512 on the release page): the build fails if the
# file is not the one that was reviewed. To update, change both lines.
ARG WP_CLI_VERSION=2.12.0
ARG WP_CLI_SHA512=be928f6b8ca1e8dfb9d2f4b75a13aa4aee0896f8a9a0a1c45cd5d2c98605e6172e6d014dda2e27f88c98befc16c040cbb2bd1bfa121510ea5cdf5f6a30fe8832
RUN curl -fsSL -o /usr/local/bin/wp "https://github.com/wp-cli/wp-cli/releases/download/v${WP_CLI_VERSION}/wp-cli-${WP_CLI_VERSION}.phar" \
	&& echo "${WP_CLI_SHA512}  /usr/local/bin/wp" | sha512sum -c - \
	&& chmod +x /usr/local/bin/wp

# Baked into the image, not the volume: the entrypoint copies /usr/src/wordpress
# into the (ephemeral) web root on every start, so a redeploy is how code changes.
# The plugins take the newest stable release on purpose: a redeploy is how they
# get security fixes, since wp-admin cannot install or update anything
# (tca-security.php). The start-up script checks every plugin file against
# WordPress.org's published checksums and logs the result.
#   advanced-custom-fields: the content fields.
#   two-factor: an authenticator-app code at sign-in, once a user switches it
#   on under Users > Profile.
RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/* \
	&& for plugin in advanced-custom-fields two-factor; do \
		curl -fsSL -o /tmp/plugin.zip "https://downloads.wordpress.org/plugin/${plugin}.latest-stable.zip" \
		&& unzip -q /tmp/plugin.zip -d /usr/src/wordpress/wp-content/plugins/ && rm /tmp/plugin.zip || exit 1; \
	done
COPY mu-plugins/ /usr/src/wordpress/wp-content/mu-plugins/

# PHP's stock limit is 2 MB a file, too small for a photo. The editor-facing
# cap is 5 MB (TCA_UPLOAD_BYTES in tca-blog.php); this leaves headroom above it.
RUN { echo 'upload_max_filesize = 8M'; echo 'post_max_size = 10M'; } > /usr/local/etc/php/conf.d/tca-uploads.ini
RUN echo 'expose_php = Off' > /usr/local/etc/php/conf.d/tca-security.ini
RUN chown -R www-data:www-data /usr/src/wordpress/wp-content

# Web-server hardening: response headers on every file, the legacy and
# installer entry points refused, no PHP run from the uploads folder. The
# config test fails the build on a typo, and Railway keeps the previous
# deployment running when a build fails.
COPY apache-security.conf /etc/apache2/conf-available/tca-security.conf
RUN a2enmod headers >/dev/null && a2enconf tca-security >/dev/null && apache2ctl configtest

# Without these, the image invents new login keys on every start, which signs
# every editor out on each redeploy. WordPress ignores this exact placeholder
# and falls back to keys it generates once and keeps in the database.
ENV WORDPRESS_AUTH_KEY="put your unique phrase here" 	WORDPRESS_SECURE_AUTH_KEY="put your unique phrase here" 	WORDPRESS_LOGGED_IN_KEY="put your unique phrase here" 	WORDPRESS_NONCE_KEY="put your unique phrase here" 	WORDPRESS_AUTH_SALT="put your unique phrase here" 	WORDPRESS_SECURE_AUTH_SALT="put your unique phrase here" 	WORDPRESS_LOGGED_IN_SALT="put your unique phrase here" 	WORDPRESS_NONCE_SALT="put your unique phrase here"

COPY railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh

ENTRYPOINT ["railway-entrypoint.sh"]
CMD ["apache2-foreground"]
