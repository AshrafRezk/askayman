import { useEffect, useMemo, useState } from 'react'
import { asset } from '../assets'
import { copy, type Lang } from '../data'
import { haptic } from '../haptics'
import { PARTNER_COMPOUNDS, PARTNER_REGIONS, type PartnerRegion } from '../partners'
import { PartnersMap } from './PartnersMap'

export function Partners({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [region, setRegion] = useState<PartnerRegion | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const visible = useMemo(
    () => PARTNER_COMPOUNDS.filter((item) => region === 'all' || item.region === region),
    [region],
  )
  const active = PARTNER_COMPOUNDS.find((item) => item.id === selected) ?? null
  const regionMeta = PARTNER_REGIONS.find((item) => item.id === region)

  useEffect(() => {
    setReady(true)
  }, [])

  function chooseRegion(next: PartnerRegion | 'all') {
    haptic('light')
    setRegion(next)
    setSelected(null)
  }

  function chooseCompound(id: string) {
    const compound = PARTNER_COMPOUNDS.find((item) => item.id === id)
    if (!compound) return
    haptic('medium')
    if (region !== 'all' && compound.region !== region) setRegion(compound.region)
    setSelected(compound.id)
  }

  function hop(step: number) {
    if (!visible.length) return
    const index = active ? visible.findIndex((item) => item.id === active.id) : -1
    const next = visible[(index + step + visible.length) % visible.length]
    chooseCompound(next.id)
  }

  return (
    <section className="section partners-section" id="partners">
      <div className="section-head">
        <p className="kicker">{t.nav[3]}</p>
        <h2 className="display">{t.partnersTitle}</h2>
        <p>{t.partnersLead}</p>
      </div>

      <div className="partners-toolbar">
        <div className="partners-brands">
          <img className="partners-sodic" src={asset('images/partners/sodic.png')} alt="SODIC" />
          <img className="partners-taj" src={asset('images/partners/taj-sultan.svg')} alt="Taj Sultan" />
        </div>
        <div className="partner-regions" role="tablist" aria-label={t.partnersTitle}>
          {PARTNER_REGIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={region === item.id}
              className={region === item.id ? 'is-on' : undefined}
              onClick={() => chooseRegion(item.id)}
            >
              {lang === 'ar' ? item.nameAr : item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="partner-rail" role="list">
        {visible.map((compound) => (
          <button
            key={compound.id}
            type="button"
            className={`partner-chip${compound.id === selected ? ' is-on' : ''}`}
            onClick={() => chooseCompound(compound.id)}
          >
            <img src={asset(compound.logo)} alt="" />
            <span>{lang === 'ar' ? compound.nameAr : compound.name}</span>
          </button>
        ))}
      </div>

      <div className="partners-stage">
        {ready ? (
          <PartnersMap lang={lang} selected={selected} region={region} onSelect={chooseCompound} />
        ) : (
          <div className="partners-map brand-map brand-map-fallback" />
        )}

        <div className="partners-hud">
          <button type="button" className="partners-hop" onClick={() => hop(-1)} aria-label={t.partnersPrev}>
            ‹
          </button>
          <div className="partners-now">
            <b>
              {active
                ? lang === 'ar'
                  ? active.nameAr
                  : active.name
                : lang === 'ar'
                  ? regionMeta?.nameAr
                  : regionMeta?.name}
            </b>
            <span>
              {active
                ? `${lang === 'ar' ? PARTNER_REGIONS.find((item) => item.id === active.region)?.nameAr : PARTNER_REGIONS.find((item) => item.id === active.region)?.name} · ${active.status === 'sold' ? t.partnersSold : t.partnersExplore}`
                : t.partnersHint}
            </span>
          </div>
          <button type="button" className="partners-hop" onClick={() => hop(1)} aria-label={t.partnersNext}>
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
