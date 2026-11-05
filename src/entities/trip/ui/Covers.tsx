import type { CoverTheme } from '../model/types'

export function CoverArt({ theme }: { theme: CoverTheme }) {
  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      viewBox="0 0 360 150"
      preserveAspectRatio="none"
    >
      {theme === 'sunset' && (
        <>
          <path
            d="M0 120 C60 90 90 60 140 80 C190 100 220 40 270 50 C310 58 335 80 360 70 L360 150 L0 150 Z"
            fill="#F9D3B0"
          />
          <path
            d="M0 135 C80 115 150 125 220 110 C280 98 320 120 360 108 L360 150 L0 150 Z"
            fill="#F4B985"
          />
          <circle cx="300" cy="38" r="16" fill="#F28F3B" />
        </>
      )}
      {theme === 'mountains' && (
        <>
          <path
            d="M0 130 L70 60 L110 95 L170 30 L240 110 L290 70 L360 120 L360 150 L0 150 Z"
            fill="#B9CFF2"
          />
          <path d="M150 50 L170 30 L190 54 L178 50 L170 58 L160 48 Z" fill="#FFFFFF" />
          <path
            d="M0 140 C90 128 180 136 270 126 C310 122 340 130 360 128 L360 150 L0 150 Z"
            fill="#8FB0E6"
          />
        </>
      )}
      {theme === 'hills' && (
        <>
          <path
            d="M0 110 L60 70 L100 90 L160 40 L220 95 L270 60 L360 105 L360 150 L0 150 Z"
            fill="#BFDCC8"
          />
          <path
            d="M0 130 C70 112 140 124 210 114 C270 106 320 120 360 116 L360 150 L0 150 Z"
            fill="#94C4A3"
          />
        </>
      )}
    </svg>
  )
}
