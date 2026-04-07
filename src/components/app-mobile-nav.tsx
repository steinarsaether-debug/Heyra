"use client";

import Link from "next/link";

type NavItem = {
  href?: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function AppMobileNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,251,245,0.95)] p-2 shadow-[0_18px_42px_rgba(16,42,33,0.14)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.slice(0, 4).map((item) => {
          const className = `rounded-[1rem] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] ${
            item.active ? "bg-[var(--orange)] text-[#160b05]" : "bg-transparent text-[var(--muted)]"
          }`;

          if (item.href) {
            return (
              <Link key={`${item.label}-${item.href}`} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={className}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
