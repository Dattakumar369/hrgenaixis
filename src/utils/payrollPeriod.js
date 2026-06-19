const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function parseIsoDate(str) {
  if (!str) return null;
  const parts = String(str).trim().split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function parsePayPeriodDate(str) {
  if (!str) return null;
  const match = String(str).trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const monthIndex = MONTH_SHORT.findIndex((m) => m.toLowerCase() === match[2].toLowerCase());
  const year = Number(match[3]);
  if (monthIndex < 0) return null;
  const date = new Date(year, monthIndex, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) return null;
  return date;
}

export function formatPayPeriodDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}-${MONTH_SHORT[date.getMonth()]}-${date.getFullYear()}`;
}

export function inclusiveDayCount(from, to) {
  if (!from || !to) return 0;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Real payroll period from month/year + employee DOJ.
 * Mid-month join → period starts on DOJ, paid days pro-rated.
 * Current month → paid days until today (if before month end).
 */
export function computePayrollPeriod({ month, year, startDate, today = new Date() }) {
  const totalDays = daysInMonth(month, year);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, totalDays);

  let periodStart = new Date(monthStart);
  let periodEnd = new Date(monthEnd);
  let note = '';

  const doj = parseIsoDate(startDate);
  if (doj) {
    if (doj > monthEnd) {
      return {
        totalDays,
        paidDays: 0,
        lopDays: totalDays,
        payPeriodStart: formatPayPeriodDate(monthStart),
        payPeriodEnd: formatPayPeriodDate(monthEnd),
        note: 'Employee date of joining is after this payroll month.',
      };
    }
    if (doj > monthStart) {
      periodStart = doj;
      note = `Pro-rated from DOJ (${formatPayPeriodDate(doj)}).`;
    }
  }

  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isFuture =
    year > todayNorm.getFullYear() ||
    (year === todayNorm.getFullYear() && month > todayNorm.getMonth() + 1);

  if (isFuture) {
    return {
      totalDays,
      paidDays: 0,
      lopDays: totalDays,
      payPeriodStart: formatPayPeriodDate(periodStart),
      payPeriodEnd: formatPayPeriodDate(monthEnd),
      note: note || 'This payroll month is in the future.',
    };
  }

  const isCurrentMonth =
    year === todayNorm.getFullYear() && month === todayNorm.getMonth() + 1;

  if (isCurrentMonth && todayNorm < monthEnd) {
    periodEnd = todayNorm;
    note = note || 'Current month — paid days calculated until today.';
  }

  const paidDays = Math.min(inclusiveDayCount(periodStart, periodEnd), totalDays);
  const lopDays = Math.max(0, totalDays - paidDays);

  return {
    totalDays,
    paidDays,
    lopDays,
    payPeriodStart: formatPayPeriodDate(periodStart),
    payPeriodEnd: formatPayPeriodDate(periodEnd),
    note,
  };
}

export function computePaidDaysFromPeriod(payPeriodStart, payPeriodEnd, totalDays, month, year) {
  const start = parsePayPeriodDate(payPeriodStart);
  const end = parsePayPeriodDate(payPeriodEnd);
  if (!start || !end) return null;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, daysInMonth(month, year));

  const clampedStart = start < monthStart ? monthStart : start;
  const clampedEnd = end > monthEnd ? monthEnd : end;

  const paidDays = inclusiveDayCount(clampedStart, clampedEnd);
  const total = totalDays || daysInMonth(month, year);

  return {
    paidDays: Math.min(Math.max(paidDays, 0), total),
    lopDays: Math.max(0, total - Math.min(paidDays, total)),
  };
}

export function buildYearOptions(today = new Date()) {
  const current = today.getFullYear();
  return [current, current - 1, current - 2];
}
