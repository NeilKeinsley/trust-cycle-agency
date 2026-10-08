# WordPress as the content admin for the Trust Cycle Agency site, for Railway.
# NOT YET BUILT OR RUN ANYWHERE: written from the image and Railway docs on a
# machine without Docker. Treat the first deploy as the test (docs/HEADLESS_WP.md).
#
# Railway service settings: Root Directory = wordpress, one volume mounted at
# /var/www/html/wp-content/uploads, and the variables listed in docs/HEADLESS_WP.md.
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
RUN chown -R www-data:www-data /usr/src/wordpress/wp-content

COPY railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
RUN chmod +x /usr/local/bin/railway-entrypoint.sh

ENTRYPOINT ["railway-entrypoint.sh"]
CMD ["apache2-foreground"]
