import { useEffect, useMemo, useState } from 'react'
import { asset } from '../assets'
import { copy, type Lang } from '../data'
import { haptic } from '../haptics'
import {
  PARTNER_COMPOUNDS,
  PARTNER_REGIONS,
  chipInView,
  zonesForSelection,
  type PartnerView,
} from '../partners'
import { CloudastickFootnote } from './CloudastickFootnote'
import { PartnersMap } from './PartnersMap'

export function Partners({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [region, setRegion] = useState<PartnerView>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [iso3d, setIso3d] = useState(false)
  const [greenery, setGreenery] = useState(false)
  const [life, setLife] = useState(false)

  const compounds = useMemo(
    () => PARTNER_COMPOUNDS.filter((item) => chipInView(item, region)),
    [region],
  )
  const active = PARTNER_COMPOUNDS.find((item) => item.id === selected) ?? null
  const zones = useMemo(() => zonesForSelection(selected), [selected])
  const parentOn = active?.group === 'taj' ? 'taj-city' : null

  useEffect(() => {
    setReady(true)
  }, [])

  function chooseRegion(next: PartnerView) {
    haptic('light')
    setRegion(next)
    setSelected(next === 'taj' ? 'taj-city' : null)
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
        {compounds.map((compound) => (
          <button
            key={compound.id}
            type="button"
            className={`partner-chip${compound.id === selected || compound.id === parentOn ? ' is-on' : ''}${compound.group === 'taj' || compound.group === 'sarai' ? ' is-taj' : ''}`}
            onClick={() => chooseCompound(compound.id)}
          >
            <img src={asset(compound.logo)} alt="" />
            <span>{lang === 'ar' ? compound.nameAr : compound.name}</span>
          </button>
        ))}
      </div>

      {zones.length ? (
        <div className="partner-zones" role="list" aria-label={lang === 'ar' ? 'مراحل تاج سيتي' : 'Taj City zones'}>
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={`partner-chip is-zone${zone.id === selected ? ' is-on' : ''}`}
              onClick={() => chooseCompound(zone.id)}
            >
              <span>{lang === 'ar' ? zone.nameAr : zone.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className={`partners-stage${iso3d ? ' is-iso' : ''}${greenery ? ' is-green' : ''}${life ? ' is-life' : ''}`}>
        {ready ? (
          <PartnersMap
            lang={lang}
            selected={selected}
            region={region}
            iso3d={iso3d}
            greenery={greenery}
            life={life}
            onSelect={chooseCompound}
          />
        ) : (
          <div className="partners-map brand-map brand-map-fallback" />
        )}

        <div className="partners-view">
          <div className="lang-toggle" role="group" aria-label={t.partnersView}>
            <button
              type="button"
              className={!iso3d ? 'is-on' : undefined}
              aria-pressed={!iso3d}
              onClick={() => {
                haptic('light')
                setIso3d(false)
              }}
            >
              {t.partnersView2d}
            </button>
            <button
              type="button"
              className={iso3d ? 'is-on' : undefined}
              aria-pressed={iso3d}
              onClick={() => {
                haptic('medium')
                setIso3d(true)
              }}
            >
              {t.partnersView3d}
            </button>
          </div>
          <button
            type="button"
            className={`partners-green${greenery ? ' is-on' : ''}`}
            aria-pressed={greenery}
            onClick={() => {
              haptic('light')
              setGreenery((on) => !on)
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M8.2 1.4c2.4 2.2 3.4 4.8 3.1 7.2-.9-1.3-2.2-2.3-3.8-2.7 1.8 1.7 2.6 3.8 2.3 6.1C8.4 13.4 6.2 14.6 3.4 15c.2-3.4 1.6-5.8 4-7.2C5.6 7.4 3.9 6 2.6 3.8 4.7 4.1 6.6 3.2 8.2 1.4Zm4.7 4.1c1.3 1.5 1.7 3.3 1.3 5.1-1.4-.3-2.6.1-3.6.9.8-1.6.8-3.3 0-5.1 1 .1 1.8-.2 2.3-.9Z"
              />
            </svg>
            {t.partnersGreenery}
          </button>
          <button
            type="button"
            className={`partners-life${life ? ' is-on' : ''}`}
            aria-pressed={life}
            onClick={() => {
              haptic('light')
              setLife((on) => !on)
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                fill="currentColor"
                d="M2.2 9.2h11.6c.5 0 .9.4.8.9l-.3 1.2c-.1.4-.5.7-.9.7H2.6c-.4 0-.8-.3-.9-.7L1.4 10c-.1-.5.3-.8.8-.8Zm1.1-1.6.4-1.5c.1-.5.6-.9 1.1-.9h2.2c.3 0 .6.2.7.4l.5 1.1h3.2c.4 0 .8.3.9.7l.3 1.2H2.8l.5-1Zm1.4 4.8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm6.6 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"
              />
            </svg>
            {t.partnersLife}
          </button>
        </div>

        <CloudastickFootnote />
      </div>
    </section>
  )
}
