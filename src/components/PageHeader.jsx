import { useEffect } from 'react';
import { DOCUMENT_TITLE } from '../constants/brand';

export default function PageHeader({ title, subtitle, actions }) {
  useEffect(() => {
    document.title = title ? `${title} — ${DOCUMENT_TITLE}` : DOCUMENT_TITLE;
  }, [title]);

  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
