import { copy, type Lang } from '../data'
import { SocialLinks } from './SocialIcons'

export function Footer({ lang }: { lang: Lang }) {
  const t = copy[lang]
  return (
    <footer className="footer glass">
      <p>{t.footer}</p>
      <SocialLinks />
    </footer>
  )
}
