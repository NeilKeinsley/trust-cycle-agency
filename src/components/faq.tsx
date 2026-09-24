import { Reveal } from "./reveal";

export type FaqItem = { q: string; a: string };

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <Reveal key={item.q} delay={i * 90}>
          <details className="faq group/faq border-b border-line">
            <summary className="flex cursor-pointer items-baseline gap-5 py-5 list-none">
              <span className="font-mono text-sm text-accent">
                0{i + 1}
              </span>
              <h3 className="contents">
                <span className="flex-1 text-lg">{item.q}</span>
              </h3>
              <span className="faq-icon text-xl text-muted">+</span>
            </summary>
            <p className="pb-6 pl-10 pr-8 text-sm leading-relaxed text-muted">
              {item.a}
            </p>
          </details>
        </Reveal>
      ))}
    </div>
  );
}
