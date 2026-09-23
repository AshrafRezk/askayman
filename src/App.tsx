import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { About } from './components/About'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Insights } from './components/Insights'
import { Listings } from './components/Listings'
import { Reviews } from './components/Reviews'
import { Logo } from './components/Logo'
import { MorphField } from './components/MorphField'
import { Nav } from './components/Nav'
import { Partners } from './components/Partners'
import { Services } from './components/Services'
import { VideoStage } from './components/VideoStage'
import { InstallApp } from './components/InstallApp'
import { WhatsAppFab } from './components/WhatsAppFab'
import type { Lang } from './data'
import { useSiteHaptics } from './haptics'

type Page = 'home' | 'listings' | 'reviews'

function pageFromHash(): Page {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'listings' || hash === 'reviews') return hash
  return 'home'
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en')
  const [booting, setBooting] = useState(true)
  const [page, setPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'home' : pageFromHash(),
  )
  useSiteHaptics()

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en'
  }, [lang])

  useEffect(() => {
    const sync = () => setPage(pageFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    if (page !== 'home') {
      window.scrollTo(0, 0)
      return
    }
    const id = window.location.hash.replace('#', '')
    if (!id) return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [page])

  return (
    <div className="site" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <VideoStage />
      <MorphField />
      <div className="grain" />
      <div className="vignette" />
      <Nav lang={lang} setLang={setLang} />
      {page === 'listings' ? (
        <Listings lang={lang} />
      ) : page === 'reviews' ? (
        <Reviews lang={lang} />
      ) : (
        <>
          <Hero lang={lang} />
          <About lang={lang} />
          <Services lang={lang} />
          <Insights lang={lang} />
          <Partners lang={lang} />
          <Contact lang={lang} />
        </>
      )}
      <Footer lang={lang} />
      <InstallApp lang={lang} />
      <WhatsAppFab />
      <AnimatePresence>
        {booting && (
          <motion.div
            className="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(18px)' }}
            transition={{ duration: 0.7 }}
          >
            <div className="loader-inner">
              <Logo variant="loader" />
              <div className="loader-bar">
                <span />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
