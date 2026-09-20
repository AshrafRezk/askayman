import { useEffect, useMemo, useState } from 'react'
import { asset } from '../assets'
import { copy, type Lang } from '../data'
import { haptic } from '../haptics'
import {
  PARTNER_COMPOUNDS,
  PARTNER_REGIONS,
  compoundInView,
  type PartnerView,
} from '../partners'
import { PartnersMap } from './PartnersMap'

export function Partners({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [region, setRegion] = useState<PartnerView>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const visible = useMemo(
    () => PARTNER_COMPOUNDS.filter((item) => compoundInView(item, region)),
    [region],
  )
  const active = PARTNER_COMPOUNDS.find((item) => item.id === selected) ?? null
  const regionMeta = PARTNER_REGIONS.find((item) => item.id === region)

  useEffect(() => {
    setReady(true)
  }, [])

  function chooseRegion(next: PartnerView) {
    haptic('light')
    setRegion(next)
    setSelected(null)
  }

  function chooseCompound(id: string) {
    const compound = PARTNER_COMPOUNDS.find((item) => item.id === id)
    if (!compound) return
    haptic('medium')
    if (region === 'taj' && compound.group !== 'taj') {
      setRegion(compound.region)
    } else if (region !== 'all' && region !== 'taj' && compound.region !== region) {
      setRegion(compound.region)
    }
    setSelected(compound.id)
  }

  function hop(step: number) {
    if (!visible.length) return
    const index = active ? visible.findIndex((item) => item.id === active.id) : -1
    const next = visible[(index + step + visible.length) % visible.length]
    chooseCompound(next.id)
  }

  const hudPlace = active
    ? active.group === 'sarai'
      ? lang === 'ar'
        ? 'مدينة المستقبل · جنب مدينتي'
        : 'Mostakbal City · beside Madinaty'
      : active.group === 'taj'
        ? lang === 'ar'
          ? 'تاج سيتي · القاهرة الجديدة'
          : 'Taj City · New Cairo'
        : lang === 'ar'
          ? PARTNER_REGIONS.find((item) => item.id === active.region)?.nameAr
          : PARTNER_REGIONS.find((item) => item.id === active.region)?.name
    : lang === 'ar'
      ? regionMeta?.nameAr
      : regionMeta?.name

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
          <img className="partners-taj" src={asset('images/partners/taj-city.jpg')} alt="Taj City" />
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
            className={`partner-chip${compound.id === selected ? ' is-on' : ''}${compound.group === 'taj' || compound.group === 'sarai' ? ' is-taj' : ''}`}
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
                : hudPlace}
            </b>
            <span>
              {active
                ? `${hudPlace} · ${active.status === 'sold' ? t.partnersSold : t.partnersExplore}`
                : t.partnersHint}
            </span>
            {active ? <em>{lang === 'ar' ? active.detailAr : active.detail}</em> : null}
          </div>
          <button type="button" className="partners-hop" onClick={() => hop(1)} aria-label={t.partnersNext}>
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
