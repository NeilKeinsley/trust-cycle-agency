import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { draftMode } from "next/headers";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getBlogPosts } from "@/lib/cms";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { QuizTrigger } from "@/components/lead-quiz";
import { ClosingCta } from "@/components/home/closing-cta";
import { PreviewBanner } from "@/components/preview-banner";
import { PostDate } from "@/components/blog/post-body";
import { jsonLd } from "@/lib/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Notes from Trust Cycle Agency on briefs, process and launches: how brand, web and growth work gets done.",
  path: "/blog",
});

const breadcrumbs = breadcrumbJsonLd([
  ["Home", "/"],
  ["Blog", "/blog"],
]);

export default async function BlogPage() {
  const { isEnabled: draft } = await draftMode();
  const posts = await getBlogPosts({ draft });

  return (
    <>
      {draft && <PreviewBanner />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />
      <PageHero
        title="Notes from the work."
        lead="Short pieces on briefs, process and launches. What we have learned doing the work, written so you can use it without hiring us."
      >
        <QuizTrigger variant="on-dark">Start a project</QuizTrigger>
      </PageHero>

      <Section>
        {posts.length === 0 ? (
          <p className="max-w-[55ch] text-lg text-muted">
            Nothing has been published yet. New posts will appear here.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, i) => (
              <li key={post.slug}>
                <Reveal delay={i * 80} className="h-full">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-card transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {/* Decorative here: the title beside it names the post. */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-accent-soft">
                      {post.cover && (
                        <Image
                          src={post.cover.src}
                          alt=""
                          fill
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          preload={i === 0}
                          className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.02]"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <PostDate date={post.date} className="text-sm text-muted" />
                      <h2 className="mt-2 text-2xl sm:text-3xl">{post.title}</h2>
                      <p className="mt-3 max-w-[55ch] leading-relaxed text-muted">{post.excerpt}</p>
                      <span className="mt-auto pt-6 text-sm text-foreground">
                        <span className="link-line">Read the post</span>
                        <span aria-hidden="true"> →</span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-10 max-w-[65ch] text-sm text-muted">
          Trust Cycle Agency is a portfolio concept. These posts describe a way of working and claim
          no client results.
        </p>
      </Section>

      <ClosingCta />
    </>
  );
}
