import { WORK_EMAIL_DOMAIN } from '../constants/brand';

export { WORK_EMAIL_DOMAIN };

/** @returns {{ email: string|null, error: 'empty'|'wrongDomain'|'invalid'|null }} */
export function normalizeWorkEmail(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return { email: null, error: 'empty' };

  let local = raw;
  if (raw.includes('@')) {
    const at = raw.lastIndexOf('@');
    local = raw.slice(0, at);
    const domain = raw.slice(at + 1);
    if (domain !== WORK_EMAIL_DOMAIN) {
      return { email: null, error: 'wrongDomain' };
    }
  }

  if (!local || !/^[a-z0-9._+-]+$/.test(local)) {
    return { email: null, error: 'invalid' };
  }

  return { email: `${local}@${WORK_EMAIL_DOMAIN}`, error: null };
}

export function extractEmailLocalPart(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('@')) {
    return raw.replace(/@genaixis\.com.*$/i, '').split('@')[0] || '';
  }
  return raw;
}

export function isWorkEmailDomain(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return normalized.endsWith(`@${WORK_EMAIL_DOMAIN}`);
}
