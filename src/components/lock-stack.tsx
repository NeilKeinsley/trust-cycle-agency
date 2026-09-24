"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";

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
 * One ResizeObserver and one resize listener serve the whole stack. Changes
 * are batched into a single animation frame that reads every height first,
 * then writes every `--lock-top` straight to the element, so measuring never
 * interleaves reads and writes and never re-renders React. An open
 * `<details>` (which grows its card) recomputes automatically.
 *
 * Below the `LOCK_MQ` breakpoint this renders as plain document flow: no
 * sticky, no measuring work.
 */
export function LockStack({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia(LOCK_MQ);
    let frame = 0;

    function recompute() {
      frame = 0;
      const els = cards.current.filter((el): el is HTMLDivElement => !!el);
      if (!mq.matches) {
        els.forEach((el) => el.style.removeProperty("--lock-top"));
        return;
      }
      // Reads first...
      const headerH = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const heights = els.map((el) => el.getBoundingClientRect().height);
      // ...then writes.
      els.forEach((el, i) => el.style.setProperty("--lock-top", `${Math.min(headerH, vh - heights[i])}px`));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(recompute);
    }

    recompute();
    const ro = new ResizeObserver(schedule);
    cards.current.forEach((el) => el && ro.observe(el));
    window.addEventListener("resize", schedule);
    mq.addEventListener?.("change", schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      mq.removeEventListener?.("change", schedule);
    };
  }, [items.length]);

  return (
    <>
      {items.map((child, index) => (
        <div
          key={index}
          ref={(el) => {
            cards.current[index] = el;
          }}
          data-stop
          className="tc-lock-card"
          data-cover={index > 0 ? "true" : undefined}
          style={{ zIndex: index + 1 }}
        >
          {child}
        </div>
      ))}
    </>
  );
}
