export function AngularDumbbell({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="1" y="7" width="4" height="10" rx="0.5" />
      <rect x="5" y="9" width="3" height="6" rx="0.5" />
      <rect x="16" y="9" width="3" height="6" rx="0.5" />
      <rect x="19" y="7" width="4" height="10" rx="0.5" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}