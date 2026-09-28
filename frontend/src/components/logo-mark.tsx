import { strings } from "@/i18n/strings";

/**
 * DevTrackr mark, "daybook": an ink tile holding a leaf with a coral today-rule.
 * It is the product's own object — a page in a work journal. Reads at 16px and
 * in monochrome. Swapping the identity touches this one file.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 26 26"
      role="img"
      aria-label={strings.common.brand}
      className="shrink-0"
    >
      <rect width="26" height="26" rx="7" fill="var(--brand-ink)" />
      <rect
        x="5.25"
        y="4.75"
        width="15.5"
        height="16.5"
        rx="2"
        fill="var(--brand-paper)"
      />
      <path
        d="M9 4.75V21.25"
        stroke="var(--brand-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 10.5H18"
        stroke="var(--signal)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 14H18"
        stroke="var(--brand-ink)"
        strokeOpacity="0.45"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M12 17.5H15.5"
        stroke="var(--brand-ink)"
        strokeOpacity="0.45"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
