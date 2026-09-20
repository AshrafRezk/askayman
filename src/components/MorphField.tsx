export function MorphField() {
  return (
    <>
      <svg width="0" height="0" aria-hidden="true">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -10"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>
      <div className="morph-field">
        <div className="blob one" />
        <div className="blob two" />
        <div className="blob three" />
      </div>
    </>
  )
}
