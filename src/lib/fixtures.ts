/**
 * Fictional client, work, team and testimonial content shared across the
 * homepage sections. Trust Cycle Agency is a portfolio piece: every name
 * below is invented, and outcomes are described qualitatively on purpose
 * (see AGENTS.md — no invented statistics presented as fact).
 */

export type ClientMark = "circle" | "triangle" | "bars" | "diamond" | "hex" | "wave";

/* Client rail content: each cell is a real logomark + service caption, not
   decorative text (see AGENTS.md — the client rail is the one sanctioned
   marquee). `service` feeds the first row, `serviceAlt` the reversed second
   row, so the two rows read as distinct, truthful captions rather than a
   duplicate loop. */
export const CLIENTS: {
  name: string;
  mark: ClientMark;
  service: string;
  serviceAlt: string;
}[] = [
  { name: "Northwind", mark: "circle", service: "Brand + Web", serviceAlt: "Ongoing retainer" },
  { name: "Halcyon", mark: "triangle", service: "Website build", serviceAlt: "SEO + content" },
  { name: "Brightline", mark: "bars", service: "Marketing + SEO", serviceAlt: "Paid search" },
  { name: "Oakridge", mark: "diamond", service: "Brand + social", serviceAlt: "Identity system" },
  { name: "Parallel", mark: "hex", service: "Full partnership", serviceAlt: "Campaign strategy" },
  { name: "Meridian Co.", mark: "wave", service: "Website + growth", serviceAlt: "Reporting" },
];

export type MockupKind = "browser" | "logo" | "campaign" | "search";

export type CaseStudy = {
  slug: string;
  client: string;
  tags: string[];
  /** Short line used on the homepage bento. */
  outcome: string;
  mockup: MockupKind;
  /** Meta description and page lead. */
  summary: string;
  /** Honestly generic sector, never a real-sounding company profile. */
  sector: string;
  engagement: string;
  situation: string[];
  approach: { title: string; body: string }[];
  shipped: string[];
  changed: string;
  /** What the team watched to judge the work. Signals, not invented results. */
  watched: string[];
};

