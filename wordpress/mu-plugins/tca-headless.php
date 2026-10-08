<?php
/**
 * Plugin Name: TCA Headless
 * Description: Turns WordPress into the content admin for the Trust Cycle Agency Next.js site: content types, ACF fields, publish webhook, preview links. See docs/HEADLESS_WP.md.
 *
 * Expects two settings, as PHP constants (the Playground CLI passes them with
 * --define) or environment variables (the hosted container):
 *   TCA_FRONTEND_URL   Origin of the Next.js site, e.g. http://localhost:3000.
 *                      Several sites can read this WordPress: separate them with
 *                      commas. All are told about changes; the first is the main
 *                      one, where View and Preview links open.
 *   TCA_SHARED_SECRET  Same value as WP_SHARED_SECRET on the Next.js side
 */

if (!defined('ABSPATH')) {
	exit;
}

/** Post type => [REST base, singular, plural, menu icon]. */
const TCA_TYPES = [
	'case_study'  => ['case-studies', 'Case study', 'Case studies', 'dashicons-portfolio'],
	'faq'         => ['faqs', 'FAQ', 'FAQs', 'dashicons-editor-help'],
	'testimonial' => ['testimonials', 'Testimonial', 'Testimonials', 'dashicons-format-quote'],
	'team_member' => ['team', 'Team member', 'Team', 'dashicons-groups'],
	'blog_post'   => ['blog', 'Blog post', 'Blog posts', 'dashicons-admin-post'],
];

/** A setting from a PHP constant (local Playground) or an environment variable (hosted). */
function tca_setting(string $name): string {
	return defined($name) ? (string) constant($name) : (string) getenv($name);
}

/** Every site that shows this content, main one first. */
function tca_frontend_urls(): array {
	$urls = array_map(fn ($url) => rtrim(trim($url), '/'), explode(',', tca_setting('TCA_FRONTEND_URL')));
	return array_values(array_filter($urls));
}

function tca_frontend_url(): string {
	return tca_frontend_urls()[0] ?? '';
}

function tca_secret(): string {
	return tca_setting('TCA_SHARED_SECRET');
}

/* ---------- Content types ---------- */

add_action('init', function () {
	foreach (TCA_TYPES as $type => [$rest_base, $singular, $plural, $icon]) {
		register_post_type($type, [
			'labels' => [
				'name'          => $plural,
				'singular_name' => $singular,
				'add_new_item'  => "Add $singular",
				'edit_item'     => "Edit $singular",
			],
			'public'       => true,
			'has_archive'  => false,
			// Own capabilities, so the "Content manager" role (tca-editing.php)
			// can edit these and nothing else in WordPress.
			'capability_type' => ['tca_item', 'tca_items'],
			'map_meta_cap'    => true,
			'show_in_rest' => true,
			'rest_base'    => $rest_base,
			'menu_icon'    => $icon,
			// No body editor: every piece of content is a labelled ACF field.
			// The two exceptions (tca-blog.php): a blog post is written in the block
			// editor, and a team member can carry a photo.
			'supports'     => match ($type) {
				'blog_post'   => ['title', 'editor', 'thumbnail', 'excerpt', 'revisions'],
				'team_member' => ['title', 'page-attributes', 'revisions', 'thumbnail'],
				default       => ['title', 'page-attributes', 'revisions'],
			},
		]);
	}
});

/* The REST title is texturized HTML (curly quotes, entities). The front end
   wants the text exactly as typed. */
add_action('rest_api_init', function () {
	foreach (array_keys(TCA_TYPES) as $type) {
		register_rest_field($type, 'tca_title', [
			'get_callback' => fn ($post) => get_post_field('post_title', $post['id'], 'raw'),
			'schema'       => ['type' => 'string'],
		]);
	}
});

/* ---------- ACF fields ---------- */

