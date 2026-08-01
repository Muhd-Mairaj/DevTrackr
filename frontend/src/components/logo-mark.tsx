/**
 * Provisional DevTrackr mark: a primary rounded square with ruled lines
 * and a stamp dot. Replace with the real logo when designed; keep the
 * same component interface so the swap touches one file.
 */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      role="img"
      aria-label="DevTrackr"
    >
      <rect width="26" height="26" rx="6" fill="var(--primary)" />
      <path
        d="M7 9.5h12M7 13h8.5"
        stroke="#fff"
        strokeOpacity="0.9"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M7 16.5h12"
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx="19.5"
        cy="16.5"
        r="2.6"
        fill="var(--destructive)"
        stroke="#fff"
        strokeWidth="1.1"
      />
    </svg>
  );
}
