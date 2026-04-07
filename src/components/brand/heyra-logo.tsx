type HeyraLogoProps = {
  className?: string;
  compact?: boolean;
  theme?: "light" | "dark";
};

export function HeyraLogo({
  className = "",
  compact = false,
  theme = "light",
}: HeyraLogoProps) {
  const wordColor = theme === "light" ? "#f7f3eb" : "#102a21";
  const accentColor = "#f56a14";

  return (
    <svg
      viewBox={compact ? "0 0 72 84" : "0 0 430 96"}
      aria-label="Heyra"
      role="img"
      className={className}
    >
      {compact ? (
        <>
          <g
            fill="none"
            stroke={accentColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="8"
          >
            <path d="M36 67V42" />
            <path d="M36 42 15 20" />
            <path d="M36 42 57 20" />
            <path d="M15 20 22 12" />
            <path d="M57 20 50 12" />
            <path d="M18 26h11" />
            <path d="M16 15h10" />
            <path d="M54 26H43" />
            <path d="M56 15H46" />
          </g>
        </>
      ) : (
        <>
          <g fill={wordColor}>
            <rect x="8" y="18" width="12" height="60" rx="6" />
            <rect x="58" y="18" width="12" height="60" rx="6" />
            <rect x="20" y="42" width="38" height="12" rx="6" />

            <rect x="106" y="18" width="12" height="60" rx="6" />
            <rect x="106" y="18" width="56" height="12" rx="6" />
            <rect x="106" y="42" width="46" height="12" rx="6" />
            <rect x="106" y="66" width="56" height="12" rx="6" />

            <path d="M292 18h28c22 0 36 12 36 29 0 13-8 22-20 26l19 5v2h-17l-28-8h-6v6c0 4-3 8-8 8h-4V18Zm12 12v30h16c15 0 24-5 24-15 0-10-9-15-24-15h-16Z" />
            <path d="M391 18h12l31 60h-14l-7-14h-34l-7 14h-14l33-60Zm16 35-11-22-11 22h22Z" />
          </g>

          <g
            fill="none"
            stroke={accentColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
          >
            <path d="M223 78V46" />
            <path d="M223 46 191 14" />
            <path d="M223 46 255 14" />
            <path d="M191 14 202 2" />
            <path d="M255 14 244 2" />
            <path d="M196 23h15" />
            <path d="M192 9h16" />
            <path d="M250 23h-15" />
            <path d="M254 9h-16" />
          </g>
        </>
      )}
    </svg>
  );
}
