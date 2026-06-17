export default function BrandLogo({ subtitle, size = 'md', onDark = false, compact = false }) {
  return (
    <div className={`brand-logo brand-logo--${size} ${onDark ? 'brand-logo--on-dark' : ''} ${compact ? 'brand-logo--compact' : ''}`}>
      <img src="/genaixislogo.jpeg" alt="Genaixis" className="brand-logo-img" />
      {subtitle && !compact && <p className="brand-subtitle">{subtitle}</p>}
    </div>
  );
}
