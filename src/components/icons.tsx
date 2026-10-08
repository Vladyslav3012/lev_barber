export function InstagramIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle
        cx="12"
        cy="12"
        r="4.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M14.5 3.5c.4 2.4 1.9 4.1 4.3 4.5v2.4c-1.5-.1-2.9-.6-4.1-1.5v6.3c0 3.1-2.5 5.5-5.6 5.5S3.5 18.3 3.5 15.2c0-3 2.3-5.4 5.2-5.6v2.5c-1.5.2-2.6 1.4-2.6 3 0 1.7 1.4 3.1 3.1 3.1s3.1-1.4 3.1-3.1V3.5h2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}
