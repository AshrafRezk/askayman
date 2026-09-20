import L from 'leaflet'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { asset } from '../assets'

const LABEL = 'Cloudastick Map Intelligence'

export function CloudastickFootnote() {
  const map = useMap()

  useEffect(() => {
    const prefix =
      `<img class="cloudastick-map-logo" src="${asset('images/cloudastick.jpg')}" alt="" />` +
      `<span class="cloudastick-map-label">${LABEL}</span>`
    const control = L.control.attribution({ prefix, position: 'bottomright' })
    control.addTo(map)
    return () => {
      control.remove()
    }
  }, [map])

  return null
}