function tca_field(string $type, string $name, string $label, string $kind = 'text', array $extra = []): array {
	return array_merge([
		'key'       => "field_tca_{$type}_{$name}",
		'name'      => $name,
		'label'     => $label,
		'type'      => $kind,
		'required'  => 1,
		// Textareas come back as typed: the front end splits lines itself.
		'new_lines' => '',
	], $extra);
}

function tca_field_groups(): array {
	$lines = 'One per line.';
	$case  = [
		tca_field('case_study', 'tags', 'Services', 'checkbox', [
			'choices' => ['Website' => 'Website', 'Brand' => 'Brand', 'Marketing' => 'Marketing', 'SEO' => 'SEO', 'Social' => 'Social'],
		]),
		tca_field('case_study', 'mockup', 'Illustration', 'select', [
			'choices'      => ['browser' => 'Browser window', 'logo' => 'Logo', 'campaign' => 'Campaign', 'search' => 'Search results'],
			'instructions' => 'The illustrations are built into the site. A new one needs a developer.',
		]),
		tca_field('case_study', 'outcome', 'Homepage line', 'textarea', ['rows' => 2]),
		tca_field('case_study', 'summary', 'Summary', 'textarea', ['rows' => 2, 'instructions' => 'Page lead and search description.']),
		tca_field('case_study', 'sector', 'Sector'),
		tca_field('case_study', 'engagement', 'Engagement'),
		tca_field('case_study', 'situation', 'The situation', 'textarea', ['rows' => 6, 'instructions' => 'One paragraph per line.']),
	];
	// ACF free has no repeater, so the approach is three fixed title/body pairs.
	for ($i = 1; $i <= 3; $i++) {
		$case[] = tca_field('case_study', "approach_{$i}_title", "Approach step $i: title", 'text', ['required' => $i === 1 ? 1 : 0]);
		$case[] = tca_field('case_study', "approach_{$i}_body", "Approach step $i: detail", 'textarea', ['rows' => 3, 'required' => $i === 1 ? 1 : 0]);
	}
	$case[] = tca_field('case_study', 'shipped', 'What shipped', 'textarea', ['rows' => 4, 'instructions' => $lines]);
	$case[] = tca_field('case_study', 'changed', 'What changed', 'textarea', ['rows' => 3]);
	$case[] = tca_field('case_study', 'watched', 'What we watched', 'textarea', ['rows' => 3, 'instructions' => $lines]);

	return [
		'case_study'  => $case,
		'faq'         => [
			tca_field('faq', 'answer', 'Answer', 'textarea', ['rows' => 4, 'maxlength' => TCA_LIMITS['faq_answer'], 'instructions' => 'Plain text. Shown under the question on the FAQ page.']),
		],
		'testimonial' => [
			tca_field('testimonial', 'quote', 'Quote', 'textarea', ['rows' => 3]),
			tca_field('testimonial', 'role', 'Role'),
			tca_field('testimonial', 'company', 'Company'),
		],
		'team_member' => [
			tca_field('team_member', 'role', 'Role', 'text', ['maxlength' => 40]),
			tca_field('team_member', 'focus', 'Specialty', 'text', ['maxlength' => 60]),
			tca_field('team_member', 'current_focus', 'Current focus', 'text', ['maxlength' => 90, 'instructions' => 'One line. On the last card it is shown on its own, like a quote.']),
		],
	];
}

add_action('acf/init', function () {
	foreach (tca_field_groups() as $type => $fields) {
		acf_add_local_field_group([
			'key'          => "group_tca_$type",
			'title'        => TCA_TYPES[$type][1] . ' details',
			'fields'       => $fields,
			'location'     => [[['param' => 'post_type', 'operator' => '==', 'value' => $type]]],
			'show_in_rest' => 1,
		]);
	}
});

/* ---------- Seed (first boot, and the "Reset demo content" action) ---------- */

