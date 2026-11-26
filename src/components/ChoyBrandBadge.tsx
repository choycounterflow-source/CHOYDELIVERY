import React from "react";

interface ChoyBrandBadgeProps {
  size?: "sm" | "lg";
}

export const ChoyBrandBadge: React.FC<ChoyBrandBadgeProps> = ({ size = "lg" }) => {
  const isSmall = size === "sm";

  return (
    <div
      className={`${
        isSmall ? "w-11 h-11 rounded-xl border-2" : "w-24 h-24 rounded-2xl border-2 shadow-sm"
      } bg-[#FFF5E4] border-[#FF5A1F] flex flex-col items-center justify-center overflow-hidden shrink-0 select-none relative`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 96 96"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Warm cream backdrop */}
        <rect width="96" height="96" fill="#FFF5E4" />

        {/* Subtle speed lines */}
        <path
          d="M12 36H22M10 44H18"
          stroke="#FF5A1F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Delivery box on back of scooter */}
        <rect
          x="18"
          y="24"
          width="20"
          height="18"
          rx="4"
          fill="#FF5A1F"
          stroke="#114B22"
          strokeWidth="2.5"
        />
        <path d="M22 30H34M22 35H30" stroke="#FFF5E4" strokeWidth="2" strokeLinecap="round" />

        {/* Rider helmet & body */}
        <circle cx="51" cy="23" r="9.5" fill="#114B22" stroke="#0B2F15" strokeWidth="2" />
        <path d="M53 20H60C60 24 58 27 53 27V20Z" fill="#FFF5E4" />
        <path
          d="M42 46C42 36 47 32 54 32C59 32 63 36 65 42L72 44"
          stroke="#114B22"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Scooter frame */}
        <path
          d="M27 52H58L66 36H74"
          stroke="#14532D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 50C26 44 33 42 42 42H55L62 54H30"
          fill="#228B4E"
          stroke="#114B22"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Scooter wheels */}
        <circle cx="33" cy="56" r="7" fill="#1C1917" stroke="#114B22" strokeWidth="2" />
        <circle cx="33" cy="56" r="2.5" fill="#FFF5E4" />
        <circle cx="67" cy="56" r="7" fill="#1C1917" stroke="#114B22" strokeWidth="2" />
        <circle cx="67" cy="56" r="2.5" fill="#FFF5E4" />

        {/* Bottom brand ribbon */}
        <rect x="8" y="66" width="80" height="22" rx="6" fill="#114B22" />
        <text
          x="48"
          y="78"
          textAnchor="middle"
          fill="#FFF5E4"
          fontSize="12"
          fontWeight="800"
          fontFamily="sans-serif"
          letterSpacing="1"
        >
          CHOY
        </text>
        <text
          x="48"
          y="85.5"
          textAnchor="middle"
          fill="#FF8A50"
          fontSize="5.8"
          fontWeight="700"
          fontFamily="sans-serif"
          letterSpacing="1.2"
        >
          DELIVERY
        </text>
      </svg>
    </div>
  );
};
