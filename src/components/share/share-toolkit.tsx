"use client";

import { useState } from "react";

type CaptionOption = {
  label: string;
  text: string;
};

type ShareLinkSet = {
  facebook?: string;
  whatsapp?: string;
  email?: string;
};

type CampaignPreset = {
  key: string;
  label: string;
  caption: string;
  shareUrl: string;
  links?: ShareLinkSet;
};

export function ShareToolkit({
  heading,
  description,
  shareUrl,
  nativeTitle,
  nativeText,
  captionOptions,
  links,
  campaignPresets,
  socialPreviewUrl,
}: {
  heading: string;
  description: string;
  shareUrl: string;
  nativeTitle: string;
  nativeText: string;
  captionOptions: CaptionOption[];
  links?: ShareLinkSet;
  campaignPresets?: CampaignPreset[];
  socialPreviewUrl?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
      window.setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage("Copy failed on this device.");
    }
  }

  async function openNativeShare() {
    if (!navigator.share) {
      await copyText(shareUrl, "Share link copied.");
      return;
    }

    try {
      await navigator.share({
        title: nativeTitle,
        text: nativeText,
        url: shareUrl,
      });
    } catch {
      return;
    }
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/75 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--amber)]">
        {heading}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void openNativeShare()}
          className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => void copyText(shareUrl, "Share link copied.")}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
        >
          Copy link
        </button>
        {links?.facebook ? (
          <a
            href={links.facebook}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Facebook
          </a>
        ) : null}
        {links?.whatsapp ? (
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            WhatsApp
          </a>
        ) : null}
        {links?.email ? (
          <a
            href={links.email}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
          >
            Email
          </a>
        ) : null}
        {socialPreviewUrl ? (
          <>
            <a
              href={socialPreviewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Open preview image
            </a>
            <a
              href={socialPreviewUrl}
              download
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Download image
            </a>
          </>
        ) : null}
      </div>
      {socialPreviewUrl ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          The branded social preview image helps your listing look cleaner when you post it manually on social media.
        </p>
      ) : null}
      <div className="mt-5 space-y-3">
        {captionOptions.map((caption) => (
          <div
            key={caption.label}
            className="rounded-[1.2rem] border border-[var(--border)] bg-[#fbf8f1] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {caption.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{caption.text}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyText(caption.text, `${caption.label} copied.`)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                Copy text
              </button>
            </div>
          </div>
        ))}
      </div>
      {campaignPresets?.length ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Campaign presets
          </p>
          {campaignPresets.map((preset) => (
            <div
              key={preset.key}
              className="rounded-[1.2rem] border border-[var(--border)] bg-[#f6f3ec] p-4"
            >
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {preset.label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">{preset.caption}</p>
                  <p className="mt-2 break-all text-xs leading-6 text-[var(--muted)]">{preset.shareUrl}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void copyText(preset.caption, `${preset.label} text copied.`)}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Copy text
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyText(preset.shareUrl, `${preset.label} link copied.`)}
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    Copy link
                  </button>
                  {preset.links?.facebook ? (
                    <a
                      href={preset.links.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      Facebook
                    </a>
                  ) : null}
                  {preset.links?.whatsapp ? (
                    <a
                      href={preset.links.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      WhatsApp
                    </a>
                  ) : null}
                  {preset.links?.email ? (
                    <a
                      href={preset.links.email}
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                    >
                      Email
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-[var(--muted)]">{message}</p> : null}
    </article>
  );
}
