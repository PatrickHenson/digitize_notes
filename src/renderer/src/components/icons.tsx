// Small inline SVGs instead of an icon-library dependency — just two
// generic, standard shapes (an upload arrow+tray, a refresh/rotate arc).

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function UploadIcon(): React.JSX.Element {
  return (
    <svg {...ICON_PROPS} width="20" height="20" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

export function RotateIcon(): React.JSX.Element {
  return (
    <svg {...ICON_PROPS} width="20" height="20" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.8-6.5" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}
