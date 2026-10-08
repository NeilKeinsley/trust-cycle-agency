# WordPress as the content admin for the Trust Cycle Agency site, for Railway.
# First built and deployed on Railway on 2026-10-08 (docs/HEADLESS_WP.md).
#
# Railway service settings: Root Directory = wordpress, domain target port 80,
# and the variables listed in docs/HEADLESS_WP.md, plus a volume at
# /var/www/html/wp-content/uploads: without it every redeploy deletes the
# pictures editors uploaded (blog posts, team photos).
FROM wordpress:php8.3-apache

# WP-CLI is not part of the Apache image; the first-boot setup needs it.
RUN curl -fsSL -o /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
	&& chmod +x /usr/local/bin/wp

# Baked into the image, not the volume: the entrypoint copies /usr/src/wordpress
# into the (ephemeral) web root on every start, so a redeploy is how code changes.
RUN curl -fsSL -o /tmp/acf.zip https://downloads.wordpress.org/plugin/advanced-custom-fields.latest-stable.zip \
	&& apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/* \
	&& unzip -q /tmp/acf.zip -d /usr/src/wordpress/wp-content/plugins/ && rm /tmp/acf.zip
COPY mu-plugins/ /usr/src/wordpress/wp-content/mu-plugins/

# PHP's stock limit is 2 MB a file, too small for a photo. The editor-facing
# cap is 5 MB (TCA_UPLOAD_BYTES in tca-blog.php); this leaves headroom above it.
RUN { echo 'upload_max_filesize = 8M'; echo 'post_max_size = 10M'; } > /usr/local/etc/php/conf.d/tca-uploads.ini
RUN chown -R www-data:www-data /usr/src/wordpress/wp-content

# Without these, the image invents new login keys on every start, which signs
# every editor out on each redeploy. WordPress ignores this exact placeholder
# and falls back to keys it generates once and keeps in the database.
ENV WORDPRESS_AUTH_KEY="put your unique phrase here" 	WORDPRESS_SECURE_AUTH_KEY="put your unique phrase here" 	WORDPRESS_LOGGED_IN_KEY="put your unique phrase here" 	WORDPRESS_NONCE_KEY="put your unique phrase here" 	WORDPRESS_AUTH_SALT="put your unique phrase here" 	WORDPRESS_SECURE_AUTH_SALT="put your unique phrase here" 	WORDPRESS_LOGGED_IN_SALT="put your unique phrase here" 	WORDPRESS_NONCE_SALT="put your unique phrase here"

COPY railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh

ENTRYPOINT ["railway-entrypoint.sh"]
CMD ["apache2-foreground"]
