import type { BrandTheme } from '../data/rematchData';

interface BrandLogoProps {
  theme: BrandTheme;
  customLogoUrl: string | null;
}

export function RmMonogram({ size = 28 }: { size?: number }) {
  const height = Math.round((size * 42) / 64);
  return (
    <svg width={size} height={height} viewBox="0 0 64 42" fill="none" aria-hidden="true">
      <path
        d="M8 36V19C8 11.8 13.8 7 21 7H24"
        stroke="#ffffff"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M29 36V18C29 12.2 33.4 8 38.8 8C44.2 8 46.5 12.2 46.5 18V36"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M46.5 18C46.5 12.2 50.8 8 55.8 8C60.5 8 61.5 12.2 61.5 18V36"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({ theme, customLogoUrl }: BrandLogoProps) {
  if (customLogoUrl) {
    return (
      <div className="rm-logo-frame">
        <img src={customLogoUrl} alt="Logo de REMATCH Fit House" />
      </div>
    );
  }

  if (theme === 'xmas') {
    return (
      <div className="rm-logo-frame">
        <svg width="162" height="42" viewBox="0 0 162 42" fill="none" role="img" aria-label="rematch Navidad">
          {/* Gorro apoyado sobre la "r" (compensa la itálica y la altura de la x) */}
          <g transform="translate(5 5)">
            <path d="M5 10 C6 2, 15 1, 20 6 L22 10 Z" fill="#E11D2E" />
            <rect x="3" y="9" width="20" height="3.8" rx="1.9" fill="#FFFFFF" />
            <circle cx="21" cy="5" r="2.4" fill="#FFFFFF" />
          </g>
          <text
            x="9"
            y="33"
            fill="#FFFFFF"
            fontFamily="'Barlow Condensed', sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="28"
          >
            rematch
          </text>
          <path d="M12 36 Q48 40 87 36" stroke="#22C55E" strokeWidth="1.6" fill="none" />
          <circle cx="20" cy="37" r="2.3" fill="#E11D2E" />
          <circle cx="38" cy="38" r="2.3" fill="#FFD100" />
          <circle cx="56" cy="38" r="2.3" fill="#22C55E" />
          <circle cx="74" cy="37" r="2.3" fill="#E11D2E" />
          <rect x="97" y="16" width="56" height="16" rx="8" fill="#15803D" />
          <text
            x="125"
            y="27"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="600"
            fontSize="8.8"
          >
            NAVIDAD
          </text>
        </svg>
      </div>
    );
  }

  if (theme === 'hyrox') {
    return (
      <div className="rm-logo-frame">
        <svg width="168" height="36" viewBox="0 0 168 36" fill="none" role="img" aria-label="rematch HYROX">
          <text
            x="0"
            y="26"
            fill="#FFFFFF"
            fontFamily="'Barlow Condensed', sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="29"
          >
            rematch
          </text>
          <rect x="92" y="9" width="70" height="19" rx="5" fill="#FFD100" />
          <text
            x="127"
            y="22"
            textAnchor="middle"
            fill="#0B0B0D"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="700"
            fontSize="11"
            letterSpacing="1.2"
          >
            HYROX
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="rm-logo-frame">
      <svg width="152" height="36" viewBox="0 0 152 36" fill="none" role="img" aria-label="rematch Fit House">
        <text
          x="0"
          y="26"
          fill="#FFFFFF"
          fontFamily="'Barlow Condensed', sans-serif"
          fontWeight="800"
          fontStyle="italic"
          fontSize="29"
        >
          rematch
        </text>
        <g transform="translate(92,12) skewX(-10)">
          <rect width="54" height="16" rx="2.5" fill="#E11D2E" />
          <text
            x="27"
            y="12"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="'Barlow Condensed', sans-serif"
            fontWeight="800"
            fontSize="10.5"
            letterSpacing="0.6"
          >
            FIT HOUSE
          </text>
        </g>
      </svg>
    </div>
  );
}
