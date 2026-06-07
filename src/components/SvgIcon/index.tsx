interface SvgIconProps {
  name: string
  className?: string
  color?: string
  size?: number | string
}

export default function SvgIcon(props: SvgIconProps) {
  const { name, className = '', color, size = '1em' } = props
  const symbolId = `#icon-${name}`

  return (
    <svg
      className={`svg-icon ${className}`}
      aria-hidden="true"
      style={{ width: size, height: size, fill: color || 'currentColor' }}
    >
      <use xlinkHref={symbolId} />
    </svg>
  )
}
