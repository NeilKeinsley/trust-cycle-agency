/**
 * Blog content model, and the built-in posts the site shows when WordPress is
 * not connected (see cms.ts). The same posts seed the WordPress demo
 * (npm run wp:seed), with their images copied from public/blog.
 *
 * A post body is a list of typed blocks, never HTML: WordPress converts what
 * the editor wrote into this shape (tca_blocks in tca-headless.php) and the
 * site renders each block with its own components.
 */

/** A run of text. Formatting is flags, so no markup ever reaches the page. */
export type Inline = { text: string; bold?: boolean; italic?: boolean; href?: string };

export type CmsImage = { src: string; width: number; height: number; alt: string };

export type Block =
  | { type: "paragraph"; content: Inline[] }
  | { type: "heading"; level: 2 | 3; content: Inline[] }
  | { type: "image"; image: CmsImage; caption: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; paragraphs: Inline[][]; cite: Inline[] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO 8601, UTC. */
  date: string;
  modified: string;
  cover: CmsImage | null;
  blocks: Block[];
};

const t = (text: string): Inline[] => [{ text }];
const p = (text: string): Block => ({ type: "paragraph", content: t(text) });
const h = (text: string): Block => ({ type: "heading", level: 2, content: t(text) });
const cover = (file: string): CmsImage => ({ src: `/blog/${file}`, width: 1600, height: 900, alt: "" });

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-a-useful-project-brief-includes",
    title: "What a useful project brief includes",
    excerpt:
      "A brief does not need to be long. It needs to say what is wrong today, who it is for, and where the edges are.",
    date: "2026-09-29T09:00:00Z",
    modified: "2026-09-29T09:00:00Z",
    cover: cover("brief.jpg"),
    blocks: [
      p(
        "Most briefs we receive describe a solution: a new website, a rebrand, a campaign. The useful ones describe a problem first. That difference decides how the first month of a project goes."
      ),
      h("Start with what is not working"),
      p(
        "One specific story beats a page of adjectives. Tell us about the enquiry that went to a competitor, or the page your own team avoids sending to customers. A concrete problem can be checked later. A wish for something more modern cannot."
      ),
      h("Four things to write down"),
      {
        type: "list",
        ordered: false,
        items: [
          [{ text: "The problem. ", bold: true }, { text: "What happens today, and why that is costing you." }],
          [{ text: "The audience. ", bold: true }, { text: "Who you most need to reach, in plain words." }],
          [{ text: "The scope. ", bold: true }, { text: "What you expect to receive at the end." }],
          [{ text: "The limits. ", bold: true }, { text: "Budget range, deadline, and anything that cannot change." }],
        ],
      },
      {
        type: "image",
        image: {
          src: "/blog/brief-outline.jpg",
          width: 1600,
          height: 900,
          alt: "Four cards in a row, one for each part of a brief: problem, audience, scope and limits.",
        },
        caption: t("Four short sections are enough to start a useful conversation."),
      },
      h("What you can leave out"),
      p(
        "You do not need a sitemap, a list of features or a colour preference. Those come out of the work. If you already have opinions on them, share them as opinions and we will treat them that way."
      ),
      {
        type: "paragraph",
        content: [
          { text: "If you would rather answer questions than write a document, " },
          { text: "the project form", href: "/start" },
          { text: " asks for the same four things." },
        ],
      },
    ],
  },
  {
    slug: "why-we-show-our-working",
    title: "Why we show our working",
    excerpt:
      "Sharing unfinished work feels risky. In our experience it is the cheapest way to avoid building the wrong thing.",
    date: "2026-09-22T09:00:00Z",
    modified: "2026-09-22T09:00:00Z",
    cover: cover("working.jpg"),
    blocks: [
      p(
        "There is a familiar way to run a project: disappear for six weeks, then present something polished. It makes for a good meeting. It also means the first real feedback arrives when changing direction is most expensive."
      ),
      h("Small steps, shown early"),
      p(
        "We would rather show a rough page in week one than a finished one in week six. Rough work invites honest reactions, because nobody feels they are criticising something precious."
      ),
      {
        type: "quote",
        paragraphs: [t("A decision made in the open can be questioned. A decision made in private can only be discovered.")],
        cite: t("A note from our project guide"),
      },
      h("What that looks like in practice"),
      {
        type: "list",
        ordered: true,
        items: [
          t("A shared plan with dates marked as estimates, updated on the same day each week."),
          t("A working link from the first week, even when most of it is placeholder."),
          t("A written record of each decision and what it was chosen over."),
        ],
      },
      p(
        "None of this is unusual. It is simply easier to skip than to do, so we treat it as part of the work and not an extra."
      ),
    ],
  },
  {
    slug: "a-launch-is-a-starting-line",
    title: "A launch is a starting line",
    excerpt:
      "The day a site goes live is the first day you can learn how real visitors use it. Plan for what happens next.",
    date: "2026-09-15T09:00:00Z",
    modified: "2026-09-15T09:00:00Z",
    cover: cover("launch.jpg"),
    blocks: [
      p(
        "Launch day gets the attention, and it should be calm. If the work before it was done in small, tested steps, going live is one more step and not a leap."
      ),
      h("Before the switch"),
      p(
        "We rehearse on a copy of the site that matches the real one, and we write down the exact way back before we need it. A way back that has never been tried is a hope, not a plan."
      ),
      h("After the switch"),
      p(
        "The first weeks are for watching. Which pages do people actually open? Where do they stop? Does the enquiry form reach someone? These are signals, not verdicts, and they shape what is worth changing first."
      ),
      {
        type: "paragraph",
        content: [
          { text: "A site that its owners can update themselves keeps improving after we step back. That is why handover and training have their own dates in our plans. " },
          { text: "See how we approach the work.", href: "/work" },
        ],
      },
    ],
  },
];
