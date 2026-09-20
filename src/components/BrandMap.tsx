import L from 'leaflet'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { CONTACT, type Lang } from '../data'
import { haptic } from '../haptics'
import 'leaflet/dist/leaflet.css'

const office: L.LatLngExpression = [30.0923317, 31.3229306]

const pin = L.divIcon({
  className: 'brand-pin',
  html: '<img src="/images/logo.png" alt="" />',
  iconSize: [58, 58],
  iconAnchor: [29, 54],
  popupAnchor: [0, -46],
})

export function BrandMap({ lang }: { lang: Lang }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) return <div className="brand-map brand-map-fallback" />

  return (
    <MapContainer
      className="brand-map"
      center={office}
      zoom={16}
      scrollWheelZoom={false}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={office}
        icon={pin}
        eventHandlers={{ click: () => haptic('medium') }}
      >
        <Popup>
          <strong>Ask Ayman</strong>
          <br />
          {lang === 'ar' ? CONTACT.addressAr : CONTACT.addressEn}
        </Popup>
      </Marker>
    </MapContainer>
  )
}
