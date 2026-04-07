import { HostQualityBadge } from "@/lib/trust-summary";

export function TrustBadge({
  label,
  detail,
  compact = false,
  tone = "forest",
}: HostQualityBadge & { compact?: boolean }) {
  const toneClasses =
    tone === "forest"
      ? "bg-[var(--forest-elevated)] text-[#f7f3eb]"
      : "bg-[rgba(245,106,20,0.14)] text-[var(--forest)]";

  if (compact) {
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
        {label}
      </span>
    );
  }

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm leading-7 ${toneClasses}`}>
      <p className="font-semibold">{label}</p>
      <p className={tone === "forest" ? "text-[rgba(247,243,235,0.82)]" : "text-[rgba(16,42,33,0.74)]"}>{detail}</p>
    </div>
  );
}
