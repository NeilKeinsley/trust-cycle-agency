<?php
/**
 * Plugin Name: TCA Editing
 * Description: Makes the content admin safe for non-technical editors: a "Content manager" role that only sees the site's content, a plain-language dashboard and save-time validation. See docs/HEADLESS_WP.md.
 */

if (!defined('ABSPATH')) {
	exit;
}

const TCA_ROLE = 'tca_manager';

/** Character limits, enforced in the WordPress admin. */
const TCA_LIMITS = [
	'faq_question' => 160,
	'faq_answer'   => 1200,
];

const TCA_DASH_MESSAGE = 'Please replace the long dash with a comma, colon or full stop. The site does not use long dashes.';

/* ---------- Role ---------- */

/** Every capability of the site's content types (see capability_type in tca-headless.php). */
function tca_content_caps(): array {
	return [
		'edit_tca_items', 'edit_others_tca_items', 'edit_published_tca_items', 'edit_private_tca_items',
		'publish_tca_items', 'read_private_tca_items',
		'delete_tca_items', 'delete_others_tca_items', 'delete_published_tca_items', 'delete_private_tca_items',
	];
}

add_action('init', function () {
	if (get_option('tca_role_version') === '1') {
		return;
	}
	remove_role(TCA_ROLE);
	add_role(TCA_ROLE, 'Content manager', array_fill_keys(array_merge(['read'], tca_content_caps()), true));
	$admin = get_role('administrator');
	foreach (tca_content_caps() as $cap) {
		$admin?->add_cap($cap);
	}
	update_option('tca_role_version', '1');
}, 5);

/* A local test editor, only when the start command passes a password for it. */
add_action('init', function () {
	if (!defined('TCA_DEMO_EDITOR_PASSWORD') || username_exists('client')) {
		return;
	}
	wp_insert_user([
		'user_login'   => 'client',
		'user_pass'    => TCA_DEMO_EDITOR_PASSWORD,
		'display_name' => 'Client Editor',
		'role'         => TCA_ROLE,
	]);
}, 6);

function tca_is_manager(): bool {
	return current_user_can('edit_tca_items') && !current_user_can('manage_options');
}

/* ---------- A dashboard a non-technical editor can read ---------- */

add_action('wp_dashboard_setup', function () {
	if (!current_user_can('edit_tca_items')) {
		return;
	}
	if (tca_is_manager()) {
		global $wp_meta_boxes;
		$wp_meta_boxes['dashboard'] = [];
		remove_action('welcome_panel', 'wp_welcome_panel');
	}
	wp_add_dashboard_widget('tca_start', 'Your website content', function () {
		echo '<p>Pick what you want to change. Nothing here can break the design: you only edit words.</p><ul>';
		foreach (TCA_TYPES as $type => [, $singular, $plural]) {
			printf(
				'<li style="margin:0 0 10px"><strong>%s</strong><br><a class="button button-primary" href="%s">Add %s</a> <a class="button" href="%s">See all</a></li>',
				esc_html($plural),
				esc_url(admin_url("post-new.php?post_type=$type")),
				esc_html($singular === strtoupper($singular) ? $singular : strtolower($singular)),
				esc_url(admin_url("edit.php?post_type=$type"))
			);
		}
		echo '</ul><p><strong>Publish</strong> or <strong>Update</strong> puts your change on the website straight away. <strong>Save Draft</strong> keeps it private, and <strong>Preview</strong> shows a draft on the real site before anyone else sees it. <strong>Move to Trash</strong> removes an item from the site; it stays in Trash for 30 days in case you change your mind.</p>';
		echo '<p>The <strong>Order</strong> number decides the position on the page: lower numbers come first.</p>';
	});
});

/* WordPress sends accounts without the blog's own capabilities to their
   profile after login. Content managers should land on the dashboard. */
add_filter('login_redirect', function ($redirect, $requested, $user) {
	return $user instanceof WP_User && user_can($user, 'edit_tca_items') && !user_can($user, 'edit_posts') ? admin_url() : $redirect;
}, 10, 3);

add_filter('enter_title_here', function ($text, $post) {
	return [
		'faq'         => 'Type the question here',
		'testimonial' => "Type the person's name here",
		'case_study'  => 'Type the client name here',
		'team_member' => "Type the person's name here",
	][$post->post_type] ?? $text;
}, 10, 2);

/* Lists read in page order, with the order number visible. */
add_action('pre_get_posts', function (WP_Query $query) {
	if (is_admin() && $query->is_main_query() && isset(TCA_TYPES[$query->get('post_type')]) && !$query->get('orderby')) {
		$query->set('orderby', 'menu_order');
		$query->set('order', 'ASC');
	}
});

add_action('admin_init', function () {
	foreach (array_keys(TCA_TYPES) as $type) {
		add_filter("manage_{$type}_posts_columns", function ($columns) {
			unset($columns['date']);
			return $columns + ['tca_order' => 'Order on page', 'date' => 'Date'];
		});
		add_action("manage_{$type}_posts_custom_column", function ($column, $post_id) {
			if ($column === 'tca_order') {
				echo (int) get_post_field('menu_order', $post_id) + 1;
			}
		}, 10, 2);
	}
});

/* ---------- Save-time validation (same rules the site enforces) ---------- */

function tca_has_long_dash(string $value): bool {
	return str_contains($value, "\u{2014}");
}

add_filter('acf/validate_value', function ($valid, $value) {
	return $valid === true && is_string($value) && tca_has_long_dash($value) ? TCA_DASH_MESSAGE : $valid;
}, 10, 2);

add_action('acf/validate_save_post', function () {
	$type  = sanitize_key($_POST['post_type'] ?? '');
	$title = wp_unslash($_POST['post_title'] ?? '');
	if (!isset(TCA_TYPES[$type])) {
		return;
	}
	if (trim($title) === '') {
		acf_add_validation_error('', 'Please fill in the title at the top of the page.');
	} elseif (tca_has_long_dash($title)) {
		acf_add_validation_error('', 'Title: ' . TCA_DASH_MESSAGE);
	} elseif ($type === 'faq' && mb_strlen($title) > TCA_LIMITS['faq_question']) {
		acf_add_validation_error('', sprintf('The question is too long. Keep it under %d characters.', TCA_LIMITS['faq_question']));
	}
});

/* A scheduled item goes live without anyone pressing save, so tell the site then too. */
add_action('transition_post_status', function ($new, $old, $post) {
	if ($new !== $old && ($new === 'publish' || $old === 'publish') && function_exists('tca_notify_frontend')) {
		tca_notify_frontend($post->ID);
	}
}, 10, 3);
