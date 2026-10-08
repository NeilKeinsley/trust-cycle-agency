<?php
/**
 * Plugin Name: TCA Editing
 * Description: Makes the content admin safe for non-technical editors: a "Content manager" role that only sees the site's content, a plain-language dashboard, save-time validation, and the API behind the site's own /manage page. See docs/HEADLESS_WP.md.
 */

if (!defined('ABSPATH')) {
	exit;
}

const TCA_ROLE = 'tca_manager';

/** Character limits, enforced in the WordPress admin and on the /manage page. */
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

/* ---------- API behind the site's own /manage page ---------- */

/**
 * Checks question and answer against the site's rules.
 * Returns [clean values, errors keyed by field].
 */
function tca_check_faq($question, $answer): array {
	$q      = sanitize_text_field(is_string($question) ? $question : '');
	$a      = sanitize_textarea_field(is_string($answer) ? $answer : '');
	$errors = [];
	foreach (['q' => [$q, 'question', TCA_LIMITS['faq_question']], 'a' => [$a, 'answer', TCA_LIMITS['faq_answer']]] as $field => [$value, $label, $max]) {
		if ($value === '') {
			$errors[$field] = "Please write the $label.";
		} elseif (tca_has_long_dash($value)) {
			$errors[$field] = TCA_DASH_MESSAGE;
		} elseif (mb_strlen($value) > $max) {
			$errors[$field] = sprintf('The %s is too long: %d characters, and the limit is %d.', $label, mb_strlen($value), $max);
		}
	}
	return [['q' => $q, 'a' => $a], $errors];
}

/** FAQs in page order, with menu_order renumbered 0..n-1 so moves are simple swaps. */
function tca_ordered_faqs(): array {
	$posts = get_posts([
		'post_type'   => 'faq',
		'post_status' => ['publish', 'draft', 'pending', 'future'],
		'numberposts' => -1,
		'orderby'     => ['menu_order' => 'ASC', 'ID' => 'ASC'],
	]);
	foreach ($posts as $index => $post) {
		if ((int) $post->menu_order !== $index) {
			wp_update_post(['ID' => $post->ID, 'menu_order' => $index]);
			$post->menu_order = $index;
		}
	}
	return $posts;
}

function tca_faq_payload(): array {
	return [
		'limits' => ['q' => TCA_LIMITS['faq_question'], 'a' => TCA_LIMITS['faq_answer']],
		'items'  => array_map(fn (WP_Post $post) => [
			'id'     => $post->ID,
			'q'      => $post->post_title,
			'a'      => (string) get_field('answer', $post->ID, false),
			'status' => $post->post_status,
		], tca_ordered_faqs()),
	];
}

/** The site vouches for the signed-in editor by id; WordPress still checks what that user may do. */
function tca_manage_permission(WP_REST_Request $request) {
	if (!tca_secret_matches($request)) {
		return new WP_Error('tca_forbidden', 'Not allowed', ['status' => 401]);
	}
	$user = get_user_by('id', (int) $request->get_header('x-tca-user'));
	if (!$user || !user_can($user, 'edit_tca_items')) {
		return new WP_Error('tca_forbidden', 'This account cannot edit content', ['status' => 403]);
	}
	wp_set_current_user($user->ID);
	return true;
}

function tca_own_faq(WP_REST_Request $request) {
	$post = get_post((int) $request['id']);
	return $post && $post->post_type === 'faq' && $post->post_status !== 'trash' ? $post : null;
}

add_action('rest_api_init', function () {
	register_rest_route('tca/v1', '/session', [
		'methods'             => 'POST',
		'permission_callback' => 'tca_secret_matches',
		'callback'            => function (WP_REST_Request $request) {
			$user = wp_authenticate((string) $request['username'], (string) $request['password']);
			if (is_wp_error($user)) {
				return new WP_Error('tca_login', 'Wrong username or password', ['status' => 401]);
			}
			if (!user_can($user, 'edit_tca_items')) {
				return new WP_Error('tca_login', 'This account cannot edit content', ['status' => 403]);
			}
			return ['id' => $user->ID, 'name' => $user->display_name];
		},
	]);

	register_rest_route('tca/v1', '/manage/faqs', [
		[
			'methods'             => 'GET',
			'permission_callback' => 'tca_manage_permission',
			'callback'            => 'tca_faq_payload',
		],
		[
			'methods'             => 'POST',
			'permission_callback' => 'tca_manage_permission',
			'callback'            => function (WP_REST_Request $request) {
				[$clean, $errors] = tca_check_faq($request['q'], $request['a']);
				if ($errors) {
					return new WP_REST_Response(['errors' => $errors], 422);
				}
				$id = wp_insert_post([
					'post_type'   => 'faq',
					'post_status' => 'publish',
					'post_title'  => $clean['q'],
					'menu_order'  => count(tca_ordered_faqs()),
				], true);
				if (is_wp_error($id)) {
					return $id;
				}
				update_field('field_tca_faq_answer', $clean['a'], $id);
				return tca_faq_payload();
			},
		],
	]);

	register_rest_route('tca/v1', '/manage/faqs/(?P<id>\d+)', [
		[
			'methods'             => 'POST',
			'permission_callback' => 'tca_manage_permission',
			'callback'            => function (WP_REST_Request $request) {
				$post = tca_own_faq($request);
				if (!$post) {
					return new WP_Error('tca_missing', 'That question no longer exists', ['status' => 404]);
				}
				[$clean, $errors] = tca_check_faq($request['q'], $request['a']);
				if ($errors) {
					return new WP_REST_Response(['errors' => $errors], 422);
				}
				wp_update_post(['ID' => $post->ID, 'post_title' => $clean['q']]);
				update_field('field_tca_faq_answer', $clean['a'], $post->ID);
				return tca_faq_payload();
			},
		],
		[
			'methods'             => 'DELETE',
			'permission_callback' => 'tca_manage_permission',
			'callback'            => function (WP_REST_Request $request) {
				$post = tca_own_faq($request);
				if (!$post) {
					return new WP_Error('tca_missing', 'That question no longer exists', ['status' => 404]);
				}
				wp_trash_post($post->ID);
				return tca_faq_payload();
			},
		],
	]);

	register_rest_route('tca/v1', '/manage/faqs/(?P<id>\d+)/move', [
		'methods'             => 'POST',
		'permission_callback' => 'tca_manage_permission',
		'callback'            => function (WP_REST_Request $request) {
			$posts = tca_ordered_faqs();
			$index = array_search((int) $request['id'], array_map(fn ($post) => $post->ID, $posts), true);
			$other = $index === false ? false : $index + ($request['direction'] === 'up' ? -1 : 1);
			if ($index === false || !isset($posts[$other])) {
				return tca_faq_payload();
			}
			wp_update_post(['ID' => $posts[$index]->ID, 'menu_order' => $other]);
			wp_update_post(['ID' => $posts[$other]->ID, 'menu_order' => $index]);
			return tca_faq_payload();
		},
	]);
});
