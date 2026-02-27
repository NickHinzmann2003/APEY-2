export function ApexLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M30 85C24 78 18 68 15 56C12 44 13 32 18 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="16" cy="75" rx="5" ry="3" transform="rotate(-30 16 75)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="13" cy="65" rx="5" ry="3" transform="rotate(-20 13 65)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="12" cy="54" rx="5" ry="3" transform="rotate(-10 12 54)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="13" cy="43" rx="5" ry="3" transform="rotate(5 13 43)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="15" cy="33" rx="5" ry="3" transform="rotate(15 15 33)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="20" cy="24" rx="5" ry="3" transform="rotate(30 20 24)" stroke="currentColor" strokeWidth="1.8" fill="none" />

      <path
        d="M70 85C76 78 82 68 85 56C88 44 87 32 82 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="84" cy="75" rx="5" ry="3" transform="rotate(30 84 75)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="87" cy="65" rx="5" ry="3" transform="rotate(20 87 65)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="88" cy="54" rx="5" ry="3" transform="rotate(10 88 54)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="87" cy="43" rx="5" ry="3" transform="rotate(-5 87 43)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="85" cy="33" rx="5" ry="3" transform="rotate(-15 85 33)" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <ellipse cx="80" cy="24" rx="5" ry="3" transform="rotate(-30 80 24)" stroke="currentColor" strokeWidth="1.8" fill="none" />

      <line x1="42" y1="90" x2="50" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="58" y1="90" x2="50" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontFamily="'Outfit', sans-serif"
        fontWeight="900"
        fontSize="50"
        fill="currentColor"
        letterSpacing="-2"
      >
        A
      </text>
    </svg>
  );
}