function tca_seed_meta(string $type, array $item): array {
	if ($type === 'faq') {
		return ['title' => $item['q'], 'fields' => ['answer' => $item['a']]];
	}
	if ($type === 'testimonial') {
		return ['title' => $item['name'], 'fields' => ['quote' => $item['quote'], 'role' => $item['role'], 'company' => $item['company']]];
	}
	if ($type === 'team_member') {
		return ['title' => $item['name'], 'fields' => ['role' => $item['role'], 'focus' => $item['focus'], 'current_focus' => $item['currentFocus']]];
	}
	$fields = [
		'tags'       => $item['tags'],
		'mockup'     => $item['mockup'],
		'outcome'    => $item['outcome'],
		'summary'    => $item['summary'],
		'sector'     => $item['sector'],
		'engagement' => $item['engagement'],
		'situation'  => implode("\n", $item['situation']),
		'shipped'    => implode("\n", $item['shipped']),
		'changed'    => $item['changed'],
		'watched'    => implode("\n", $item['watched']),
	];
	foreach (array_slice($item['approach'], 0, 3) as $i => $step) {
		$n = $i + 1;
		$fields["approach_{$n}_title"] = $step['title'];
		$fields["approach_{$n}_body"]  = $step['body'];
	}
	return ['title' => $item['client'], 'slug' => $item['slug'], 'fields' => $fields];
}

/** Creates the seed entries for the given content types. Returns how many were made. */
function tca_seed_types(array $types): int {
	$file = __DIR__ . '/tca-seed.json';
	$seed = is_readable($file) ? json_decode(file_get_contents($file), true) : null;
	if (!is_array($seed) || !function_exists('update_field')) {
		return 0;
	}
	$made = 0;
	foreach ($seed as $type => $items) {
		if (!isset(TCA_TYPES[$type]) || !in_array($type, $types, true)) {
			continue;
		}
		foreach ($items as $order => $item) {
			if ($type === 'blog_post') {
				$made += tca_seed_blog_post($item) ? 1 : 0;
				continue;
			}
			$meta = tca_seed_meta($type, $item);
			$id   = wp_insert_post([
				'post_type'   => $type,
				'post_status' => 'publish',
				'post_title'  => $meta['title'],
				'post_name'   => $meta['slug'] ?? '',
				'menu_order'  => $order,
			]);
			if (!$id || is_wp_error($id)) {
				continue;
			}
			foreach ($meta['fields'] as $name => $value) {
				update_field("field_tca_{$type}_{$name}", $value, $id);
			}
			$made++;
		}
	}
	return $made;
}

add_action('init', function () {
	if (!function_exists('update_field')) {
		return;
	}
	// Per type, so a content type added later is seeded on an existing install.
	// Installs seeded before this list existed already hold the first three.
	$seeded  = get_option('tca_seeded_types', get_option('tca_seeded') ? ['case_study', 'faq', 'testimonial'] : []);
	$missing = array_values(array_diff(array_keys(TCA_TYPES), $seeded));
	if (!$missing) {
		return;
	}
	update_option('tca_seeded', 1);
	update_option('tca_seeded_types', array_keys(TCA_TYPES));
	tca_seed_types($missing);
}, 99);

/* ---------- Publish webhook: tell Next.js to refresh ---------- */

function tca_notify_frontend(int $post_id): void {
	$type = get_post_type($post_id);
	if (!isset(TCA_TYPES[$type]) || wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
		return;
	}
	if (!tca_frontend_url() || !tca_secret()) {
		return;
	}
	foreach (tca_frontend_urls() as $site) {
		wp_remote_post("$site/api/revalidate", [
			'timeout'  => 5,
			'blocking' => false,
			'headers'  => ['content-type' => 'application/json', 'x-webhook-secret' => tca_secret()],
			'body'     => wp_json_encode(['type' => $type]),
		]);
	}
}

// ACF saves its fields after save_post, so listen on acf/save_post as well.
add_action('acf/save_post', fn ($post_id) => is_numeric($post_id) ? tca_notify_frontend((int) $post_id) : null, 20);
add_action('trashed_post', 'tca_notify_frontend');
add_action('untrashed_post', 'tca_notify_frontend');
add_action('deleted_post', 'tca_notify_frontend');

