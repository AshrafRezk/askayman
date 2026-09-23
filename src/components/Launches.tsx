import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { CONTACT, copy, type Lang } from '../data'
import launchesData from '../data/new-launches.json'
import { formatEgp } from '../data/partner-offers'

const PAGE_SIZE = 6

type Launch = (typeof launchesData.launches)[number]

export function Launches({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [page, setPage] = useState(0)
  const rows = launchesData.launches as Launch[]
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const updated = useMemo(() => {
    const date = new Date(launchesData.fetchedAt)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }, [lang])

  return (
    <section className="section page-view" id="launches">
      <p className="kicker">{t.nav[4]}</p>
      <h1 className="display page-title">{t.launchesTitle}</h1>
      <p className="page-lead">{t.launchesLead}</p>
      {updated ? (
        <p className="page-note">
          {t.launchesUpdated} {updated}
        </p>
      ) : null}

      {rows.length > PAGE_SIZE ? (
        <div className="listing-toolbar">
          <div className="listing-pager">
            <button type="button" disabled={safePage === 0} onClick={() => setPage((current) => current - 1)}>
              {t.listingsPrev}
            </button>
            <span>
              {t.listingsPage} {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((current) => current + 1)}
            >
              {t.listingsNext}
            </button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p className="page-note">{t.launchesEmpty}</p>
      ) : (
        <div className="listing-grid">
          {slice.map((launch, index) => {
            const name = lang === 'ar' ? launch.nameAr : launch.name
            const area = lang === 'ar' ? launch.areaAr : launch.area
            const developer = lang === 'ar' ? launch.developerAr : launch.developer
            const message =
              lang === 'ar'
                ? `مرحبا أيمن، عايز تفاصيل إطلاق ${name} في ${area}.`
                : `Hello Ayman, I want the details on the new launch ${name} in ${area}.`
            return (
              <motion.article
                className="listing-card launch-card"
                key={launch.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.24) }}
              >
                {launch.imageUrl ? (
                  <img className="launch-photo" src={launch.imageUrl} alt="" />
                ) : null}
                <header>
                  <h2>{name}</h2>
                </header>
                <p>
                  {developer}
                  {area ? ` · ${area}` : ''}
                </p>
                {launch.minPrice ? (
                  <p className="listing-price">
                    {t.launchesFrom} <b>{formatEgp(launch.minPrice, lang)}</b>
                  </p>
                ) : null}
                <div className="launch-actions">
                  <a
                    className="btn btn-gold"
                    href={`${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.launchesAsk}
                  </a>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </section>
  )
}
