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

export const CASE_STUDIES: {
  client: string;
  tags: string[];
  outcome: string;
  mockup: MockupKind;
}[] = [
  {
    client: "Northwind",
    tags: ["Website", "Brand"],
    outcome:
      "A full rebrand and site rebuild gave Northwind a clearer story and a homepage their sales team actually links to.",
    mockup: "browser",
  },
  {
    client: "Brightline",
    tags: ["Marketing", "SEO"],
    outcome:
      "A combined content and paid push helped Brightline show up for the searches their customers were already running.",
    mockup: "campaign",
  },
  {
    client: "Oakridge",
    tags: ["Brand", "Social"],
    outcome:
      "A new identity system and social presence brought Oakridge's in-store feel online for the first time.",
    mockup: "logo",
  },
  {
    client: "Halcyon",
    tags: ["Website", "SEO"],
    outcome:
      "A rebuilt site and cleaned-up content made Halcyon easier to find for the searches that actually matter to them.",
    mockup: "search",
  },
];

export const TEAM = [
  { name: "Jordan Ames", role: "Strategy", focus: "Positioning and research" },
  { name: "Priya Nair", role: "Design", focus: "Identity and interface" },
  { name: "Marcus Cole", role: "Engineering", focus: "Build and performance" },
  { name: "Sam Whitfield", role: "Growth", focus: "Campaigns and reporting" },
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
