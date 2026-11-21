/**
 * Farsh's own mark: a marigold tile with a floor line and a price bar standing on it ("never price below
 * your floor"). Drawn inline so it needs no image file and stays sharp at any size.
 */
export function FarshMark({ size = 44, className = 'brand-tile' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#f2a531" />
      <rect x="10" y="33" width="28" height="4" rx="2" fill="#0a302a" />
      <rect x="14" y="21" width="6" height="12" rx="1.5" fill="#0a302a" opacity=".55" />
      <rect x="23" y="13" width="6" height="20" rx="1.5" fill="#0a302a" />
      <path d="M30 11l5 0 0 5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Brand lock-up for the sidebar and onboarding: mark + "Farsh फ़र्श" + an optional tagline. */
export function BrandMark({ sub, light = false }) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <FarshMark />
      <div className="brand-text">
        <div className="brand-parent">Farsh <span className="brand-hi" lang="hi">फ़र्श</span></div>
        {sub && <div className="brand-sub">{sub}</div>}
      </div>
    </div>
  );
}
