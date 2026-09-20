import { useEffect, useState } from 'react'
import { VIDEOS } from '../data'

export function VideoStage() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % VIDEOS.length)
    }, 9000)
    return () => window.clearInterval(id)
  }, [])

  const visible = [active, (active + 1) % VIDEOS.length]

  return (
    <div className="video-stage" aria-hidden="true">
      {visible.map((index) => (
        <video
          key={VIDEOS[index]}
          className={index === active ? 'is-on' : undefined}
          src={VIDEOS[index]}
          autoPlay
          muted
          loop
          playsInline
          preload={index === active ? 'auto' : 'metadata'}
        />
      ))}
      <div className="video-wash" />
    </div>
  )
}
