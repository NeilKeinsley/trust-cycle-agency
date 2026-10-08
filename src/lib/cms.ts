import { z } from "zod";
import type { FaqItem } from "@/components/faq";
import { CASE_STUDIES, TEAM, TESTIMONIALS, type CaseStudy, type MockupKind } from "./fixtures";
import { FAQS } from "./faqs";
import { BLOG_POSTS, type Block, type BlogPost, type CmsImage, type Inline } from "./blog-posts";

/**
 * Headless WordPress content (proof of concept, see docs/HEADLESS_WP.md).
 *
 * Case studies, FAQs, testimonials, team members and blog posts are read from
 * WordPress over the REST API when WP_API_URL is set. The code fixtures stay as the
 * fallback, so
 * the site builds and serves with WordPress unset, down or returning rubbish:
 *
 *   WP_API_URL unset           -> fixtures
 *   WordPress unreachable      -> last content this server read, else fixtures
 *   one entry fails validation -> that entry is skipped and logged
 *
 * Published content is cached under CMS_TAG until WordPress calls
 * /api/revalidate, or for an hour at most. Draft Mode (/api/draft) bypasses the cache and reads
 * drafts from a secret-protected endpoint instead.
 */

export const CMS_TAG = "cms";

/* Safety net for a missed webhook (WordPress sends it without waiting for a
   reply): cached content is re-read at most this long after it was fetched. */
const REFRESH_SECONDS = 3600;

export type Testimonial = { quote: string; name: string; role: string; company: string };
export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  currentFocus: string;
  /** From WordPress's "Featured image". Without one the card shows the monogram. */
  photo: CmsImage | null;
};

type Options = { draft?: boolean };

function apiBase(): string | null {
  return process.env.WP_API_URL?.replace(/\/+$/, "") || null;
}

/* The site's copy rules can't be enforced inside WordPress, so the one that
   is mechanically checkable (no em-dashes in visible copy, see AGENTS.md) is
   enforced here: an entry that breaks it is skipped, not published. */
const copy = z
  .string()
  .trim()
  .min(1)
  .refine((v) => !v.includes("—"), "Em-dashes are not allowed in visible copy");

/** A textarea with one item per line. */
const lines = copy.transform((v) =>
  v
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
);

const optionalCopy = z
  .string()
  .nullish()
  .transform((v) => v?.trim() ?? "")
  .refine((v) => !v.includes("—"), "Em-dashes are not allowed in visible copy");

/* Pictures come from the connected WordPress's media library and nowhere
   else: that folder is the only remote source next.config.ts lets the image
   optimiser read, so any other address would render as a broken image. */
function mediaPrefix(): string | null {
  const api = apiBase();
  return api ? `${new URL(api).origin}/wp-content/uploads/` : null;
}

const imageSchema = z
  .object({
    url: z.string().refine((v) => {
      const prefix = mediaPrefix();
      return prefix !== null && v.startsWith(prefix);
    }, "Pictures must be uploaded to the WordPress media library"),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: optionalCopy,
  })
  .transform(({ url, ...rest }): CmsImage => ({ src: url, ...rest }));

/* A blog post body arrives as typed blocks (tca_blocks in tca-blog.php), not
   HTML. Text is runs with formatting flags; links are limited to web, mail
   and same-site addresses. */
const inlineSchema: z.ZodType<Inline> = z.object({
  text: z
    .string()
    .min(1)
    .refine((v) => !v.includes("—"), "Em-dashes are not allowed in visible copy"),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  href: z
    .string()
    .regex(/^(https?:\/\/|mailto:|\/(?!\/))/i)
    .optional(),
});

const runs = z.array(inlineSchema);
const text = runs.min(1);

const blockSchema: z.ZodType<Block> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), content: text }),
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), content: text }),
  z.object({ type: z.literal("image"), image: imageSchema, caption: runs }),
  z.object({ type: z.literal("list"), ordered: z.boolean(), items: z.array(text).min(1) }),
  z.object({ type: z.literal("quote"), paragraphs: z.array(text).min(1), cite: runs }),
]);

const MOCKUPS = ["browser", "logo", "campaign", "search"] as const satisfies readonly MockupKind[];

const entry = <T extends z.ZodType>(acf: T) =>
  z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), tca_title: copy, acf });

const caseStudySchema = entry(
  z.object({
    tags: z.array(copy).min(1),
    mockup: z.enum(MOCKUPS),
    outcome: copy,
    summary: copy,
    sector: copy,
    engagement: copy,
    situation: lines,
    approach_1_title: optionalCopy,
    approach_1_body: optionalCopy,
    approach_2_title: optionalCopy,
    approach_2_body: optionalCopy,
    approach_3_title: optionalCopy,
    approach_3_body: optionalCopy,
    shipped: lines,
    changed: copy,
    watched: lines,
  })
).transform(({ slug, tca_title, acf }): CaseStudy => ({
  slug,
  client: tca_title,
  tags: acf.tags,
  outcome: acf.outcome,
  mockup: acf.mockup,
  summary: acf.summary,
  sector: acf.sector,
  engagement: acf.engagement,
  situation: acf.situation,
  // ACF free has no repeater: the approach is three fixed title/body pairs.
  approach: [
    { title: acf.approach_1_title, body: acf.approach_1_body },
    { title: acf.approach_2_title, body: acf.approach_2_body },
    { title: acf.approach_3_title, body: acf.approach_3_body },
  ].filter((step) => step.title && step.body),
  shipped: acf.shipped,
  changed: acf.changed,
  watched: acf.watched,
}));

const faqSchema = entry(z.object({ answer: copy })).transform(
  ({ tca_title, acf }): FaqItem => ({ q: tca_title, a: acf.answer })
);

