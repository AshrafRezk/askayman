export function Logo({ variant = 'nav' }: { variant?: 'nav' | 'loader' }) {
  return (
    <a className={`logo logo-${variant}`} href="#top" aria-label="Ask Ayman">
      <img src="/images/logo.png" alt="Ask Ayman Property Consultant" />
    </a>
  )
}
