<?php
/**
 * Plugin Name: TCA Blog and Media
 * Description: Blog posts with pictures for the Trust Cycle Agency site, and photos for team members. The block editor is limited to a few plain blocks, and each post is handed to the site as typed data instead of HTML. See docs/HEADLESS_WP.md.
 */

if (!defined('ABSPATH')) {
	exit;
}

const TCA_BLOG = 'blog_post';

/** The only blocks an editor can add to a post. Each one has a renderer on the site. */
const TCA_BLOCKS = ['core/paragraph', 'core/heading', 'core/image', 'core/list', 'core/list-item', 'core/quote'];

/** Uploads: pictures only, and not larger than this. */
const TCA_UPLOAD_BYTES = 5 * 1024 * 1024;
const TCA_UPLOAD_MIMES = ['jpg|jpeg|jpe' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

/** Content types that carry a picture of their own (WordPress's "Featured image"). */
const TCA_WITH_IMAGE = [TCA_BLOG, 'team_member'];

add_action('after_setup_theme', fn () => add_theme_support('post-thumbnails', TCA_WITH_IMAGE));

/* ---------- From what the editor wrote to typed data ---------- */

function tca_safe_href($href): ?string {
	return is_string($href) && preg_match('#^(https?://|mailto:|/(?!/))#i', $href) ? $href : null;
}

/**
 * The text inside one element (P, H2, LI, FIGCAPTION, CITE) as runs of
 * { text, bold?, italic?, href? }. Any other markup is dropped, so nothing
 * an editor pastes can reach the site as HTML.
 */
function tca_inline(string $html, string $inside): array {
	$runs   = [];
	$bold   = 0;
	$italic = 0;
	$href   = null;
	$open   = false;
	$tags   = new WP_HTML_Tag_Processor($html);
	while ($tags->next_token()) {
		$kind = $tags->get_token_type();
		if ($kind === '#tag') {
			$name    = $tags->get_token_name();
			$closing = $tags->is_tag_closer();
			if ($name === $inside) {
				$open = !$closing;
			} elseif (!$open) {
				continue;
			} elseif ($name === 'STRONG' || $name === 'B') {
				$bold = max(0, $bold + ($closing ? -1 : 1));
			} elseif ($name === 'EM' || $name === 'I') {
				$italic = max(0, $italic + ($closing ? -1 : 1));
			} elseif ($name === 'A') {
				$href = $closing ? null : tca_safe_href($tags->get_attribute('href'));
			} elseif ($name === 'BR') {
				$runs[] = ['text' => "\n"];
			}
			continue;
		}
		if ($kind !== '#text' || !$open) {
			continue;
		}
		$text = $tags->get_modifiable_text();
		if ($text === '') {
			continue;
		}
		$run = ['text' => $text];
		if ($bold) {
			$run['bold'] = true;
		}
		if ($italic) {
			$run['italic'] = true;
		}
		if ($href) {
			$run['href'] = $href;
		}
		$last = count($runs) - 1;
		if ($last >= 0 && array_diff_key($runs[$last], ['text' => 1]) == array_diff_key($run, ['text' => 1])) {
			$runs[$last]['text'] .= $text;
		} else {
			$runs[] = $run;
		}
	}
	// Trim the ends, and drop the element altogether when nothing is left.
	if ($runs) {
		$runs[0]['text']                 = ltrim($runs[0]['text']);
		$runs[count($runs) - 1]['text'] = rtrim($runs[count($runs) - 1]['text']);
	}
	return array_values(array_filter($runs, fn ($run) => $run['text'] !== ''));
}

/** The alt text typed on an image block, or null when the block has none. */
function tca_block_alt(string $html): ?string {
	$tags = new WP_HTML_Tag_Processor($html);
	if (!$tags->next_tag('img')) {
		return null;
	}
	$alt = $tags->get_attribute('alt');
	return is_string($alt) ? trim($alt) : null;
}

/** A picture from the media library, in the shape the site expects. */
function tca_image_data(int $id, ?string $alt = null): ?array {
	$source = $id ? wp_get_attachment_image_src($id, 'full') : false;
	if (!$source || !$source[1] || !$source[2]) {
		return null;
	}
	return [
		'url'    => $source[0],
		'width'  => (int) $source[1],
		'height' => (int) $source[2],
		'alt'    => $alt ?? trim((string) get_post_meta($id, '_wp_attachment_image_alt', true)),
	];
}

function tca_featured_image(int $post_id): ?array {
	return tca_image_data((int) get_post_thumbnail_id($post_id));
}

function tca_blocks(string $content): array {
	$out = [];
	foreach (parse_blocks($content) as $block) {
		$html  = (string) ($block['innerHTML'] ?? '');
		$attrs = $block['attrs'] ?? [];
		$inner = $block['innerBlocks'] ?? [];
		switch ($block['blockName'] ?? '') {
			case 'core/paragraph':
				if ($runs = tca_inline($html, 'P')) {
					$out[] = ['type' => 'paragraph', 'content' => $runs];
				}
				break;
			case 'core/heading':
				$level = (int) ($attrs['level'] ?? 2);
				if ($runs = tca_inline($html, "H$level")) {
					$out[] = ['type' => 'heading', 'level' => $level <= 2 ? 2 : 3, 'content' => $runs];
				}
				break;
			case 'core/image':
				if ($image = tca_image_data((int) ($attrs['id'] ?? 0), tca_block_alt($html) ?? '')) {
					$out[] = ['type' => 'image', 'image' => $image, 'caption' => tca_inline($html, 'FIGCAPTION')];
				}
				break;
			case 'core/list':
				$items = [];
				foreach ($inner as $item) {
					if ($runs = tca_inline((string) ($item['innerHTML'] ?? ''), 'LI')) {
						$items[] = $runs;
					}
				}
				if ($items) {
					$out[] = ['type' => 'list', 'ordered' => !empty($attrs['ordered']), 'items' => $items];
				}
				break;
			case 'core/quote':
				$paragraphs = [];
				foreach ($inner as $item) {
					if ($runs = tca_inline((string) ($item['innerHTML'] ?? ''), 'P')) {
						$paragraphs[] = $runs;
					}
				}
				if ($paragraphs) {
					$out[] = ['type' => 'quote', 'paragraphs' => $paragraphs, 'cite' => tca_inline($html, 'CITE')];
				}
				break;
		}
	}
	return $out;
}

/** The extra fields a blog post or team member carries, for the public API and for drafts. */
function tca_entry_extras(WP_Post $post): array {
	$extras = [];
	if (in_array($post->post_type, TCA_WITH_IMAGE, true)) {
		$extras['tca_image'] = tca_featured_image($post->ID);
	}
	if ($post->post_type === TCA_BLOG) {
		$extras['tca_excerpt'] = trim($post->post_excerpt);
		$extras['tca_blocks']  = tca_blocks($post->post_content);
		// A draft has no UTC dates yet (WordPress stores zeros), so use the
		// time it was last saved.
		$utc = fn (string $gmt, string $local) => mysql_to_rfc3339((int) strtotime("$gmt UTC") > 0 ? $gmt : get_gmt_from_date($local));
		$extras['date_gmt']     = $utc($post->post_date_gmt, $post->post_modified);
		$extras['modified_gmt'] = $utc($post->post_modified_gmt, $post->post_modified);
	}
	return $extras;
}

add_action('rest_api_init', function () {
	foreach (['tca_image' => TCA_WITH_IMAGE, 'tca_excerpt' => [TCA_BLOG], 'tca_blocks' => [TCA_BLOG]] as $field => $types) {
		register_rest_field($types, $field, [
			'get_callback' => fn ($post) => tca_entry_extras(get_post($post['id']))[$field] ?? null,
		]);
	}
});

/* ---------- An editor that cannot break the design ---------- */

add_filter('allowed_block_types_all', function ($allowed, $context) {
	return ($context->post->post_type ?? '') === TCA_BLOG ? TCA_BLOCKS : $allowed;
}, 10, 2);

add_filter('block_editor_settings_all', function ($settings, $context) {
	if (($context->post->post_type ?? '') !== TCA_BLOG) {
		return $settings;
	}
	$settings['codeEditingEnabled']           = false; // no raw HTML view
	$settings['enableOpenverseMediaCategory'] = false; // no stock pictures from other sites
	$settings['maxUploadFileSize']            = min((int) ($settings['maxUploadFileSize'] ?? PHP_INT_MAX), TCA_UPLOAD_BYTES);
	return $settings;
}, 10, 2);

add_action('after_setup_theme', fn () => remove_theme_support('core-block-patterns'));
add_filter('should_load_remote_block_patterns', '__return_false');

/* Colours, type sizes and spacing belong to the site's design. The site
   ignores them anyway (it only reads text and pictures), so offering the
   controls would only mislead. */
add_filter('wp_theme_json_data_theme', function ($json) {
	return $json->update_with([
		'version'  => 3,
		'settings' => [
			'color'      => ['custom' => false, 'customGradient' => false, 'customDuotone' => false, 'defaultPalette' => false, 'defaultGradients' => false, 'defaultDuotone' => false, 'text' => false, 'background' => false, 'link' => false],
			'typography' => ['customFontSize' => false, 'defaultFontSizes' => false, 'dropCap' => false, 'fontStyle' => false, 'fontWeight' => false, 'letterSpacing' => false, 'lineHeight' => false, 'textDecoration' => false, 'textTransform' => false],
			'spacing'    => ['margin' => false, 'padding' => false, 'blockGap' => false],
			'border'     => ['color' => false, 'radius' => false, 'style' => false, 'width' => false],
		],
	]);
});

/* ---------- Uploads ---------- */

add_filter('upload_mimes', fn ($mimes) => current_user_can('manage_options') ? $mimes : TCA_UPLOAD_MIMES);
add_filter('upload_size_limit', fn ($bytes) => min((int) $bytes, TCA_UPLOAD_BYTES));

/* Content managers have none of WordPress's own post capabilities, which is
   what editing a picture's description or deleting an upload asks for.
   Being able to upload is enough for both. */
add_filter('map_meta_cap', function ($caps, $cap, $user_id, $args) {
	if (in_array($cap, ['edit_post', 'delete_post'], true) && $args && get_post_type((int) $args[0]) === 'attachment' && user_can($user_id, 'edit_tca_items')) {
		return ['upload_files'];
	}
	return $caps;
}, 10, 4);

/* ---------- Publish checks (the block editor saves through the REST API) ---------- */

function tca_blog_problem(string $title, string $excerpt, string $content, int $featured): ?string {
	if (trim($title) === '') {
		return 'Please give the post a title.';
	}
	if (tca_has_long_dash($title . $excerpt . $content)) {
		return TCA_DASH_MESSAGE;
	}
	if (!$featured) {
		return 'Please choose a header picture: open the "Featured image" box in the panel on the right.';
	}
	$words = false;
	foreach (parse_blocks($content) as $block) {
		$name = $block['blockName'] ?? '';
		if ($name === 'core/image') {
			if (empty($block['attrs']['id'])) {
				return 'One picture was added by web address. Please upload it instead, so it is stored with the site.';
			}
			if (!tca_block_alt((string) $block['innerHTML'])) {
				return 'One picture has no description. Click the picture and fill in "Alternative text" in the panel on the right: one sentence saying what it shows.';
			}
		} elseif ($name) {
			$words = true;
		}
	}
	return $words ? null : 'Please write some text before publishing.';
}

add_filter('rest_pre_insert_' . TCA_BLOG, function ($prepared, $request) {
	if (is_wp_error($prepared)) {
		return $prepared;
	}
	$existing = !empty($prepared->ID) ? get_post((int) $prepared->ID) : null;
	$status   = $prepared->post_status ?? ($existing->post_status ?? 'draft');
	if (!in_array($status, ['publish', 'future'], true)) {
		return $prepared; // drafts can be unfinished
	}
	$problem = tca_blog_problem(
		(string) ($prepared->post_title ?? ($existing->post_title ?? '')),
		(string) ($prepared->post_excerpt ?? ($existing->post_excerpt ?? '')),
		(string) ($prepared->post_content ?? ($existing->post_content ?? '')),
		$request->has_param('featured_media') ? (int) $request['featured_media'] : ($existing ? (int) get_post_thumbnail_id($existing->ID) : 0)
	);
	return $problem ? new WP_Error('tca_invalid', $problem, ['status' => 400]) : $prepared;
}, 10, 2);

/* ---------- Tell the site ---------- */

add_action('rest_after_insert_' . TCA_BLOG, fn ($post) => tca_notify_frontend($post->ID));

/* A team photo is set or removed in its own request, before anyone presses Update. */
foreach (['added', 'updated', 'deleted'] as $event) {
	add_action("{$event}_post_meta", function ($meta_id, $post_id, $key) {
		if ($key === '_thumbnail_id') {
			tca_notify_frontend((int) $post_id);
		}
	}, 10, 3);
}

/* ---------- Demo posts (first boot, and "Reset demo content") ---------- */

/** A seed picture in the media library: reused when it is already there. */
function tca_seed_image(string $file): int {
	$file  = basename($file);
	$found = get_posts(['post_type' => 'attachment', 'post_status' => 'inherit', 'meta_key' => '_tca_seed_file', 'meta_value' => $file, 'numberposts' => 1, 'fields' => 'ids']);
	if ($found && file_exists((string) get_attached_file($found[0]))) {
		return (int) $found[0];
	}
	$source = __DIR__ . "/seed-media/$file";
	if (!is_readable($source)) {
		return 0;
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$copy = wp_tempnam($file);
	copy($source, $copy);
	$id = media_handle_sideload(['name' => $file, 'tmp_name' => $copy], 0);
	if (is_wp_error($id)) {
		@unlink($copy);
		return 0;
	}
	update_post_meta($id, '_tca_seed_file', $file);
	return (int) $id;
}

function tca_inline_html(array $runs): string {
	$html = '';
	foreach ($runs as $run) {
		$part = esc_html($run['text']);
		if (!empty($run['bold'])) {
			$part = "<strong>$part</strong>";
		}
		if (!empty($run['italic'])) {
			$part = "<em>$part</em>";
		}
		if (!empty($run['href'])) {
			$part = '<a href="' . esc_url($run['href']) . '">' . $part . '</a>';
		}
		$html .= $part;
	}
	return $html;
}

/** Typed blocks (src/lib/blog-posts.ts) written out the way the block editor saves them. */
function tca_seed_markup(array $blocks): string {
	$paragraph = fn (array $runs) => "<!-- wp:paragraph -->\n<p>" . tca_inline_html($runs) . "</p>\n<!-- /wp:paragraph -->";
	$out       = [];
	foreach ($blocks as $block) {
		switch ($block['type']) {
			case 'paragraph':
				$out[] = $paragraph($block['content']);
				break;
			case 'heading':
				$level = (int) $block['level'];
				$out[] = '<!-- wp:heading' . ($level === 2 ? '' : " {\"level\":$level}") . " -->\n<h$level class=\"wp-block-heading\">" . tca_inline_html($block['content']) . "</h$level>\n<!-- /wp:heading -->";
				break;
			case 'image':
				$id = tca_seed_image($block['image']['src']);
				if (!$id) {
					break;
				}
				$caption = $block['caption'] ? '<figcaption class="wp-element-caption">' . tca_inline_html($block['caption']) . '</figcaption>' : '';
				$out[]   = "<!-- wp:image {\"id\":$id,\"sizeSlug\":\"full\",\"linkDestination\":\"none\"} -->\n<figure class=\"wp-block-image size-full\"><img src=\"" . esc_url(wp_get_attachment_url($id)) . '" alt="' . esc_attr($block['image']['alt']) . "\" class=\"wp-image-$id\"/>$caption</figure>\n<!-- /wp:image -->";
				break;
			case 'list':
				$tag   = $block['ordered'] ? 'ol' : 'ul';
				$items = array_map(fn ($runs) => "<!-- wp:list-item -->\n<li>" . tca_inline_html($runs) . "</li>\n<!-- /wp:list-item -->", $block['items']);
				$out[] = '<!-- wp:list' . ($block['ordered'] ? ' {"ordered":true}' : '') . " -->\n<$tag class=\"wp-block-list\">" . implode("\n\n", $items) . "</$tag>\n<!-- /wp:list -->";
				break;
			case 'quote':
				$cite  = $block['cite'] ? '<cite>' . tca_inline_html($block['cite']) . '</cite>' : '';
				$out[] = "<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\">" . implode("\n\n", array_map($paragraph, $block['paragraphs'])) . "$cite</blockquote>\n<!-- /wp:quote -->";
				break;
		}
	}
	return implode("\n\n", $out);
}

/** Creates one demo post with its pictures. Returns whether it was made. */
function tca_seed_blog_post(array $item): bool {
	$date = gmdate('Y-m-d H:i:s', strtotime($item['date']));
	// The markup is ours, so it is saved as written.
	kses_remove_filters();
	$id = wp_insert_post(wp_slash([
		'post_type'     => TCA_BLOG,
		'post_status'   => 'publish',
		'post_title'    => $item['title'],
		'post_name'     => $item['slug'],
		'post_excerpt'  => $item['excerpt'],
		'post_content'  => tca_seed_markup($item['blocks']),
		'post_date_gmt' => $date,
		'post_date'     => get_date_from_gmt($date),
	]));
	kses_init();
	if (!$id || is_wp_error($id)) {
		return false;
	}
	if (!empty($item['cover']['src']) && ($cover = tca_seed_image($item['cover']['src']))) {
		set_post_thumbnail($id, $cover);
	}
	return true;
}
