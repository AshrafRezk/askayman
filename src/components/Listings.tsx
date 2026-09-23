import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Circle, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { CONTACT, copy, type Lang } from '../data'
import { formatEgp, PARTNER_OFFERS } from '../data/partner-offers'
import { PARTNER_COMPOUNDS } from '../partners'
import 'leaflet/dist/leaflet.css'

const PAGE_SIZE = 6

/** Stable offset so the map shows a neighborhood, not the compound gate. */
function approximateArea(id: string, lat: number, lng: number) {
  let hash = 0
  for (const char of id) hash = (hash * 33 + char.charCodeAt(0)) >>> 0
  const angle = ((hash % 360) * Math.PI) / 180
  const km = 1.4 + (hash % 160) / 100
  const dLat = (km / 111) * Math.cos(angle)
  const dLng = (km / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
  return { lat: lat + dLat, lng: lng + dLng }
}

export function Listings({ lang }: { lang: Lang }) {
  const t = copy[lang]
  const [page, setPage] = useState(0)
  const [view, setView] = useState<'cards' | 'map'>('cards')
  const rows = useMemo(
    () =>
      PARTNER_OFFERS.map((offer) => {
        const compound = PARTNER_COMPOUNDS.find((item) => item.id === offer.partnerId)
        return { offer, compound }
      }).filter((row) => row.compound),
    [],
  )
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const areas = slice.map(({ offer, compound }) => ({
    offer,
    compound: compound!,
    area: approximateArea(compound!.id, compound!.lat, compound!.lng),
  }))

  return (
    <section className="section page-view" id="listings">
      <p className="kicker">{t.nav[4]}</p>
      <h1 className="display page-title">{t.listingsTitle}</h1>
      <p className="page-lead">{t.listingsLead}</p>

      <div className="listing-toolbar">
        <div className="destination-tabs" role="tablist">
          <button type="button" className={view === 'cards' ? 'is-on' : undefined} onClick={() => setView('cards')}>
            {t.listingsCards}
          </button>
          <button type="button" className={view === 'map' ? 'is-on' : undefined} onClick={() => setView('map')}>
            {t.listingsMap}
          </button>
        </div>
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

      {view === 'map' ? (
        <div className="listing-map-wrap">
          <MapContainer
            center={[30.05, 31.25]}
            zoom={9}
            scrollWheelZoom={false}
            className="listing-map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {areas.map(({ offer, compound, area }) => {
              const name = lang === 'ar' ? compound.nameAr : compound.name
              return (
                <Circle
                  key={offer.partnerId}
                  center={[area.lat, area.lng]}
                  radius={2200}
                  pathOptions={{ color: '#d4b15a', weight: 1, fillColor: '#d4b15a', fillOpacity: 0.28 }}
                >
                  <Popup>
                    <strong>{name}</strong>
                    <br />
                    {t.listingsFrom} {formatEgp(offer.priceFrom, lang)}
                  </Popup>
                </Circle>
              )
            })}
          </MapContainer>
          <p className="page-note">{t.listingsAreaNote}</p>
        </div>
      ) : (
        <div className="listing-grid">
          {slice.map(({ offer, compound }, index) => {
            const name = lang === 'ar' ? compound!.nameAr : compound!.name
            const message =
              lang === 'ar'
                ? `مرحبا أيمن، عايز أحدث سعر وخطة لـ ${name}.`
                : `Hello Ayman, please share the latest price and plan for ${name}.`
            return (
              <motion.article
                className="listing-card"
                key={offer.partnerId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.24) }}
              >
                <header>
                  <h2>{name}</h2>
                  <span className={`listing-tag is-${offer.availability}`}>
                    {offer.availability === 'primary'
                      ? lang === 'ar'
                        ? 'أساسي'
                        : 'Primary'
                      : offer.availability === 'resale'
                        ? lang === 'ar'
                          ? 'إعادة بيع'
                          : 'Resale'
                        : lang === 'ar'
                          ? 'مباع'
                          : 'Sold out'}
                  </span>
                </header>
                <p>{lang === 'ar' ? offer.unitHintAr : offer.unitHint}</p>
                <p className="listing-price">
                  {t.listingsFrom} <b>{formatEgp(offer.priceFrom, lang)}</b>
                </p>
                <a
                  className="btn btn-gold"
                  href={`${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.listingsAsk}
                </a>
              </motion.article>
            )
          })}
        </div>
      )}
      <p className="page-note">{t.listingsNote}</p>
    </section>
  )
}
