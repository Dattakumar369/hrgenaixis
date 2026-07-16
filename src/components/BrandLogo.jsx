import { APP_NAME, COMPANY_NAME } from '../constants/brand';

export default function BrandLogo({
  subtitle,
  size = 'md',
  onDark = false,
  compact = false,
  showWordmark = false,
}) {
  return (
    <div
      className={[
        'brand-logo',
        `brand-logo--${size}`,
        onDark ? 'brand-logo--on-dark' : '',
        compact ? 'brand-logo--compact' : '',
        showWordmark ? 'brand-logo--wordmark' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="brand-logo-row">
        <img src="/genaixislogo.jpeg" alt={COMPANY_NAME} className="brand-logo-img" />
        {showWordmark && (
          <div className="brand-wordmark">
            <span className="brand-wordmark-title">{APP_NAME}</span>
            <span className="brand-wordmark-sub">by Genaixis</span>
          </div>
        )}
      </div>
      {subtitle && !compact && <p className="brand-subtitle">{subtitle}</p>}
    </div>
  );
}
