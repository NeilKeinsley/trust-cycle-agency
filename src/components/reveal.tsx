"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* Scroll-triggered entrance (21st.dev "appear"), staggered via delay.
   `immediate` is for above-the-fold content: the entrance plays from CSS on
   first paint instead of waiting for hydration + IntersectionObserver, so the
   hero is never blank while JS loads (and still renders with JS off). */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || immediate) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`${immediate ? "reveal-now" : `reveal ${visible ? "is-visible" : ""}`} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
