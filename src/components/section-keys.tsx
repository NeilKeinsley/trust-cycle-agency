"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { animateScrollTo, scrollToStop, staticTops, stepTarget } from "@/lib/stops";

const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "]);
const WHEEL_THRESHOLD = 30; // px of accumulated delta that counts as one gesture
const WHEEL_QUIET_MS = 160; // gesture ends once the wheel is silent this long
const WHEEL_REPEAT_MS = 1100; // a wheel still spinning after this long counts as a new step

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/* Section navigation for the home page. Arrow/Page keys, Space and the
   mouse wheel all move one "view" per input: to the adjacent [data-stop]
   (hero, each locked card, each Services pillar), or one screen at a time
   through anything taller than the viewport. Every move uses the same
   fixed-duration animation, so up and down feel identical. The wheel part
   only runs on desktop-sized screens where the lock stack is active; touch
   and small screens keep native scrolling. */
export function SectionKeys() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    let moving = false; // an animation is running
    let accum = 0;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;
    let gestureSpent = false; // this wheel gesture already triggered a move
    let lastMoveAt = 0;

    const blocked = () => !!document.querySelector('[aria-modal="true"]');

    async function step(dir: 1 | -1) {
      const y = stepTarget(dir);
      if (y === null) return false;
      moving = true;
      await animateScrollTo(y);
      moving = false;
      return true;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!NAV_KEYS.has(e.key)) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (isTypingTarget(e.target) || blocked()) return;
      const forward = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
      e.preventDefault();
      if (moving) return;
      void step(forward ? 1 : -1);
    }

    const desktop = window.matchMedia("(min-width: 768px) and (min-height: 600px) and (pointer: fine)");

    function onWheel(e: WheelEvent) {
      if (!desktop.matches || e.ctrlKey || blocked()) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // horizontal swipes stay native

      e.preventDefault();
      if (quietTimer) clearTimeout(quietTimer);
      quietTimer = setTimeout(() => {
        accum = 0;
        gestureSpent = false;
      }, WHEEL_QUIET_MS);

      if (moving) return;
      if (gestureSpent && performance.now() - lastMoveAt < WHEEL_REPEAT_MS) return;
      accum += e.deltaY;
      if (Math.abs(accum) < WHEEL_THRESHOLD) return;

      const dir: 1 | -1 = accum > 0 ? 1 : -1;
      accum = 0;
      gestureSpent = true;
      lastMoveAt = performance.now();
      void step(dir);
    }

    // Same-page anchor links (#services, #work, ...). The browser's own jump
    // reads a pinned card's stuck position and lands in the wrong place, so
    // resolve the target's static position instead.
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (url.pathname !== "/" || !url.hash || url.origin !== window.location.origin) return;
      const target = resolveAnchor(url.hash);
      if (!target) return;
      e.preventDefault();
      history.pushState(null, "", url.hash);
      void scrollToStop(target);
    }

    // Keyboard focus that lands inside a card currently covered by a later
    // card is invisible. Scroll to the element's static position, where its
    // own card is the top one, so the focus ring is always on screen.
    function onFocusIn(e: FocusEvent) {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.closest(".tc-lock-card")) return;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 2);
        const y = Math.min(Math.max(r.top + r.height / 2, 1), window.innerHeight - 2);
        const hit = document.elementFromPoint(x, y);
        const onScreen = r.bottom > 0 && r.top < window.innerHeight;
        if (onScreen && hit && (hit === el || el.contains(hit) || hit.contains(el))) return;
        // Stay within the card's own view: a card is only uncovered between
        // its top reaching the header and its bottom reaching the viewport
        // bottom (for a short card that's just its top position).
        const card = el.closest<HTMLElement>(".tc-lock-card")!;
        const [elTop, cardTop] = staticTops([el, card]);
        const header = document.querySelector("header")?.getBoundingClientRect().height ?? 64;
        const lo = cardTop - header;
        const hi = Math.max(lo, cardTop + card.offsetHeight - window.innerHeight);
        const want = elTop - window.innerHeight / 3;
        window.scrollTo(0, Math.max(0, Math.min(Math.max(want, lo), hi)));
      });
    }

    // Arriving from another page with a hash (e.g. /about -> /#work).
    if (window.location.hash) {
      const target = resolveAnchor(window.location.hash);
      if (target) requestAnimationFrame(() => void scrollToStop(target));
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", onFocusIn);
      if (quietTimer) clearTimeout(quietTimer);
    };
  }, [pathname]);

  return null;
}

/* An id can sit on an element hidden at this breakpoint (the Services pillar
   markers only exist in the desktop stage), so fall back to a visible
   element carrying the same name in data-anchor. */
function resolveAnchor(hash: string): HTMLElement | null {
  const name = decodeURIComponent(hash.slice(1));
  const byId = document.getElementById(name);
  if (byId && byId.getClientRects().length) return byId;
  const alt = Array.from(document.querySelectorAll<HTMLElement>(`[data-anchor="${CSS.escape(name)}"]`)).find(
    (el) => el.getClientRects().length > 0,
  );
  return alt ?? byId;
}
