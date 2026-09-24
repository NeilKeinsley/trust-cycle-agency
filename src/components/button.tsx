import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "accent" | "ghost" | "on-dark";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 [transition-timing-function:var(--ease-spring)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background hover:opacity-90 hover:-translate-y-0.5",
  accent:
    "bg-accent text-accent-foreground hover:opacity-90 hover:-translate-y-0.5",
  ghost:
    "border border-line text-foreground hover:border-line-strong hover:-translate-y-0.5",
  "on-dark":
    "bg-on-dark text-surface-dark hover:opacity-90 hover:-translate-y-0.5",
};

function classes(variant: ButtonVariant, size: ButtonSize, className = "") {
  return `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim();
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button type="button" className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}
