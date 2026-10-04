import type { SVGProps } from "react";

export interface MarkPalette {
  plate: string;
  body: string;
  ear: string;
  deep: string;
  tint: string;
  blush: string;
}

export const TOKEN_PALETTE: MarkPalette = {
  plate: "var(--accent)",
  body: "var(--primary)",
  ear: "var(--highlight)",
  deep: "var(--brand-deep)",
  tint: "var(--brand-tint)",
  blush: "var(--brand-blush)",
};

export function markShapes(p: MarkPalette): React.ReactElement[] {
  return [
    <rect key="plate" width="100" height="100" rx="26" fill={p.plate} />,
    <g key="buddy" transform="translate(50 52) scale(0.84) translate(-50 -50)">
      <g transform="rotate(14 14 40)">
        <rect x="6" y="38" width="12" height="34" rx="6" fill={p.ear} />
      </g>
      <circle cx="15" cy="36" r="13" fill={p.ear} />
      <circle cx="15" cy="36" r="5" fill={p.blush} />
      <g transform="rotate(-14 86 40)">
        <rect x="82" y="38" width="12" height="34" rx="6" fill={p.ear} />
      </g>
      <circle cx="85" cy="36" r="13" fill={p.ear} />
      <circle cx="85" cy="36" r="5" fill={p.blush} />
      <rect x="34" y="4" width="32" height="28" rx="10" fill={p.deep} />
      <rect x="34" y="68" width="32" height="28" rx="10" fill={p.deep} />
      <rect x="18" y="16" width="64" height="68" rx="24" fill={p.body} />
      <rect x="25" y="23" width="50" height="54" rx="18" fill={p.tint} />
      <circle cx="40" cy="46" r="4.6" fill={p.deep} />
      <circle cx="60" cy="46" r="4.6" fill={p.deep} />
      <circle cx="41.4" cy="44.6" r="1.4" fill={p.tint} />
      <circle cx="61.4" cy="44.6" r="1.4" fill={p.tint} />
      <path
        d="M39 59Q50 70 61 59"
        fill="none"
        stroke={p.ear}
        strokeWidth="4.4"
        strokeLinecap="round"
      />
    </g>,
  ];
}

export function LogoMark(props: Readonly<SVGProps<SVGSVGElement>>) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      {markShapes(TOKEN_PALETTE)}
    </svg>
  );
}
