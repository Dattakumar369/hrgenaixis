import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { mapStorageError, toUserMessage, USER_MESSAGES } from '../utils/userMessages';
import { getIndiaPublicHolidays } from '../data/indiaPublicHolidays';

export const HOLIDAY_TYPES = {
  PUBLIC: 'public',
  OPTIONAL: 'optional',
  COMPANY: 'company',
};

export const HOLIDAY_TYPE_LABELS = {
  [HOLIDAY_TYPES.PUBLIC]: 'Public holiday',
  [HOLIDAY_TYPES.OPTIONAL]: 'Optional holiday',
  [HOLIDAY_TYPES.COMPANY]: 'Company holiday',
};

export const HOLIDAY_OVERRIDE = {
  HIDE: 'hide',
};

function isHideOverride(holiday) {
  return holiday?.overrideAction === HOLIDAY_OVERRIDE.HIDE;
}

function isCompanyHolidayRecord(holiday) {
  return holiday && !isHideOverride(holiday);
}

function mapHolidayError(error, fallback = USER_MESSAGES.saveFailed) {
  return mapStorageError(error, fallback);
}

function parseHolidayDate(dateStr) {
  const parts = String(dateStr).trim().split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return { year: y, month: m, day: d, iso: `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
}

function isPermissionError(error) {
  const code = error?.code || '';
  const message = String(error?.message || '');
  return code === 'permission-denied'
    || message.includes('permission-denied')
    || message.includes('insufficient permissions');
}

async function fetchCustomHolidaysFromFirestore(year) {
  const snapshot = await getDocs(collection(db, 'holidays'));
  const yearStr = year ? String(year) : null;
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data(), source: 'company', readOnly: false }))
    .filter((holiday) => !yearStr || String(holiday.year) === yearStr || holiday.date?.startsWith(yearStr))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export async function getCustomHolidays(year) {
  try {
    return await fetchCustomHolidaysFromFirestore(year);
  } catch (error) {
    throw new Error(mapHolidayError(error, 'Could not load company holidays. Please try again.'));
  }
}

/** Returns company holidays; empty list if Firestore access is not set up yet. */
export async function tryGetCustomHolidays(year) {
  try {
    const holidays = await fetchCustomHolidaysFromFirestore(year);
    return { holidays, companySyncFailed: false };
  } catch (error) {
    if (isPermissionError(error)) {
      return { holidays: [], companySyncFailed: true };
    }
    throw new Error(mapHolidayError(error, 'Could not load company holidays. Please try again.'));
  }
}

/** @deprecated use getCustomHolidays or getCalendarHolidays */
export async function getHolidays(year) {
  return getCalendarHolidays(year);
}

export function mergeCalendarHolidays(customHolidays, year) {
  const hiddenPublicIds = new Set(
    customHolidays
      .filter(isHideOverride)
      .map((holiday) => holiday.hiddenPublicId)
      .filter(Boolean),
  );
  const publicHolidays = getIndiaPublicHolidays(year).filter(
    (holiday) => !hiddenPublicIds.has(holiday.id),
  );
  const companyHolidays = customHolidays.filter(isCompanyHolidayRecord);

  const merged = [...publicHolidays];
  companyHolidays.forEach((holiday) => {
    merged.push({
      ...holiday,
      source: 'company',
      readOnly: false,
      type: holiday.type || HOLIDAY_TYPES.COMPANY,
    });
  });
  return merged.sort(
    (a, b) => String(a.date).localeCompare(String(b.date)) || a.name.localeCompare(b.name),
  );
}

export function filterCompanyHolidayRecords(holidays) {
  return holidays.filter(isCompanyHolidayRecord);
}

export async function getCalendarHolidays(year) {
  const { holidays: custom } = await tryGetCustomHolidays(year);
  return mergeCalendarHolidays(custom, year);
}

/** Public holidays always load; company holidays may fail silently if server access is pending. */
export async function loadHolidayCalendar(year) {
  const { holidays: custom, companySyncFailed } = await tryGetCustomHolidays(year);
  return {
    holidays: mergeCalendarHolidays(custom, year),
    companySyncFailed,
  };
}

export async function createHoliday({ name, date, type, description }, hrEmail) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) throw new Error('Please enter a holiday name.');

  const parsed = parseHolidayDate(date);
  if (!parsed) throw new Error('Please select a valid date.');

  try {
    const existing = filterCompanyHolidayRecords(await getCustomHolidays(parsed.year));
    if (existing.some((h) => h.date === parsed.iso)) {
      throw new Error('A holiday already exists on this date.');
    }

    const docRef = await addDoc(collection(db, 'holidays'), {
      name: trimmedName,
      date: parsed.iso,
      year: parsed.year,
      type: type || HOLIDAY_TYPES.PUBLIC,
      description: String(description || '').trim(),
      createdBy: hrEmail,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    if (error.message?.includes('already exists') || error.message?.includes('Please')) {
      throw error;
    }
    throw new Error(toUserMessage(error, mapHolidayError(error, USER_MESSAGES.holidaySaveFailed)));
  }
}

export async function updateHoliday(holidayId, { name, date, type, description }) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) throw new Error('Please enter a holiday name.');

  const parsed = parseHolidayDate(date);
  if (!parsed) throw new Error('Please select a valid date.');

  try {
    const existing = filterCompanyHolidayRecords(await getCustomHolidays(parsed.year));
    if (existing.some((h) => h.date === parsed.iso && h.id !== holidayId)) {
      throw new Error('A holiday already exists on this date.');
    }

    await updateDoc(doc(db, 'holidays', holidayId), {
      name: trimmedName,
      date: parsed.iso,
      year: parsed.year,
      type: type || HOLIDAY_TYPES.PUBLIC,
      description: String(description || '').trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error.message?.includes('already exists') || error.message?.includes('Please')) {
      throw error;
    }
    throw new Error(toUserMessage(error, mapHolidayError(error, USER_MESSAGES.holidaySaveFailed)));
  }
}

export async function deleteHoliday(holidayId) {
  try {
    await deleteDoc(doc(db, 'holidays', holidayId));
  } catch (error) {
    throw new Error(mapHolidayError(error, USER_MESSAGES.holidaySaveFailed));
  }
}

/** Hide a built-in public holiday from the calendar for all users. */
export async function hidePublicHoliday(publicHoliday, hrEmail) {
  if (!publicHoliday?.id) throw new Error('Could not remove this holiday.');

  try {
    const year = publicHoliday.year || Number(String(publicHoliday.date).slice(0, 4));
    const existing = await getCustomHolidays(year);
    if (existing.some((h) => isHideOverride(h) && h.hiddenPublicId === publicHoliday.id)) {
      return;
    }

    await addDoc(collection(db, 'holidays'), {
      name: publicHoliday.name,
      date: publicHoliday.date,
      year,
      hiddenPublicId: publicHoliday.id,
      overrideAction: HOLIDAY_OVERRIDE.HIDE,
      createdBy: hrEmail,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(mapHolidayError(error, USER_MESSAGES.holidaySaveFailed));
  }
}

export async function removeHolidayFromCalendar(holiday, hrEmail) {
  if (holiday?.source === 'national' || holiday?.readOnly) {
    await hidePublicHoliday(holiday, hrEmail);
    return;
  }
  await deleteHoliday(holiday.id);
}

export function formatHolidayDate(dateStr) {
  const parsed = parseHolidayDate(dateStr);
  if (!parsed) return dateStr || '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekday = new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString('en-IN', { weekday: 'short' });
  return `${weekday}, ${String(parsed.day).padStart(2, '0')} ${months[parsed.month - 1]} ${parsed.year}`;
}
