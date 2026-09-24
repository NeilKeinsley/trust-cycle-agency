/**
 * Scroll-stop geometry and motion for the home page's locked views.
 *
 * Pinned (sticky) cards report their *stuck* position from
 * getBoundingClientRect, so once several cards are pinned they all look like
 * they sit at the top of the viewport and "previous/next stop" math breaks.
 * `staticTops` measures each stop's static document position by switching
 * the stack's sticky positioning off for one synchronous read (no frame is
 * painted in between, so there's no flicker).
 *
 * Movement uses one fixed-duration animation instead of the browser's
 * smooth scroll, whose speed depends on distance, so stepping up and
 * stepping down feel identical.
 */
const DURATION_MS = 650;

function headerHeight(): number {
  return document.querySelector("header")?.getBoundingClientRect().height ?? 64;
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function maxScroll(): number {
  return document.documentElement.scrollHeight - window.innerHeight;
}

/** Static document top of each element, ignoring sticky pinning. */
export function staticTops(els: HTMLElement[]): number[] {
  const root = document.documentElement;
  root.classList.add("tc-measure");
  const tops = els.map((el) => el.getBoundingClientRect().top + window.scrollY);
  root.classList.remove("tc-measure");
  return tops;
}

let frame = 0;

/** Animate to a scroll position over a fixed duration. Resolves when done. */
export function animateScrollTo(y: number): Promise<void> {
  const target = Math.max(0, Math.min(y, maxScroll()));
  cancelAnimationFrame(frame);
  if (reducedMotion()) {
    window.scrollTo(0, target);
    return Promise.resolve();
  }
  const start = window.scrollY;
  const delta = target - start;
  const t0 = performance.now();
  return new Promise((resolve) => {
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION_MS);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      window.scrollTo(0, start + delta * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
      else resolve();
    };
    frame = requestAnimationFrame(tick);
  });
}

/** Scroll so the element's static top lands just under the header. */
export function scrollToStop(el: HTMLElement): Promise<void> {
  const [top] = staticTops([el]);
  return animateScrollTo(top - headerHeight());
}

/**
 * Where one step up (-1) or down (1) should land. Usually the adjacent
 * [data-stop]; if the gap to it is more than a screen (a section taller than
 * the viewport, or the footer), move one screen instead so no content is
 * skipped. Returns null when already at the end in that direction.
 */
export function stepTarget(dir: 1 | -1): number | null {
  const header = headerHeight();
  const page = window.innerHeight - header;
  const current = window.scrollY;
  const end = maxScroll();
  const stops = Array.from(document.querySelectorAll<HTMLElement>("[data-stop]"));
  const ys = staticTops(stops).map((t) => Math.max(0, Math.min(t - header, end)));
  ys.push(0, end);

  if (dir === 1) {
    if (current >= end - 1) return null;
    const next = Math.min(...ys.filter((y) => y > current + 2));
    return next - current > page * 1.3 ? current + page : next;
  }
  if (current <= 1) return null;
  const prev = Math.max(...ys.filter((y) => y < current - 2));
  return current - prev > page * 1.3 ? current - page : prev;
}
