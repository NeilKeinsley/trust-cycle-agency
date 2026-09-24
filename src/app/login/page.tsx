import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { QuizTrigger } from "@/components/lead-quiz";
import { Logo } from "@/components/logo";
import { Arcs } from "@/components/page-hero";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Client portal log in for Trust Cycle Agency.",
};

/* Full-screen split: dark brand panel on the left (lg+), form on the right.
   Below lg only the form shows, at natural height. */
export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-h))] p-2 sm:p-3">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-surface-dark p-12 text-on-dark lg:flex xl:p-16">
        <Arcs className="-bottom-40 -right-40 h-[40rem] w-[40rem]" />
        <Reveal immediate className="relative">
          <span className="text-on-dark">
            <Logo onDark />
          </span>
        </Reveal>
        <Reveal immediate delay={90} className="relative">
          <p className="max-w-lg text-[length:var(--fs-h2)] leading-[1.02]">
            Your projects, in one place.
          </p>
          <p className="mt-6 max-w-sm text-on-dark-muted">
            The client portal is coming soon. Existing clients get access at
            kickoff.
          </p>
        </Reveal>
      </div>

      <div className="flex w-full items-center justify-center px-2 py-12 lg:w-1/2 lg:px-12">
        <Reveal immediate className="w-full max-w-md">
          <div className="rounded-[var(--radius-card)] border border-line bg-card p-8 sm:p-10">
            <div className="text-foreground lg:hidden">
              <Logo />
            </div>
            <h1 className="mt-6 text-3xl lg:mt-0 lg:text-4xl">Client log in</h1>
            <p className="mt-2 text-muted">
              For clients with an active project or retainer.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>

            <p className="mt-6 text-sm text-muted">
              Not a client yet?{" "}
              <span className="inline-block">
                <QuizTrigger variant="ghost" size="sm">
                  Start a project
                </QuizTrigger>
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
