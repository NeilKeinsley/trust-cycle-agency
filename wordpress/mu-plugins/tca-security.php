<?php
/**
 * Plugin Name: TCA Security
 * Description: Hardening for a WordPress that is only the content admin of a separate site: no code changes from the dashboard, a public API limited to the content the site reads, sign-in throttling, and none of the legacy entry points (XML-RPC, application passwords, comments). See docs/SECURITY.md.
 *
 * The web-server half (response headers, blocked files, no PHP in uploads)
 * is in the Dockerfile, because it has to cover files PHP never sees.
 */

if (!defined('ABSPATH')) {
	exit;
}

/* ---------- Code ships with the image, never from the dashboard ---------- */

/* An attacker who gets an administrator's session would otherwise install a
   plugin or edit a theme file and own the server. Automatic security updates
   of WordPress itself stay on (the filter below). */
defined('DISALLOW_FILE_EDIT') || define('DISALLOW_FILE_EDIT', true);
defined('DISALLOW_FILE_MODS') || define('DISALLOW_FILE_MODS', true);
add_filter('file_mod_allowed', fn ($allowed, $context) => $context === 'automatic_updater' ? true : $allowed, 10, 2);

/* ---------- The address a request really came from ---------- */

/* Railway's edge replaces any X-Forwarded-For the client sends with the real
   client address (checked on the site service 2026-09-26, and on this one
   2026-10-09: see docs/SECURITY.md). Behind a proxy that appends instead, the
   first hop is whatever the client typed: use the last trusted hop there. */
function tca_client_ip(): string {
	$forwarded = (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
	$ip        = trim(explode(',', $forwarded)[0]) ?: (string) ($_SERVER['REMOTE_ADDR'] ?? '');
	return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

/* ---------- Sign-in throttling ---------- */

const TCA_LOGIN_MAX    = 5;
const TCA_LOGIN_WINDOW = 15 * MINUTE_IN_SECONDS;

function tca_login_key(): string {
	return 'tca_login_' . md5(tca_client_ip());
}

add_action('wp_login_failed', function () {
	set_transient(tca_login_key(), (int) get_transient(tca_login_key()) + 1, TCA_LOGIN_WINDOW);
});

/* Runs after WordPress has checked the password (priority 20), so a locked-out
   address is refused even with the right password: guessing gains nothing. */
add_filter('authenticate', function ($user, $username) {
	if ($username === '' || (int) get_transient(tca_login_key()) < TCA_LOGIN_MAX) {
		return $user;
	}
	status_header(429);
	header('Retry-After: ' . TCA_LOGIN_WINDOW);
	return new WP_Error('tca_locked', 'Too many failed sign-in attempts from this address. Please wait 15 minutes and try again.');
}, 100, 2);

add_action('wp_login', fn () => delete_transient(tca_login_key()));

/* One message for every failed sign-in, so the form doesn't confirm which
   usernames exist. */
add_filter('wp_login_errors', function ($errors) {
	if (!$errors instanceof WP_Error) {
		return $errors;
	}
	$revealing = array_intersect(['invalid_username', 'invalid_email', 'incorrect_password', 'invalidcombo'], $errors->get_error_codes());
	foreach ($revealing as $code) {
		$errors->remove($code);
	}
	if ($revealing) {
		$errors->add('tca_login', 'The username or password is incorrect.');
	}
	return $errors;
});

/* ---------- Entry points this site does not use ---------- */

// XML-RPC: the file itself is refused by the web server; this covers a server that forgot to.
add_filter('xmlrpc_enabled', '__return_false');
add_filter('xmlrpc_methods', '__return_empty_array');
add_filter('wp_headers', function ($headers) {
	unset($headers['X-Pingback']);
	return $headers;
});

// A second way to sign in over the API, with no throttle and no second factor. Nothing here uses it.
add_filter('wp_is_application_passwords_available', '__return_false');

// No comments, pingbacks, user sitemap or self-registration on a content admin.
add_filter('comments_open', '__return_false', 20);
add_filter('pings_open', '__return_false', 20);
add_filter('wp_sitemaps_enabled', '__return_false');
add_filter('pre_option_users_can_register', '__return_zero');

/* ---------- Say less about what is running ---------- */

add_filter('x_redirect_by', '__return_false');
add_filter('the_generator', '__return_empty_string');
remove_action('wp_head', 'wp_generator');
remove_action('template_redirect', 'rest_output_link_header', 11);
remove_action('wp_head', 'rest_output_link_wp_head');
remove_action('wp_head', 'rsd_link');

/* ---------- The public API is the site's content and nothing else ---------- */

/* Visitors (and the site's server) may read the five content types and call
   the secret-protected tca/v1 routes. Everything else WordPress exposes by
   default (the route index, users, media, comments, search, oEmbed, site
   health) needs a signed-in editor. Priority 101: after WordPress has decided
   whether the cookie and nonce are valid. */
add_filter('rest_authentication_errors', function ($result) {
	if (is_wp_error($result) || is_user_logged_in()) {
		return $result;
	}
	$route = '/' . trim((string) ($GLOBALS['wp']->query_vars['rest_route'] ?? ''), '/');
	$bases = implode('|', array_map(fn ($type) => preg_quote($type[0], '#'), TCA_TYPES));
	if (preg_match("#^/(?:wp/v2/(?:$bases)(?:/\d+)?|tca/v1/.+)$#", $route)) {
		return $result;
	}
	return new WP_Error('rest_forbidden', 'Sign in to use this part of the API.', ['status' => 401]);
}, 101);

/* WordPress answers any website's browser with "you may read this with the
   visitor's cookies". The site reads content from its server, never from a
   visitor's browser, so no cross-origin access is offered at all. */
add_action('rest_api_init', fn () => remove_filter('rest_pre_serve_request', 'rest_send_cors_headers'), 15);
