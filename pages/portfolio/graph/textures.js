const colorMap = {
  selected: '#4982b1',
  primary: '#005695',
  collision: '#b05e5e',
  study: '#3182bd',
  sunrise: '#e1a3a3',
  sunset: '#cd8a7b'
}

const makeTexture = function (texture, color, size) {
  const c = colorMap[color] || color || 'lightgrey'
  const s = size || 10
  const half = s / 2.4
  switch (texture) {
    case 'stripes':
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${c} 0, ${c} ${half}px, transparent ${half}px, transparent ${s}px)`
      }
    case 'diagonal':
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0, ${c} ${half}px, transparent ${half}px, transparent ${s}px)`
      }
    case 'diagonal-reverse':
      return {
        backgroundImage: `repeating-linear-gradient(-45deg, ${c} 0, ${c} ${half}px, transparent ${half}px, transparent ${s}px)`
      }
    case 'crosshatch':
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0, ${c} ${half}px, transparent ${half}px, transparent ${s}px), repeating-linear-gradient(-45deg, ${c} 0, ${c} ${half}px, transparent ${half}px, transparent ${s}px)`
      }
    case 'grid':
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${s}px), repeating-linear-gradient(90deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${s}px)`
      }
    case 'dots':
      return {
        backgroundImage: `radial-gradient(${c} ${Math.max(1, s / 5)}px, transparent ${Math.max(1, s / 5) + 1}px)`,
        backgroundSize: `${s}px ${s}px`
      }
    case 'solid':
    default:
      return { backgroundColor: c }
  }
}
export default makeTexture
