import L from 'leaflet'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { asset } from '../assets'
import { haptic } from '../haptics'
import {
  PARTNER_COMPOUNDS,
  PARTNER_REGIONS,
  type PartnerCompound,
  type PartnerRegion,
} from '../partners'
import { CloudastickFootnote } from './CloudastickFootnote'
import 'leaflet/dist/leaflet.css'

function pin(compound: PartnerCompound, active: boolean) {
  return L.divIcon({
    className: `partner-pin${active ? ' is-on' : ''}`,
    html: `<span class="partner-pin-disc"><img src="${asset(compound.logo)}" alt="" /></span>`,
    iconSize: active ? [108, 52] : [92, 44],
    iconAnchor: active ? [54, 26] : [46, 22],
    popupAnchor: [0, -22],
  })
}

function MapCamera({
  selected,
  region,
}: {
  selected: string | null
  region: PartnerRegion | 'all'
}) {
  const map = useMap()

  useEffect(() => {
    const fly = () => {
      map.invalidateSize()
      const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected)
      if (compound) {
        map.flyTo([compound.lat, compound.lng], compound.zoom, { duration: 1.45 })
        return
      }
      const view = PARTNER_REGIONS.find((item) => item.id === region) ?? PARTNER_REGIONS[0]
      if (region !== 'all') {
        const clustered = PARTNER_COMPOUNDS.filter((item) => item.region === region)
        if (clustered.length > 1) {
          const bounds = L.latLngBounds(clustered.map((item) => [item.lat, item.lng]))
          map.flyToBounds(bounds, { padding: [48, 48], duration: 1.35, maxZoom: 12 })
          return
        }
      }
      map.flyTo([view.lat, view.lng], view.zoom, { duration: 1.35 })
    }
    const id = window.setTimeout(fly, 80)
    return () => window.clearTimeout(id)
  }, [map, region, selected])

  return null
}

function WheelOnHover() {
  const map = useMap()
  useEffect(() => {
    map.scrollWheelZoom.disable()
    const el = map.getContainer()
    const on = () => map.scrollWheelZoom.enable()
    const off = () => map.scrollWheelZoom.disable()
    el.addEventListener('mouseenter', on)
    el.addEventListener('mouseleave', off)
    return () => {
      el.removeEventListener('mouseenter', on)
      el.removeEventListener('mouseleave', off)
    }
  }, [map])
  return null
}

export function PartnersMap({
  lang,
  selected,
  region,
  onSelect,
}: {
  lang: 'en' | 'ar'
  selected: string | null
  region: PartnerRegion | 'all'
  onSelect: (id: string) => void
}) {
  const icons = useMemo(
    () => Object.fromEntries(PARTNER_COMPOUNDS.map((item) => [item.id, pin(item, item.id === selected)])),
    [selected],
  )

  return (
    <MapContainer
      className="partners-map brand-map"
      center={[30.3, 30.3]}
      zoom={6.4}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CloudastickFootnote />
      <MapCamera selected={selected} region={region} />
      <WheelOnHover />
      {PARTNER_COMPOUNDS.map((compound) => (
        <Marker
          key={compound.id}
          position={[compound.lat, compound.lng]}
          icon={icons[compound.id]}
          zIndexOffset={compound.id === selected ? 600 : 0}
          eventHandlers={{
            click: () => {
              haptic('medium')
              onSelect(compound.id)
            },
          }}
        >
          <Popup>
            <strong>{lang === 'ar' ? compound.nameAr : compound.name}</strong>
            <br />
            {lang === 'ar'
              ? PARTNER_REGIONS.find((item) => item.id === compound.region)?.nameAr
              : PARTNER_REGIONS.find((item) => item.id === compound.region)?.name}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
