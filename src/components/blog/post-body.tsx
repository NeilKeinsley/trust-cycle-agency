import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Block, Inline } from "@/lib/blog-posts";

/* A post body is typed blocks, not HTML (see src/lib/blog-posts.ts), so the
   only markup on the page is what these components write. */

const LINK =
  "underline decoration-accent decoration-1 underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Text runs with their formatting. A line break typed in the editor stays a line break. */
export function Runs({ runs }: { runs: Inline[] }) {
  return runs.map((run, i) => {
    const lines = run.text.split("\n");
    let node: ReactNode = lines.map((line, n) => (
      <Fragment key={n}>
        {n > 0 && <br />}
        {line}
      </Fragment>
    ));
    if (run.bold) node = <strong className="font-medium text-foreground">{node}</strong>;
    if (run.italic) node = <em>{node}</em>;
    if (run.href) {
      node = run.href.startsWith("/") ? (
        <Link href={run.href} className={LINK}>
          {node}
        </Link>
      ) : (
        <a href={run.href} rel="noopener noreferrer" className={LINK}>
          {node}
        </a>
      );
    }
    return <Fragment key={i}>{node}</Fragment>;
  });
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="mt-5 text-lg leading-relaxed text-foreground/85">
          <Runs runs={block.content} />
        </p>
      );
    case "heading":
      return block.level === 2 ? (
        <h2 className="mt-14 text-3xl leading-tight sm:text-4xl">
          <Runs runs={block.content} />
        </h2>
      ) : (
        <h3 className="mt-10 text-xl font-medium">
          <Runs runs={block.content} />
        </h3>
      );
    case "image":
      return (
        <figure className="my-10">
          <Image
            src={block.image.src}
            alt={block.image.alt}
            width={block.image.width}
            height={block.image.height}
            sizes="(min-width: 1024px) 768px, 100vw"
            className="h-auto w-full rounded-[var(--radius-card)] border border-line"
          />
          {block.caption.length > 0 && (
            <figcaption className="mt-3 text-sm text-muted">
              <Runs runs={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className="mt-6 space-y-3 text-lg leading-relaxed text-foreground/85">
          {block.items.map((item, i) => (
            <li key={i} className="grid grid-cols-[2rem_1fr] gap-x-2">
              {block.ordered ? (
                <span aria-hidden="true" className="pt-1 font-mono text-sm text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
              ) : (
                <span aria-hidden="true" className="mt-3.5 h-px w-4 bg-accent" />
              )}
              <span>
                <Runs runs={item} />
              </span>
            </li>
          ))}
        </List>
      );
    }
    case "quote":
      return (
        <figure className="my-10 rounded-[var(--radius-card)] bg-accent-soft p-6 sm:p-8">
          <blockquote className="space-y-4 text-2xl leading-snug text-foreground">
            {block.paragraphs.map((paragraph, i) => (
              <p key={i}>
                <Runs runs={paragraph} />
              </p>
            ))}
          </blockquote>
          {block.cite.length > 0 && (
            <figcaption className="mt-4 text-sm text-foreground/70">
              <Runs runs={block.cite} />
            </figcaption>
          )}
        </figure>
      );
  }
}

export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="[&>:first-child]:mt-0">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

export function PostDate({ date, className = "" }: { date: string; className?: string }) {
  return (
    <time dateTime={date} className={className}>
      {DATE.format(new Date(date))}
    </time>
  );
}
