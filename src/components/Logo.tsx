import { asset } from '../assets'

export function Logo({ variant = 'nav' }: { variant?: 'nav' | 'loader' }) {
  return (
    <a className={`logo logo-${variant}`} href="#top" aria-label="Ask Ayman">
      <img src={asset('images/logo.png')} alt="Ask Ayman Property Consultant" />
    </a>
  )
}
