type Props = {
  className?: string;
};

/** NSFW Droid mascot — android bust with heart eyes (brand mark). */
export function VesperMark({ className = "h-9 w-9" }: Props) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Head shell */}
      <rect x="6" y="10" width="24" height="20" rx="8" fill="#1E0A28" stroke="#C026D3" strokeWidth="1.5" />
      {/* Antennae */}
      <path
        d="M12 10V6.5C12 5.67 12.67 5 13.5 5H14.5C15.33 5 16 5.67 16 6.5V10"
        stroke="#C026D3"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="14" cy="4.5" r="1.75" fill="#FF4D8D" />
      <path
        d="M20 10V6.5C20 5.67 20.67 5 21.5 5H22.5C23.33 5 24 5.67 24 6.5V10"
        stroke="#C026D3"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="22" cy="4.5" r="1.75" fill="#FF4D8D" />
      {/* Face panel */}
      <rect x="9" y="14" width="18" height="12" rx="4" fill="#14061C" stroke="#C026D3" strokeWidth="0.75" opacity="0.9" />
      {/* Heart eyes */}
      <path
        d="M12.2 17.2c0-1.35 1.05-2.15 2.05-1.35.55.45.75.95.75 1.35 0-.4.2-.9.75-1.35 1-.8 2.05 0 2.05 1.35 0 .85-.95 2.1-2.8 3.45-1.85-1.35-2.8-2.6-2.8-3.45z"
        fill="#FF4D8D"
      />
      <path
        d="M20.2 17.2c0-1.35 1.05-2.15 2.05-1.35.55.45.75.95.75 1.35 0-.4.2-.9.75-1.35 1-.8 2.05 0 2.05 1.35 0 .85-.95 2.1-2.8 3.45-1.85-1.35-2.8-2.6-2.8-3.45z"
        fill="#FF4D8D"
      />
      {/* Cheek glow */}
      <circle cx="11" cy="22" r="1.25" fill="#FF4D8D" opacity="0.35" />
      <circle cx="25" cy="22" r="1.25" fill="#FF4D8D" opacity="0.35" />
      {/* Neck / bust hint */}
      <path
        d="M14 30h8v2.5c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5V30z"
        fill="#241033"
        stroke="#C026D3"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
