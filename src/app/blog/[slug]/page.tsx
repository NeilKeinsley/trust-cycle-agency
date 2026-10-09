import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getBlogPosts } from "@/lib/cms";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { ClosingCta } from "@/components/home/closing-cta";
import { PreviewBanner } from "@/components/preview-banner";
import { PostBody, PostDate } from "@/components/blog/post-body";
import { jsonLd } from "@/lib/json-ld";

/* Known posts are prerendered. A post published in the CMS after the build is
   rendered on first visit; anything unknown still 404s (notFound below). */
export async function generateStaticParams() {
  return (await getBlogPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getBlogPosts()).find((p) => p.slug === slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.cover ?? undefined,
    article: { published: post.date, modified: post.modified },
  });
}

/** Absolute address for structured data: built-in pictures are site paths. */
const absolute = (src: string) => (src.startsWith("/") ? `${SITE_URL}${src}` : src);

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const { isEnabled: draft } = await draftMode();
  const posts = await getBlogPosts({ draft });
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const index = posts.indexOf(post);
  const next = posts.length > 1 ? posts[(index + 1) % posts.length] : null;
  const path = `/blog/${post.slug}`;
  const structuredData = [
    breadcrumbJsonLd([
      ["Home", "/"],
      ["Blog", "/blog"],
      [post.title, path],
    ]),
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.modified,
      mainEntityOfPage: `${SITE_URL}${path}`,
      author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      ...(post.cover ? { image: absolute(post.cover.src) } : {}),
    },
  ];

  return (
    <>
      {draft && <PreviewBanner />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />

      <Section className="lg:pt-16">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-line hover:text-foreground">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="link-line hover:text-foreground">Blog</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">{post.title}</li>
          </ol>
        </nav>

        <article>
          <header className="lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-12">
            <div className="lg:col-span-8">
              <Reveal immediate>
                <PostDate
                  date={post.date}
                  className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-accent"
                />
              </Reveal>
              <Reveal immediate delay={90}>
                <h1 className="mt-4 text-4xl leading-[1.02] sm:text-6xl lg:text-7xl">{post.title}</h1>
              </Reveal>
            </div>
            <Reveal immediate delay={160} className="mt-6 lg:col-span-4 lg:mt-0">
              <p className="max-w-md text-lg text-muted">{post.excerpt}</p>
            </Reveal>
          </header>

          {post.cover && (
            <Reveal immediate delay={220}>
              <div className="relative mt-10 aspect-[16/9] max-h-[70svh] w-full overflow-hidden rounded-[var(--radius-card)] bg-accent-soft lg:mt-14">
                <Image
                  src={post.cover.src}
                  alt={post.cover.alt}
                  fill
                  preload
                  sizes="(min-width: 1792px) 1700px, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}

          <div className="mx-auto mt-12 max-w-3xl lg:mt-16">
            <PostBody blocks={post.blocks} />

            {next && (
              <Link
                href={`/blog/${next.slug}`}
                className="group mt-14 flex items-center justify-between gap-6 rounded-[var(--radius-card)] border border-line p-6 transition-colors hover:border-line-strong"
              >
                <span>
                  <span className="block text-sm text-muted">Next post</span>
                  <span className="mt-1 block text-xl">{next.title}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-2xl motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            )}
          </div>
        </article>
      </Section>

      <ClosingCta />
    </>
  );
}
