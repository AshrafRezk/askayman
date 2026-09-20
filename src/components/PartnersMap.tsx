import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { GeoJSON as ParcelGeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { asset } from '../assets'
import parcels from '../data/partner-parcels.json'
import { haptic } from '../haptics'
import {
  PARTNER_COMPOUNDS,
  PARTNER_REGIONS,
  type PartnerCompound,
  type PartnerRegion,
} from '../partners'
import { CloudastickFootnote } from './CloudastickFootnote'
import 'leaflet/dist/leaflet.css'

type ParcelProps = {
  partnerId: string
  name: string
  kind: 'compound' | 'zone' | 'outline'
  primary: boolean
}

type ParcelFeature = {
  type: 'Feature'
  id?: string
  properties: ParcelProps
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

const PARCELS = parcels as { type: 'FeatureCollection'; features: ParcelFeature[] }

function pin(compound: PartnerCompound, active: boolean) {
  return L.divIcon({
    className: `partner-pin${active ? ' is-on' : ''}`,
    html: `<span class="partner-pin-disc"><img src="${asset(compound.logo)}" alt="" /></span>`,
    iconSize: active ? [108, 52] : [92, 44],
    iconAnchor: active ? [54, 26] : [46, 22],
    popupAnchor: [0, -22],
  })
}

function parcelStyle(props: ParcelProps, selected: string | null): L.PathOptions {
  const active = props.partnerId === selected
  if (props.kind === 'outline') {
    return {
      color: '#d4b15a',
      fillColor: '#08111c',
      fillOpacity: active ? 0.1 : 0.04,
      weight: 1.5,
      dashArray: '7,6',
    }
  }
  if (active && props.primary) {
    return {
      color: '#f0d48a',
      fillColor: '#c49c4f',
      fillOpacity: 0.5,
      weight: 3.4,
    }
  }
  if (active) {
    return {
      color: '#7dcea0',
      fillColor: '#2a9d8f',
      fillOpacity: 0.28,
      weight: 2,
    }
  }
  return {
    color: '#d4b15a',
    fillColor: '#c49c4f',
    fillOpacity: 0.24,
    weight: 2,
  }
}

function boundsForPartner(partnerId: string) {
  const primary = PARCELS.features.find((feature) => feature.properties.partnerId === partnerId && feature.properties.primary)
  const fallback = PARCELS.features.find((feature) => feature.properties.partnerId === partnerId)
  const feature = primary ?? fallback
  if (!feature) return null
  return L.geoJSON(feature as never).getBounds()
}

function boundsForRegion(region: PartnerRegion | 'all') {
  const ids = new Set(
    PARTNER_COMPOUNDS.filter((item) => region === 'all' || item.region === region).map((item) => item.id),
  )
  const features = PARCELS.features.filter(
    (feature) => ids.has(feature.properties.partnerId) && feature.properties.kind !== 'outline',
  )
  if (!features.length) return null
  return features.reduce((bounds, feature) => bounds.extend(L.geoJSON(feature as never).getBounds()), L.geoJSON(features[0] as never).getBounds())
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
      if (selected) {
        const bounds = boundsForPartner(selected)
        if (bounds?.isValid()) {
          map.flyToBounds(bounds, { padding: [36, 36], duration: 1.45, maxZoom: 16 })
          return
        }
        const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected)
        if (compound) map.flyTo([compound.lat, compound.lng], compound.zoom, { duration: 1.45 })
        return
      }
      const bounds = boundsForRegion(region)
      const view = PARTNER_REGIONS.find((item) => item.id === region) ?? PARTNER_REGIONS[0]
      if (region !== 'all' && bounds?.isValid()) {
        map.flyToBounds(bounds, { padding: [48, 48], duration: 1.35, maxZoom: 13 })
        return
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

function ParcelLayer({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string) => void
}) {
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  return (
    <ParcelGeoJSON
      data={PARCELS}
      style={(feature) => parcelStyle((feature?.properties ?? {}) as ParcelProps, selected)}
      onEachFeature={(feature, layer) => {
        const props = feature.properties as ParcelProps
        layer.on('click', () => {
          haptic('medium')
          onSelectRef.current(props.partnerId)
        })
        if (selected === props.partnerId && props.primary && 'bringToFront' in layer) {
          ;(layer as L.Path).bringToFront()
        }
      }}
      key={selected ?? 'all'}
    />
  )
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
      <ParcelLayer selected={selected} onSelect={onSelect} />
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
