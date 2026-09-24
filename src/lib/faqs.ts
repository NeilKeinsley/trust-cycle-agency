/**
 * Shared FAQ content. The homepage teaser (`FaqTeaser`) shows the first five;
 * `/faq` shows the full list. Keep entries generic and non-numeric: no
 * invented pricing, timelines, or client counts presented as fact.
 */
import type { FaqItem } from "@/components/faq";

export const FAQS: FaqItem[] = [
  {
    q: "How much does a project cost?",
    a: "It depends on scope: a brand refresh, a full website build and an ongoing marketing retainer all price differently. Tell us what you need in the intake quiz or a quick call and we will come back with a clear, custom quote before any work starts.",
  },
  {
    q: "How long does a typical project take?",
    a: "A focused website or brand project usually moves in phases over several weeks, from discovery through build to launch. Ongoing marketing and SEO work runs continuously. We will map out a realistic timeline together once we understand your goals.",
  },
  {
    q: "Do you require long-term contracts?",
    a: "No. Project work is scoped and billed per engagement, and retainers run month to month. You can pause or step away with reasonable notice. We would rather earn the renewal than lock you into one.",
  },
  {
    q: "Who owns the work when we are done?",
    a: "You do. Final designs, code, copy, and accounts we set up on your behalf are yours to keep, use, and move elsewhere, whether we continue working together or not.",
  },
  {
    q: "What tools and platforms do you use?",
    a: "We pick the right tool for the job rather than forcing every client onto one stack: common choices include modern web frameworks, popular CMS and ecommerce platforms, and the major ad and analytics tools. We will explain our recommendation and why it fits.",
  },
  {
    q: "How do you report on progress and results?",
    a: "You get a plain-language update on a regular cadence covering what shipped, what we learned, and what is next, plus a shared dashboard for campaigns and SEO so you are never waiting on us for a status check.",
  },
  {
    q: "How do we communicate day to day?",
    a: "Most clients land on a shared chat channel plus a recurring check-in call. You will always have a named point of contact on our team who knows your project, not a rotating queue.",
  },
  {
    q: "Do you work with small businesses, or only larger teams?",
    a: "Both. We shape the engagement to the size of the need: a small business might start with a single website sprint, while a larger team might bring us on for brand, web and ongoing growth work together.",
  },
  {
    q: "What happens after launch?",
    a: "We do not disappear at go-live. Most clients move into a lighter retainer for support, updates and iteration, or check back in when the next project comes up. Either way, we hand off clean documentation so you are never stuck.",
  },
  {
    q: "How do we get started?",
    a: "Take the short intake quiz to tell us about your project, or reach out directly. We will follow up to ask a few clarifying questions and, if it is a fit, set up an initial call.",
  },
];
