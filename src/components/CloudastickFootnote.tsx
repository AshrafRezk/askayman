import { asset } from '../assets'

const LABEL = 'Cloudastick Map Intelligence'

export function CloudastickFootnote() {
  return (
    <div className="cloudastick-footnote" role="note">
      <img className="cloudastick-map-logo" src={asset('images/cloudastick.jpg')} alt="" />
      <span className="cloudastick-map-label">{LABEL}</span>
    </div>
  )
}