const testimonialSchema = entry(z.object({ quote: copy, role: copy, company: copy })).transform(
  ({ tca_title, acf }): Testimonial => ({ name: tca_title, ...acf })
);

const teamSchema = entry(z.object({ role: copy, focus: copy, current_focus: copy }))
  .extend({ tca_image: imageSchema.nullish() })
  .transform(
    ({ tca_title, acf, tca_image }): TeamMember => ({
      name: tca_title,
      role: acf.role,
      focus: acf.focus,
      currentFocus: acf.current_focus,
      photo: tca_image ?? null,
    })
  );

/** WordPress gives UTC times without a zone marker. */
const utc = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  .transform((v) => (/(Z|[+-]\d{2}:\d{2})$/.test(v) ? v : `${v}Z`));

const EXCERPT_LENGTH = 180;

/** The post's own summary, or the start of its first paragraph when the editor left it empty. */
function excerptFor(excerpt: string, blocks: Block[]): string {
  if (excerpt) return excerpt;
  const first = blocks.find((block) => block.type === "paragraph");
  const opening = first ? first.content.map((run) => run.text).join("").replace(/\s+/g, " ").trim() : "";
  if (opening.length <= EXCERPT_LENGTH) return opening;
  return `${opening.slice(0, opening.lastIndexOf(" ", EXCERPT_LENGTH))}…`;
}

const blogSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    tca_title: copy,
    tca_excerpt: optionalCopy,
    date_gmt: utc,
    modified_gmt: utc,
    tca_image: imageSchema.nullable(),
    // May be empty: a draft can be previewed before any text is written, and
    // WordPress refuses to publish a post with no text (tca-blog.php).
    tca_blocks: z.array(blockSchema),
  })
  .transform(
    (post): BlogPost => ({
      slug: post.slug,
      title: post.tca_title,
      excerpt: excerptFor(post.tca_excerpt, post.tca_blocks),
      date: post.date_gmt,
      modified: post.modified_gmt,
      cover: post.tca_image,
      blocks: post.tca_blocks,
    })
  );

/** Last content read from WordPress, per collection, for when it goes away. */
const lastGood = new Map<string, unknown[]>();

/** WordPress returns at most 100 entries per request, so longer lists are paged. */
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

/* What to ask the public API for: page order and the ACF fields, or for the
   blog, newest first with the typed body. */
const ORDERED = "orderby=menu_order&order=asc&_fields=id,slug,tca_title,acf,tca_image";
const DATED =
  "orderby=date&order=desc&_fields=id,slug,date_gmt,modified_gmt,tca_title,tca_excerpt,tca_image,tca_blocks";

async function fetchEntries(
  api: string,
  restBase: string,
  draft: boolean,
  query: string
): Promise<unknown[]> {
  const signal = AbortSignal.timeout(8000);
  const list = z.array(z.unknown());

  if (draft) {
    const response = await fetch(`${api}/tca/v1/content/${restBase}`, {
      cache: "no-store",
      headers: { "x-webhook-secret": process.env.WP_SHARED_SECRET ?? "" },
      signal,
    });
    if (!response.ok) throw new Error(`WordPress answered ${response.status}`);
    return list.parse(await response.json());
  }

  const entries: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await fetch(
      `${api}/wp/v2/${restBase}?per_page=${PAGE_SIZE}&page=${page}&${query}`,
      { next: { tags: [CMS_TAG], revalidate: REFRESH_SECONDS }, signal }
    );
    if (!response.ok) throw new Error(`WordPress answered ${response.status}`);
    entries.push(...list.parse(await response.json()));
    if (page >= Number(response.headers.get("x-wp-totalpages") ?? 1)) break;
  }
  return entries;
}

async function load<T>(
  restBase: string,
  schema: z.ZodType<T>,
  fallback: readonly T[],
  { draft = false }: Options,
  { query = ORDERED, allowEmpty = false }: { query?: string; allowEmpty?: boolean } = {}
): Promise<T[]> {
  const api = apiBase();
  if (!api) return [...fallback];

  try {
    const items: T[] = [];
    for (const raw of await fetchEntries(api, restBase, draft, query)) {
      const parsed = schema.safeParse(raw);
      if (parsed.success) items.push(parsed.data);
      else console.warn(`[cms] skipped a ${restBase} entry:`, z.prettifyError(parsed.error));
    }
    // An empty collection is treated as a failed read: WordPress mid-install
    // also answers [], and the page layouts assume there is content. The blog
    // is the exception (allowEmpty): no posts is a state its pages handle.
    if (items.length === 0 && !allowEmpty) throw new Error("no valid entries");
    if (!draft) lastGood.set(restBase, items);
    return items;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[cms] ${restBase} unavailable, using fallback content: ${reason}`);
    return (lastGood.get(restBase) as T[] | undefined) ?? [...fallback];
  }
}

export function getCaseStudies(options: Options = {}): Promise<CaseStudy[]> {
  return load("case-studies", caseStudySchema, CASE_STUDIES, options);
}

export function getFaqs(options: Options = {}): Promise<FaqItem[]> {
  return load("faqs", faqSchema, FAQS, options);
}

export function getTeam(options: Options = {}): Promise<TeamMember[]> {
  return load(
    "team",
    teamSchema,
    TEAM.map((member) => ({ ...member, photo: null })),
    options
  );
}

/** Newest first. */
export function getBlogPosts(options: Options = {}): Promise<BlogPost[]> {
  return load("blog", blogSchema, BLOG_POSTS, options, { query: DATED, allowEmpty: true });
}

export function getTestimonials(options: Options = {}): Promise<Testimonial[]> {
  return load("testimonials", testimonialSchema, TESTIMONIALS, options);
}
