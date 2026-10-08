import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/section";
import { Button } from "@/components/button";
import { manageConfigured, readSession, wordpress, type FaqBoard } from "@/lib/manage";
import { signOut } from "./actions";
import { FaqCard, NewFaqForm, SignInForm } from "./faq-forms";

export const metadata: Metadata = pageMetadata({
  title: "Manage content",
  description: "Sign in to edit the questions and answers shown on the website.",
  path: "/manage",
  noindex: true,
});

const boardSchema: z.ZodType<FaqBoard> = z.object({
  limits: z.object({ q: z.number(), a: z.number() }),
  items: z.array(z.object({ id: z.number(), q: z.string(), a: z.string(), status: z.string() })),
});

function Shell({ title, lead, children }: { title: string; lead: string; children?: React.ReactNode }) {
  return (
    <Section className="pt-16 lg:pt-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[length:var(--fs-h2)] leading-[1.02]">{title}</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">{lead}</p>
        <div className="mt-10">{children}</div>
      </div>
    </Section>
  );
}

/* The site's own editor for FAQs: a plain page for people who should never
   need the WordPress admin. Same content, same rules, same WordPress account
   (src/lib/manage.ts). */
export default async function ManagePage() {
  if (!manageConfigured()) {
    return (
      <Shell
        title="Content editing is not connected."
        lead="This copy of the site is running on its built-in content, so there is nothing to edit here yet."
      />
    );
  }

  const session = await readSession();
  if (!session) {
    return (
      <Shell title="Manage your content." lead="Sign in with the username and password you were given for the website.">
        <div className="max-w-md rounded-[var(--radius-card)] border border-line bg-card p-8">
          <SignInForm />
        </div>
      </Shell>
    );
  }

  const { status, data } = await wordpress("/manage/faqs", { uid: session.uid });
  const board = boardSchema.safeParse(data);
  if (status !== 200 || !board.success) {
    return (
      <Shell
        title="The content system is not responding."
        lead="Your website is still online and unchanged. Please try again in a minute."
      >
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </Shell>
    );
  }

  const { items, limits } = board.data;
  return (
    <Shell
      title="Questions and answers."
      lead="Changes go live on the website as soon as you save. You can only change words here, never the design."
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6 text-sm">
        <p className="text-muted">
          Signed in as <span className="text-foreground">{session.name}</span>
        </p>
        <div className="flex items-center gap-4">
          <Link href="/faq" target="_blank" className="link-line">
            See the live page
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">Add a question</h2>
        <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-card p-5 sm:p-6">
          <NewFaqForm limits={limits} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Questions on the website ({items.length})</h2>
        <p className="mt-2 text-sm text-muted">
          They appear in this order. The first six also show on the homepage.
        </p>
        <ul className="mt-5 space-y-5">
          {items.map((faq, i) => (
            <FaqCard key={faq.id} faq={faq} position={i} total={items.length} limits={limits} />
          ))}
        </ul>
      </section>
    </Shell>
  );
}
