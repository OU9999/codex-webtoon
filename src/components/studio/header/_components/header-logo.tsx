import type { SVGProps } from 'react';

interface HeaderLogoProps extends SVGProps<SVGSVGElement> {}

const HeaderLogo = ({ className, ...props }: HeaderLogoProps) => {
  return (
    <svg
      viewBox="25 26 462 461"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      focusable="false"
      {...props}
    >
      <defs>
        <linearGradient
          id="codex-webtoon-logo-surface"
          x1="45"
          y1="43"
          x2="468"
          y2="483"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="0.42" stopColor="#F8FBFF" />
          <stop offset="1" stopColor="#E5F0FF" />
        </linearGradient>
        <radialGradient
          id="codex-webtoon-logo-surface-glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(89 92) rotate(43.8) scale(450 437)"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.96" />
          <stop offset="0.58" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="codex-webtoon-logo-stroke"
          x1="75"
          y1="46"
          x2="455"
          y2="480"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EEF3FA" />
          <stop offset="0.5" stopColor="#D7E1F0" />
          <stop offset="1" stopColor="#CAD8ED" />
        </linearGradient>
        <linearGradient
          id="codex-webtoon-logo-left-bar"
          x1="25"
          y1="309"
          x2="210"
          y2="309"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#173B7D" />
          <stop offset="0.52" stopColor="#2358B7" />
          <stop offset="1" stopColor="#2B69D6" />
        </linearGradient>
        <linearGradient
          id="codex-webtoon-logo-right-bar"
          x1="246"
          y1="241"
          x2="487"
          y2="241"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2D6DDD" />
          <stop offset="0.5" stopColor="#255EC8" />
          <stop offset="1" stopColor="#19439D" />
        </linearGradient>
        <linearGradient
          id="codex-webtoon-logo-vertical-bar"
          x1="228"
          y1="26"
          x2="228"
          y2="487"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#112D61" />
          <stop offset="0.27" stopColor="#214CA0" />
          <stop offset="0.59" stopColor="#2E72ED" />
          <stop offset="0.8" stopColor="#2F79FF" />
          <stop offset="1" stopColor="#2B6FEF" />
        </linearGradient>
        <radialGradient
          id="codex-webtoon-logo-core"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(228 305) rotate(90) scale(192 116)"
        >
          <stop stopColor="#3D86FF" stopOpacity="0.82" />
          <stop offset="0.42" stopColor="#2F72EC" stopOpacity="0.42" />
          <stop offset="0.72" stopColor="#2559BA" stopOpacity="0.14" />
          <stop offset="1" stopColor="#173973" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id="codex-webtoon-logo-edge-shine"
          x1="210"
          y1="26"
          x2="246"
          y2="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#0C234E" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="1" stopColor="#081D45" stopOpacity="0.18" />
        </linearGradient>
        <filter
          id="codex-webtoon-logo-shadow"
          x="14"
          y="15"
          width="484"
          height="484"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="5"
            floodColor="#1E417D"
            floodOpacity="0.11"
          />
        </filter>
        <filter
          id="codex-webtoon-logo-bar-shadow"
          x="18"
          y="19"
          width="476"
          height="475"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="2.4"
            floodColor="#08245A"
            floodOpacity="0.24"
          />
        </filter>
        <clipPath id="codex-webtoon-logo-clip">
          <rect x="25" y="26" width="462" height="461" rx="38" />
        </clipPath>
      </defs>

      <g filter="url(#codex-webtoon-logo-shadow)">
        <g clipPath="url(#codex-webtoon-logo-clip)">
          <rect
            x="25"
            y="26"
            width="462"
            height="461"
            rx="38"
            fill="url(#codex-webtoon-logo-surface)"
          />
          <rect
            x="25"
            y="26"
            width="462"
            height="461"
            rx="38"
            fill="url(#codex-webtoon-logo-surface-glow)"
          />
          <g filter="url(#codex-webtoon-logo-bar-shadow)">
            <rect
              x="210"
              y="26"
              width="36"
              height="461"
              fill="url(#codex-webtoon-logo-vertical-bar)"
            />
            <rect
              x="246"
              y="222"
              width="241"
              height="38"
              fill="url(#codex-webtoon-logo-right-bar)"
            />
            <rect
              x="25"
              y="290"
              width="185"
              height="37"
              fill="url(#codex-webtoon-logo-left-bar)"
            />
            <path
              d="M210 26H246V222H487V260H246V487H210V327H25V290H210V26Z"
              fill="url(#codex-webtoon-logo-core)"
            />
            <rect
              x="210"
              y="26"
              width="36"
              height="461"
              fill="url(#codex-webtoon-logo-edge-shine)"
              opacity="0.42"
            />
          </g>
        </g>
        <rect
          x="25.5"
          y="26.5"
          width="461"
          height="460"
          rx="37.5"
          stroke="url(#codex-webtoon-logo-stroke)"
        />
      </g>
    </svg>
  );
};

export { HeaderLogo };
