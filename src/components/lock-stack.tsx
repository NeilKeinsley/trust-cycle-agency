"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

const LOCK_MQ = "(min-width: 768px) and (min-height: 600px)";

/**
 * Generic replacement for the old two-panel sticky-pair hack (see the
 * "Lock stack" comment block in globals.css). Wraps every direct child in a
 * card that pins in place while the next card slides up over it:
 * `position: sticky; top: min(header height, 100svh - card height)`.
 * A card shorter than the viewport pins under the header; a card taller
 * than the viewport (Work, Services, an FAQ with an open answer) instead
 * gets a negative top, so it keeps scrolling until its bottom edge reaches
 * the viewport bottom, then pins there. Nothing is ever unreachable.
 *
 * Each card is measured with a ResizeObserver, so an open `<details>`
 * (which grows the card) recomputes the pin point automatically — this
 * replaces the old `:has(details[open])` release hack.
 *
 * Below the `LOCK_MQ` breakpoint this renders as plain document flow: no
 * sticky, no measuring work.
 */
export function LockStack({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);

  return (
    <>
      {items.map((child, index) => (
        <LockCard key={index} index={index} isCover={index > 0}>
          {child}
        </LockCard>
      ))}
    </>
  );
}

function LockCard({
  index,
  isCover,
  children,
}: {
  index: number;
  isCover: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<string>("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia(LOCK_MQ);

    function recompute() {
      if (!el || !mq.matches) return;
      const header = document.querySelector("header");
      const headerH = header ? header.getBoundingClientRect().height : 64;
      const childH = el.getBoundingClientRect().height;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setTop(`${Math.min(headerH, vh - childH)}px`);
    }

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    if (mq.addEventListener) mq.addEventListener("change", recompute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
      if (mq.removeEventListener) mq.removeEventListener("change", recompute);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-stop
      className="tc-lock-card"
      data-cover={isCover ? "true" : undefined}
      style={{
        zIndex: index + 1,
        ["--lock-top" as string]: top || undefined,
      }}
    >
      {children}
    </div>
  );
}
