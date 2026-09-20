import { useId } from 'react'

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.62 20v-6.4h2.15l.32-2.5h-2.47V9.5c0-.72.2-1.22 1.24-1.22h1.32V6.05c-.23-.03-.99-.1-1.9-.1-1.88 0-3.16 1.15-3.16 3.26v1.89H8.7v2.5h2.42V20h2.5Z"
      />
    </svg>
  )
}

export function InstagramIcon() {
  const id = useId()
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="45%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="7" fill={`url(#${id})`} />
      <rect x="6.2" y="6.2" width="11.6" height="11.6" rx="3.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.15" cy="7.85" r="0.9" fill="#fff" />
    </svg>
  )
}

export function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`socials ${className}`.trim()}>
      <a
        className="social"
        href="https://www.facebook.com/p/Ayman-Milad-Property-Consultant-100083253733071/"
        target="_blank"
        rel="noreferrer"
      >
        <FacebookIcon />
        <span>Facebook</span>
      </a>
      <a
        className="social"
        href="https://www.instagram.com/aymanmilad_property_consultant/"
        target="_blank"
        rel="noreferrer"
      >
        <InstagramIcon />
        <span>Instagram</span>
      </a>
    </div>
  )
}
