/**
 * icons.jsx — Custom SVG icon components for SIGAM
 *
 * Provides domain-specific icons (bull, corn) that aren't available
 * in lucide-react. Each icon accepts a `size` prop (default 24).
 */

/**
 * Bull / cattle icon — used for the Hacienda (ganado) module.
 */
export function BullIcon({ size = 24, className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Horns */}
      <path d="M3 4c1 2 2 3 4 3" />
      <path d="M21 4c-1 2-2 3-4 3" />
      {/* Head */}
      <ellipse cx="12" cy="10" rx="5" ry="4" />
      {/* Nostrils */}
      <circle cx="10" cy="11" r="0.5" fill="currentColor" />
      <circle cx="14" cy="11" r="0.5" fill="currentColor" />
      {/* Body */}
      <path d="M7 14c0 4 2 6 5 6s5-2 5-6" />
    </svg>
  );
}

/**
 * Corn icon — used for the Materia Prima module.
 */
export function CornIcon({ size = 24, className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Corn cob */}
      <path d="M12 3c-2 0-4 3-4 8s2 8 4 8 4-3 4-8-2-8-4-8z" />
      {/* Kernel rows */}
      <path d="M12 5v14" />
      <path d="M9 7c1.5 1 4.5 1 6 0" />
      <path d="M9 11c1.5 1 4.5 1 6 0" />
      <path d="M9 15c1.5 1 4.5 1 6 0" />
      {/* Husk leaves */}
      <path d="M8 11c-2-1-3 0-4 2" />
      <path d="M16 11c2-1 3 0 4 2" />
    </svg>
  );
}
