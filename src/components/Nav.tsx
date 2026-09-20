import { motion } from 'framer-motion'
import { copy, type Lang } from '../data'
import { Logo } from './Logo'

const ids = ['about', 'services', 'insights', 'contact']

export function Nav({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  const t = copy[lang]

  return (
    <motion.header
      className="nav"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <Logo />
      <ul className="nav-links">
        {t.nav.map((label, index) => (
          <li key={label}>
            <a href={`#${ids[index]}`}>{label}</a>
          </li>
        ))}
      </ul>
      <div className="nav-actions">
        <div className="lang-toggle" role="group" aria-label="Language">
          <button className={lang === 'en' ? 'is-on' : undefined} onClick={() => setLang('en')}>
            EN
          </button>
          <button className={lang === 'ar' ? 'is-on' : undefined} onClick={() => setLang('ar')}>
            عربي
          </button>
        </div>
      </div>
    </motion.header>
  )
}
