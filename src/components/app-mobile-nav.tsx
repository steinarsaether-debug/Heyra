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
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.7rem] border border-[rgba(16,42,33,0.1)] bg-[rgba(255,251,245,0.92)] p-2 shadow-[0_24px_56px_rgba(16,42,33,0.18)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.slice(0, 4).map((item) => {
          const className = `rounded-[1.1rem] px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
            item.active
              ? "bg-[var(--forest)] text-white shadow-[0_10px_24px_rgba(16,42,33,0.2)]"
              : "bg-transparent text-[var(--muted)]"
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