/* Case studies read as illustrative on purpose: no figures, dates, quotes or
   named people, because the clients are invented (see AGENTS.md). Each one
   shows how the work was reasoned, which is the part a real case study
   can't fake either. Order here is the order on /work pages ("next study"). */
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "northwind",
    client: "Northwind",
    tags: ["Website", "Brand"],
    outcome:
      "A full rebrand and site rebuild gave Northwind a clearer story and a homepage their sales team actually links to.",
    mockup: "browser",
    summary:
      "A rebrand and site rebuild for a regional distribution business whose sales team had stopped sending prospects to its own website.",
    sector: "Regional distribution",
    engagement: "Project, then an ongoing retainer",
    situation: [
      "Northwind's sales reps were sending prospects PDFs instead of the website. The site described the company in the language of its founding decade, and every rep had built their own deck to fill the gap, each with a slightly different logo.",
      "The ask was a new website. The problem underneath it was that nobody could say in one sentence what Northwind did better than the competitors a buyer would also call.",
    ],
    approach: [
      {
        title: "Start with the people doing the selling",
        body: "We sat in on first calls and asked reps which questions came up before a prospect trusted them. Those questions became the site's structure, in the order buyers actually asked them.",
      },
      {
        title: "One sentence before any design",
        body: "Positioning came first: a single line the sales team could say out loud without flinching. The identity work only started once that line survived a week of real calls.",
      },
      {
        title: "Refine the mark instead of replacing it",
        body: "Existing customers recognised the old logo, so we tightened it rather than starting over, then built the type, colour and layout rules around it.",
      },
    ],
    shipped: [
      "Positioning line and a short messaging guide for the sales team",
      "Refined logo, type scale and colour system",
      "Rebuilt website organised around the questions from first calls",
      "One shared deck template to replace the rep-made versions",
    ],
    changed:
      "Reps started linking to the homepage instead of attaching files, and the deck stopped drifting because there was finally one source to copy from. The retainer that followed keeps the site current as the product range changes.",
    watched: [
      "How often reps shared site links compared with attachments",
      "Enquiries that arrived through the new service pages",
      "Which first-call questions still came up, as a sign the site hadn't answered them",
    ],
  },
  {
    slug: "brightline",
    client: "Brightline",
    tags: ["Marketing", "SEO"],
    outcome:
      "A combined content and paid push helped Brightline show up for the searches their customers were already running.",
    mockup: "campaign",
    summary:
      "Content and paid search rebuilt around the questions Brightline's customers already type, replacing keywords the team had guessed at.",
    sector: "Business services",
    engagement: "Retainer",
    situation: [
      "Brightline paid for broad keywords that brought plenty of clicks and very few enquiries. Its blog was written for other people in the industry, which made it pleasant to read and invisible to buyers.",
      "Paid and content were run by different people with different reports, so neither could see what the other was learning.",
    ],
    approach: [
      {
        title: "Mine the questions that already exist",
        body: "We pulled the questions prospects asked on sales calls and the search terms already showing up in Search Console, then grouped them by what the person was trying to decide.",
      },
      {
        title: "One page per decision",
        body: "Each group got a page written to answer it plainly. Service pages were rewritten first, because that's where a ready buyer lands.",
      },
      {
        title: "Point paid at the pages, not the homepage",
        body: "Budget moved from broad terms to searches with clear buying intent, and each ad sent people to the page written for that question. Paid results told us which topics deserved more content.",
      },
    ],
    shipped: [
      "Question map built from sales calls and Search Console",
      "Rewritten service pages and a small set of answer articles",
      "Restructured ad account, with ads matched to landing pages",
      "One monthly report covering paid and organic together",
    ],
    changed:
      "Brightline began appearing for the searches its customers were already running, and the two channels stopped competing for credit once they shared a plan and a report.",
    watched: [
      "Impressions and clicks for the priority questions in Search Console",
      "Cost per enquiry in the ad account, before and after the restructure",
      "Which answer pages people read before getting in touch",
    ],
  },
  {
    slug: "oakridge",
    client: "Oakridge",
    tags: ["Brand", "Social"],
    outcome:
      "A new identity system and social presence brought Oakridge's in-store feel online for the first time.",
    mockup: "logo",
    summary:
      "An identity system and social presence for a well-loved local shop whose online presence looked nothing like the store.",
    sector: "Independent retail",
    engagement: "Project",
    situation: [
      "People who visited Oakridge loved it: the staff, the fittings, the hand-painted signs. Online it was stock photos and sale announcements, and nobody who found it there would guess what walking in felt like.",
      "The team had tried posting more often. More of the same didn't help.",
    ],
    approach: [
      {
        title: "Spend time in the store first",
        body: "We worked from the shop floor for several days, photographing real staff and products in the store's own light, and noting what customers stopped to look at.",
      },
      {
        title: "Build the identity from what's already there",
        body: "The type and palette came from the shop's signage and materials, so the brand online and the store in person finally match.",
      },
      {
        title: "Make it something the staff can run",
        body: "Social templates and a short posting guide replaced a content calendar nobody had time for. The staff post; the system keeps it looking like Oakridge.",
      },
    ],
    shipped: [
      "Identity system drawn from the store's signage and materials",
      "Photo library of real staff, products and spaces",
      "Social templates and a posting guide for the in-store team",
    ],
    changed:
      "The accounts now look like the shop, and the team posts on its own without waiting on an agency. New customers arrive knowing what the place is like.",
    watched: [
      "Saves and shares, which say more than likes for a shop people visit",
      "Customers mentioning social media at the till",
      "Whether the team kept posting after the handover",
    ],
  },
  {
    slug: "halcyon",
    client: "Halcyon",
    tags: ["Website", "SEO"],
    outcome:
      "A rebuilt site and cleaned-up content made Halcyon easier to find for the searches that actually matter to them.",
    mockup: "search",
    summary:
      "A technical cleanup and site rebuild for a business whose best pages were buried under years of duplicates on an ageing CMS.",
    sector: "Professional services",
    engagement: "Project, with SEO support after launch",
    situation: [
      "Years of publishing on an ageing CMS had left Halcyon with several near-identical pages for most of its services, slow templates and no clear signal about which page should rank.",
      "Search engines were splitting attention across the duplicates, so none of them performed well.",
    ],
    approach: [
      {
        title: "Audit before rebuilding",
        body: "We started with what search engines actually saw: which pages were indexed, which ones competed with each other, and how fast the templates loaded on a phone.",
      },
      {
        title: "Consolidate, then redirect",
        body: "Overlapping pages were merged into one strong page per service, and every retired URL was redirected to its closest match, so no existing link was lost.",
      },
      {
        title: "Rebuild for speed and clarity",
        body: "New templates, one heading structure per page type, and copy rewritten around what people searching for each service need to know.",
      },
    ],
    shipped: [
      "Technical audit and a consolidation plan",
      "Redirect map covering every retired URL",
      "Rebuilt site with faster templates",
      "Search Console setup and a baseline taken before launch",
    ],
    changed:
      "Each service now has one page doing the work instead of several splitting it, and Halcyon is easier to find for the searches that matter to them. The baseline taken before launch means every later claim can be checked.",
    watched: [
      "Indexed pages against duplicates in Search Console",
      "Clicks and impressions for the priority service searches",
      "Core Web Vitals on the new templates",
    ],
  },
];

export function caseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

/* `focus` is the specialty shown under the role; `currentFocus` is a
   one-line, honestly generic note on what that person is working on right
   now (see AGENTS.md — no invented stats or client specifics). Sam's reads
   as a short first-person line rather than a label, so the dark card in
   the tone progression carries its own composition instead of repeating
   the other three (see team.tsx). */
export const TEAM = [
  {
    name: "Jordan Ames",
    role: "Strategy",
    focus: "Positioning and research",
    currentFocus: "Positioning for a regional services brand",
  },
  {
    name: "Priya Nair",
    role: "Design",
    focus: "Identity and interface",
    currentFocus: "A visual identity refresh for a returning client",
  },
  {
    name: "Marcus Cole",
    role: "Engineering",
    focus: "Build and performance",
    currentFocus: "Rebuilding a site's performance from the ground up",
  },
  {
    name: "Sam Whitfield",
    role: "Growth",
    focus: "Campaigns and reporting",
    currentFocus: "“Reporting people actually read is half the job.”",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "They asked better questions than agencies we had worked with before, and it showed up in the work. Nothing felt generic.",
    name: "Elena Marsh",
    role: "Marketing Lead",
    company: "Halcyon",
  },
  {
    quote:
      "We came in for a website and stayed for the ongoing strategy. It is the first team that has treated our account like a partnership.",
    name: "Devon Okafor",
    role: "Founder",
    company: "Parallel",
  },
  {
    quote:
      "Communication was steady and honest the whole way through, even when a timeline had to shift. We always knew where things stood.",
    name: "Grace Liu",
    role: "Operations Director",
    company: "Meridian Co.",
  },
] as const;

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
