import type { ElementType, ReactNode } from "react";

export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-[112rem] px-4 py-16 sm:px-8 lg:px-12 lg:py-24 2xl:px-16 ${className}`}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-accent">
      {children}
    </p>
  );
}

/**
 * Standard section header: an optional eyebrow + h2 on the left, an
 * optional lead paragraph and action on the right. `eyebrow` is optional
 * and renders nothing when omitted — only pass it when it carries
 * information a plain heading doesn't (a counter, an index), not as a
 * restated kicker. At `lg` it splits into a 12-column grid (col-span-7 /
 * col-span-5, the right column pinned to `self-end` so the lead sits on
 * the h2's baseline instead of centered against it); below `lg` it stacks.
 * Carries its own tight bottom margin so callers don't need to add spacing
 * before their next block.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  tone = "light",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const muted = tone === "dark" ? "text-on-dark-muted" : "text-muted";

  return (
    <div className={`mb-10 lg:mb-14 lg:grid lg:grid-cols-12 lg:gap-8 ${className}`.trim()}>
      <div className="lg:col-span-7">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className={`max-w-4xl text-[length:var(--fs-h2)] leading-[1.02] ${eyebrow ? "mt-3" : ""}`}>{title}</h2>
      </div>
      {(lead || action) && (
        <div className="mt-5 lg:col-span-5 lg:mt-0 lg:self-end">
          {lead && <p className={`max-w-[34ch] text-lg ${muted}`}>{lead}</p>}
          {action && <div className={lead ? "mt-4" : ""}>{action}</div>}
        </div>
      )}
    </div>
  );
}

export type PanelTone = "light" | "card" | "dark";
/**
 * @deprecated The old two-panel sticky mechanism is gone — every home panel
 * after the hero now locks generically via `LockStack`
 * (`src/components/lock-stack.tsx`), which wraps each panel from the
 * outside instead of the panel styling itself. `lock` is kept only so the
 * handful of callers that still pass it (`faq-teaser.tsx`, `closing-cta.tsx`)
 * keep type-checking; it no longer changes rendered output.
 */
export type PanelLock = "base" | "cover";

const PANEL_TONE: Record<PanelTone, string> = {
  light: "bg-background text-foreground",
  card: "bg-card text-foreground",
  dark: "bg-surface-dark text-on-dark",
};

/**
 * Full-bleed, full-viewport-at-lg section. Panels alternate `tone` so the
 * page doesn't read as one endless sheet, and vertically center their
 * content by default so wide/tall screens don't look empty.
 *
 * `lock` is a no-op kept for backwards type-compatibility — see the
 * `PanelLock` doc comment. `LockStack` now owns the sticky/cover mechanics
 * from outside the panel.
 *
 * `raised` still applies its own small stacking bump (`relative z-10`) for
 * a plain panel that needs to out-paint something behind it outside the
 * LockStack mechanism.
 */
export function Panel({
  id,
  as: Tag = "section",
  tone = "light",
  raised = false,
  compact = false,
  center = true,
  className = "",
  containerClassName = "",
  padClassName = "py-12 lg:py-14",
  children,
}: {
  id?: string;
  as?: ElementType;
  tone?: PanelTone;
  /** @deprecated no longer changes rendered output — see `PanelLock`. */
  lock?: PanelLock;
  raised?: boolean;
  /** Skip the forced lg:min-h-screen sizing — for content that should stay
   * naturally compact (e.g. the hero's client rail). */
  compact?: boolean;
  center?: boolean;
  className?: string;
  containerClassName?: string;
  /** Vertical padding. A separate prop because Tailwind resolves conflicting
   * utilities by stylesheet order, so `py-*` in containerClassName can't
   * reliably override a default. */
  padClassName?: string;
  children: ReactNode;
}) {
  const heightClasses = compact ? "" : "lg:min-h-[calc(100svh-var(--header-h))]";

  const lockClasses = raised ? "relative z-10" : "";

  return (
    <Tag
      id={id}
      className={`w-full ${PANEL_TONE[tone]} ${heightClasses} ${
        center ? "flex flex-col justify-center" : ""
      } ${lockClasses} ${className}`.trim()}
    >
      <div
        className={`mx-auto w-full max-w-[112rem] px-4 sm:px-8 lg:px-12 2xl:px-16 ${padClassName} ${containerClassName}`.trim()}
      >
        {children}
      </div>
    </Tag>
  );
}