/* ---------- Drafts for preview (secret-protected) ---------- */

function tca_public_path(WP_Post $post): string {
	$slug = $post->post_name ?: sanitize_title($post->post_title);
	if ($post->post_type === 'case_study') {
		return "/work/$slug";
	}
	if ($post->post_type === 'blog_post') {
		return "/blog/$slug";
	}
	return $post->post_type === 'faq' ? '/faq' : '/';
}

function tca_secret_matches(WP_REST_Request $request): bool {
	$given = (string) $request->get_header('x-webhook-secret');
	return tca_secret() !== '' && hash_equals(tca_secret(), $given);
}

add_action('rest_api_init', function () {
	register_rest_route('tca/v1', '/status', [
		'methods'             => 'GET',
		'permission_callback' => 'tca_secret_matches',
		'callback'            => fn () => [
			'acf'    => function_exists('update_field'),
			'seeded' => (bool) get_option('tca_seeded'),
			'seed'   => is_readable(__DIR__ . '/tca-seed.json'),
			'counts' => array_map(fn ($type) => (int) wp_count_posts($type)->publish, array_combine(array_keys(TCA_TYPES), array_keys(TCA_TYPES))),
		],
	]);
	register_rest_route('tca/v1', '/content/(?P<base>[a-z-]+)', [
		'methods'             => 'GET',
		'permission_callback' => 'tca_secret_matches',
		'callback'            => function (WP_REST_Request $request) {
			$type = null;
			foreach (TCA_TYPES as $candidate => [$rest_base]) {
				if ($rest_base === $request['base']) {
					$type = $candidate;
				}
			}
			if (!$type) {
				return new WP_Error('tca_unknown_type', 'Unknown content type', ['status' => 404]);
			}
			$posts = get_posts([
				'post_type'   => $type,
				'post_status' => ['publish', 'draft', 'pending', 'future'],
				'numberposts' => 100,
				// Blog posts read newest first; everything else in page order.
				'orderby'     => $type === 'blog_post' ? 'date' : 'menu_order',
				'order'       => $type === 'blog_post' ? 'DESC' : 'ASC',
			]);
			return array_map(fn (WP_Post $post) => tca_entry_extras($post) + [
				'id'        => $post->ID,
				'slug'      => $post->post_name ?: sanitize_title($post->post_title),
				'tca_title' => $post->post_title,
				'acf'       => get_fields($post->ID, false) ?: new stdClass(),
			], $posts);
		},
	]);
});

/* ---------- Links point at the real site, and WordPress has no front end ---------- */

add_filter('post_type_link', function ($link, $post) {
	return isset(TCA_TYPES[$post->post_type]) && tca_frontend_url() ? tca_frontend_url() . tca_public_path($post) : $link;
}, 10, 2);

add_filter('preview_post_link', function ($link, $post) {
	if (!isset(TCA_TYPES[$post->post_type]) || !tca_frontend_url() || !tca_secret()) {
		return $link;
	}
	return add_query_arg(
		['secret' => rawurlencode(tca_secret()), 'slug' => rawurlencode(tca_public_path($post))],
		tca_frontend_url() . '/api/draft'
	);
}, 10, 2);

add_action('template_redirect', function () {
	// No theme pages for visitors: the real site, or the login screen until it is configured.
	if (is_robots() || is_favicon()) {
		return; // robots.txt keeps answering as a file, not a redirect
	}
	wp_redirect(tca_frontend_url() ? tca_frontend_url() . '/' : wp_login_url(), 302);
	exit;
});

/* The public API is for content. Don't hand out the list of account names with it. */
add_filter('rest_endpoints', function ($endpoints) {
	if (!is_user_logged_in()) {
		unset($endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\d]+)']);
	}
	return $endpoints;
});
