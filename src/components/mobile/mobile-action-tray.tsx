"use client";

import Link from "next/link";
import { useState } from "react";

type ActionItem = {
  href?: string;
  label: string;
  onClickAnchorId?: string;
};

export function MobileActionTray({
  title,
  items,
}: {
  title: string;
  items: ActionItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="heyra-mobile-tray md:hidden">
      {isOpen ? (
        <button
          type="button"
          aria-label={`Lukk ${title}`}
          className="fixed inset-0 z-[34] bg-[#102a21]/18"
          onClick={() => setIsOpen(false)}
        />
      ) : null}
      <div className="relative z-[35]">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-between rounded-full border border-[var(--border)] bg-white/95 px-5 py-3 text-left shadow-[0_18px_36px_rgba(16,42,33,0.18)] backdrop-blur"
        >
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {title}
            </span>
            <span className="block text-sm font-semibold text-[var(--foreground)]">
              {isOpen ? "Skjul handlinger" : "Åpne hurtighandlinger"}
            </span>
          </span>
          <span className="text-lg text-[var(--forest)]">{isOpen ? "−" : "+"}</span>
        </button>
      </div>

      <div
        className={`mt-3 overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-white/98 p-3 shadow-[0_18px_36px_rgba(16,42,33,0.18)] backdrop-blur transition-all duration-200 ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {title}
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
          >
            Lukk
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) =>
            item.href ? (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-[1rem] bg-[var(--forest)] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={`${item.label}-${item.onClickAnchorId}`}
                href={`#${item.onClickAnchorId}`}
                onClick={() => setIsOpen(false)}
                className="rounded-[1rem] border border-[var(--border)] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground)]"
              >
                {item.label}
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
