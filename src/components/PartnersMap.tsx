import L from 'leaflet'
import { useEffect, useMemo, useRef } from 'react'
import { GeoJSON as ParcelGeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { asset } from '../assets'
import parcels from '../data/partner-parcels.json'
import { haptic } from '../haptics'
import {
  PARTNER_COMPOUNDS,
  PARTNER_REGIONS,
  compoundInView,
  type PartnerCompound,
  type PartnerGroup,
  type PartnerView,
} from '../partners'
import { IsoMassingLayer } from './IsoMassingLayer'
import { LifeLayer } from './LifeLayer'
import 'leaflet/dist/leaflet.css'

type ParcelProps = {
  partnerId: string
  name: string
  kind: 'compound' | 'zone' | 'outline'
  primary: boolean
  family?: PartnerGroup
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

const TAJ_PIN_IDS = new Set(['taj-city', 'taj-sultan', 'taj-tzone', 'taj-shalya', 'taj-origami'])

function pin(compound: PartnerCompound, active: boolean) {
  return L.divIcon({
    className: `partner-pin${active ? ' is-on' : ''}${compound.group === 'taj' || compound.group === 'sarai' ? ' is-taj' : ''}`,
    html: `<span class="partner-pin-disc"><img src="${asset(compound.logo)}" alt="" /></span>`,
    iconSize: active ? [108, 52] : [92, 44],
    iconAnchor: active ? [54, 26] : [46, 22],
    popupAnchor: [0, -22],
  })
}

function selectedCompound(selected: string | null) {
  return PARTNER_COMPOUNDS.find((item) => item.id === selected) ?? null
}

function parcelTargetId(compound: PartnerCompound | null) {
  if (!compound) return null
  return compound.parcelId ?? compound.id
}

function parcelStyle(
  props: ParcelProps,
  selected: string | null,
  greenery: boolean,
  iso3d: boolean,
): L.PathOptions {
  const activeId = parcelTargetId(selectedCompound(selected))
  const active = props.partnerId === activeId || props.partnerId === selected
  const family = selectedCompound(selected)?.group
  const familyOn = Boolean(props.family && family && props.family === family)
  const ink = greenery ? '#7dcea0' : '#d4b15a'
  const gold = greenery ? '#9be7b0' : '#f0d48a'

  if (iso3d) {
    return {
      color: active || familyOn ? gold : ink,
      fillColor: greenery ? '#163828' : '#08111c',
      fillOpacity: active ? 0.1 : familyOn ? 0.06 : 0.03,
      weight: active ? 1.6 : 1.1,
      dashArray: props.kind === 'outline' ? '7,6' : undefined,
    }
  }
  if (props.kind === 'outline') {
    return {
      color: active || familyOn ? gold : ink,
      fillColor: greenery ? '#10281c' : '#08111c',
      fillOpacity: active ? 0.14 : familyOn ? 0.08 : 0.04,
      weight: active ? 2.2 : 1.5,
      dashArray: '7,6',
    }
  }
  if (active && props.primary) {
    return {
      color: gold,
      fillColor: greenery ? '#2a9d8f' : '#c49c4f',
      fillOpacity: 0.5,
      weight: 3.4,
    }
  }
  if (active || (familyOn && props.kind === 'zone')) {
    return {
      color: '#7dcea0',
      fillColor: '#2a9d8f',
      fillOpacity: active ? 0.32 : 0.18,
      weight: active ? 2.2 : 1.6,
    }
  }
  return {
    color: ink,
    fillColor: greenery ? '#2f6b4a' : '#c49c4f',
    fillOpacity: greenery ? 0.3 : 0.24,
    weight: 2,
  }
}

function boundsForPartner(partnerId: string) {
  const compound = PARTNER_COMPOUNDS.find((item) => item.id === partnerId)
  const target = compound ? parcelTargetId(compound) : partnerId
  const primary = PARCELS.features.find((feature) => feature.properties.partnerId === target && feature.properties.primary)
  const fallback = PARCELS.features.find((feature) => feature.properties.partnerId === target)
  const feature = primary ?? fallback
  if (!feature) return null
  return L.geoJSON(feature as never).getBounds()
}

function boundsForRegion(region: PartnerView) {
  const ids = new Set(PARTNER_COMPOUNDS.filter((item) => compoundInView(item, region)).map((item) => item.id))
  const features = PARCELS.features.filter((feature) => ids.has(feature.properties.partnerId))
  if (!features.length) return null
  return features.reduce(
    (bounds, feature) => bounds.extend(L.geoJSON(feature as never).getBounds()),
    L.geoJSON(features[0] as never).getBounds(),
  )
}

function showMarker(compound: PartnerCompound, selected: string | null) {
  if (compound.id === selected) return true
  if (compound.group === 'sodic' || compound.group === 'sarai') return true
  const tajOpen = Boolean(selected && PARTNER_COMPOUNDS.find((item) => item.id === selected)?.group === 'taj')
  if (compound.id === 'taj-city') return true
  return tajOpen && TAJ_PIN_IDS.has(compound.id)
}

function MapCamera({
  selected,
  region,
  iso3d,
}: {
  selected: string | null
  region: PartnerView
  iso3d: boolean
}) {
  const map = useMap()

  useEffect(() => {
    const fly = () => {
      map.invalidateSize()
      const pad = iso3d ? 64 : 36
      if (selected) {
        const bounds = boundsForPartner(selected)
        if (bounds?.isValid()) {
          map.flyToBounds(bounds, { padding: [pad, pad], duration: 1.45, maxZoom: iso3d ? 16.2 : 16 })
          return
        }
        const compound = PARTNER_COMPOUNDS.find((item) => item.id === selected)
        if (compound) map.flyTo([compound.lat, compound.lng], compound.zoom, { duration: 1.45 })
        return
      }
      const bounds = boundsForRegion(region)
      const view = PARTNER_REGIONS.find((item) => item.id === region) ?? PARTNER_REGIONS[0]
      if (region !== 'all' && bounds?.isValid()) {
        map.flyToBounds(bounds, {
          padding: [iso3d ? 72 : 48, iso3d ? 72 : 48],
          duration: 1.35,
          maxZoom: region === 'taj' ? 15 : 13,
        })
        return
      }
      map.flyTo([view.lat, view.lng], view.zoom, { duration: 1.35 })
    }
    const id = window.setTimeout(fly, 80)
    return () => window.clearTimeout(id)
  }, [iso3d, map, region, selected])

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
  greenery,
  iso3d,
  onSelect,
}: {
  selected: string | null
  greenery: boolean
  iso3d: boolean
  onSelect: (id: string) => void
}) {
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const activeId = parcelTargetId(selectedCompound(selected))

  return (
    <ParcelGeoJSON
      data={PARCELS}
      style={(feature) => parcelStyle((feature?.properties ?? {}) as ParcelProps, selected, greenery, iso3d)}
      onEachFeature={(feature, layer) => {
        const props = feature.properties as ParcelProps
        layer.on('click', () => {
          haptic('medium')
          onSelectRef.current(props.partnerId)
        })
        if ((props.partnerId === selected || props.partnerId === activeId) && props.primary && 'bringToFront' in layer) {
          ;(layer as L.Path).bringToFront()
        }
      }}
      key={`${selected ?? 'all'}-${greenery ? 'g' : 'd'}-${iso3d ? '3' : '2'}`}
    />
  )
}

export function PartnersMap({
  lang,
  selected,
  region,
  iso3d,
  greenery,
  life,
  onSelect,
}: {
  lang: 'en' | 'ar'
  selected: string | null
  region: PartnerView
  iso3d: boolean
  greenery: boolean
  life: boolean
  onSelect: (id: string) => void
}) {
  const icons = useMemo(
    () => Object.fromEntries(PARTNER_COMPOUNDS.map((item) => [item.id, pin(item, item.id === selected)])),
    [selected],
  )

  return (
    <MapContainer
      className={`partners-map brand-map${iso3d ? ' is-iso' : ''}${greenery ? ' is-green' : ''}${life ? ' is-life' : ''}`}
      center={[30.3, 30.3]}
      zoom={6.4}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <TileLayer attribution="" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapCamera selected={selected} region={region} iso3d={iso3d} />
      <WheelOnHover />
      <ParcelLayer selected={selected} greenery={greenery} iso3d={iso3d} onSelect={onSelect} />
      <LifeLayer selected={selected} life={life} iso3d={iso3d} greenery={greenery} />
      <IsoMassingLayer selected={selected} iso3d={iso3d} greenery={greenery} />
      {PARTNER_COMPOUNDS.filter((compound) => showMarker(compound, selected)).map((compound) => (
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
            {lang === 'ar' ? compound.detailAr : compound.detail}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
