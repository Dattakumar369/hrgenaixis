export const STATE_FILTERS = {
  ALL: 'all',
  TELANGANA: 'telangana',
  ANDHRA_PRADESH: 'andhra-pradesh',
  NATIONAL: 'national',
};

export const STATE_FILTER_LABELS = {
  all: 'All holidays',
  telangana: 'Telangana',
  'andhra-pradesh': 'Andhra Pradesh',
  national: 'National',
};

/** states: national | telangana | andhra-pradesh (can combine telangana + andhra-pradesh) */
const HOLIDAY_DATA = {
  2025: [
    { name: 'Republic Day', date: '2025-01-26', states: ['national'], description: 'National holiday — adoption of the Constitution of India.' },
    { name: 'Bhogi (Sankranti)', date: '2025-01-14', states: ['telangana', 'andhra-pradesh'], description: 'First day of Sankranti festival. Public holiday in Telangana and Andhra Pradesh.' },
    { name: 'Sankranti / Pongal', date: '2025-01-15', states: ['telangana', 'andhra-pradesh'], description: 'Harvest festival. Major public holiday in both Telugu states.' },
    { name: 'Kanuma', date: '2025-01-16', states: ['andhra-pradesh'], description: 'Third day of Sankranti. Public holiday in Andhra Pradesh.' },
    { name: 'Maha Shivaratri', date: '2025-02-26', states: ['telangana', 'andhra-pradesh'], description: 'Festival dedicated to Lord Shiva. Public holiday in both states.' },
    { name: 'Holi', date: '2025-03-14', states: ['national'], description: 'Festival of colours. National public holiday.' },
    { name: 'Ugadi', date: '2025-03-30', states: ['telangana', 'andhra-pradesh'], description: 'Telugu New Year. Public holiday in Telangana and Andhra Pradesh.' },
    { name: 'Eid ul-Fitr', date: '2025-03-31', states: ['national'], description: 'Festival marking the end of Ramadan. National public holiday.' },
    { name: 'Ram Navami', date: '2025-04-06', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Lord Rama. Public holiday in both states.' },
    { name: 'Mahavir Jayanti', date: '2025-04-10', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Lord Mahavir. Public holiday.' },
    { name: 'Dr. Ambedkar Jayanti', date: '2025-04-14', states: ['national'], description: 'Birth anniversary of Dr. B.R. Ambedkar. National public holiday.' },
    { name: 'Good Friday', date: '2025-04-18', states: ['national'], description: 'Christian commemoration. National public holiday.' },
    { name: 'May Day', date: '2025-05-01', states: ['telangana', 'andhra-pradesh'], description: 'International Labour Day. Public holiday in both states.' },
    { name: 'Bakrid (Eid ul-Adha)', date: '2025-06-07', states: ['national'], description: 'Festival of sacrifice. National public holiday.' },
    { name: 'Telangana Formation Day', date: '2025-06-02', states: ['telangana'], description: 'Telangana state formation day (2 June 2014). Public holiday in Telangana only.' },
    { name: 'Bonalu', date: '2025-07-27', states: ['telangana'], description: 'Traditional Telangana festival honouring Goddess Mahakali. State public holiday.' },
    { name: 'Muharram', date: '2025-07-06', states: ['telangana', 'andhra-pradesh'], description: 'Islamic New Year. Public holiday in both states.' },
    { name: 'Independence Day', date: '2025-08-15', states: ['national'], description: 'National holiday — Independence of India (1947).' },
    { name: 'Vinayaka Chavithi', date: '2025-08-27', states: ['telangana', 'andhra-pradesh'], description: 'Ganesh Chaturthi. Public holiday in Telangana and Andhra Pradesh.' },
    { name: 'Milad un-Nabi', date: '2025-09-05', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Prophet Muhammad. Public holiday.' },
    { name: 'Gandhi Jayanti', date: '2025-10-02', states: ['national'], description: 'Birth anniversary of Mahatma Gandhi. National public holiday.' },
    { name: 'Dussehra (Vijayadashami)', date: '2025-10-02', states: ['telangana', 'andhra-pradesh'], description: 'Vijaya Dashami. Major public holiday in both Telugu states.' },
    { name: 'Bathukamma', date: '2025-10-11', states: ['telangana'], description: 'Telangana floral festival (Bathukamma). State public holiday.' },
    { name: 'Diwali (Deepavali)', date: '2025-10-20', states: ['national'], description: 'Festival of lights. National public holiday.' },
    { name: 'Guru Nanak Jayanti', date: '2025-11-05', states: ['national'], description: 'Birth anniversary of Guru Nanak Dev Ji. National public holiday.' },
    { name: 'Andhra Pradesh Formation Day', date: '2025-11-01', states: ['andhra-pradesh'], description: 'Andhra Pradesh state formation day. Public holiday in AP only.' },
    { name: 'Christmas', date: '2025-12-25', states: ['national'], description: 'Christmas. National public holiday.' },
  ],
  2026: [
    { name: 'Republic Day', date: '2026-01-26', states: ['national'], description: 'National holiday — adoption of the Constitution of India.' },
    { name: 'Bhogi (Sankranti)', date: '2026-01-14', states: ['telangana', 'andhra-pradesh'], description: 'First day of Sankranti festival. Public holiday in Telangana and Andhra Pradesh.' },
    { name: 'Sankranti / Pongal', date: '2026-01-15', states: ['telangana', 'andhra-pradesh'], description: 'Harvest festival. Major public holiday in both Telugu states.' },
    { name: 'Kanuma', date: '2026-01-16', states: ['andhra-pradesh'], description: 'Third day of Sankranti. Public holiday in Andhra Pradesh.' },
    { name: 'Mukkanuma', date: '2026-01-17', states: ['andhra-pradesh'], description: 'Fourth day of Sankranti. Public holiday in Andhra Pradesh.' },
    { name: 'Maha Shivaratri', date: '2026-02-15', states: ['telangana', 'andhra-pradesh'], description: 'Festival dedicated to Lord Shiva. Public holiday in both states.' },
    { name: 'Holi', date: '2026-03-03', states: ['national'], description: 'Festival of colours. National public holiday.' },
    { name: 'Ugadi', date: '2026-03-19', states: ['telangana', 'andhra-pradesh'], description: 'Telugu New Year. Public holiday in Telangana and Andhra Pradesh.' },
    { name: 'Eid ul-Fitr', date: '2026-03-21', states: ['national'], description: 'Festival marking the end of Ramadan. National public holiday.' },
    { name: 'Ram Navami', date: '2026-03-27', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Lord Rama. Public holiday in both states.' },
    { name: 'Good Friday', date: '2026-04-03', states: ['national'], description: 'Christian commemoration. National public holiday.' },
    { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14', states: ['national'], description: 'Birth anniversary of Dr. B.R. Ambedkar. National public holiday.' },
    { name: 'Mahavir Jayanti', date: '2026-04-19', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Lord Mahavir. Public holiday.' },
    { name: 'May Day', date: '2026-05-01', states: ['telangana', 'andhra-pradesh'], description: 'International Labour Day. Public holiday in both states.' },
    { name: 'Bakrid (Eid ul-Adha)', date: '2026-05-28', states: ['national'], description: 'Festival of sacrifice. National public holiday.' },
    { name: 'Telangana Formation Day', date: '2026-06-02', states: ['telangana'], description: 'Telangana state formation day (2 June 2014). Public holiday in Telangana only.' },
    { name: 'Muharram', date: '2026-06-16', states: ['telangana', 'andhra-pradesh'], description: 'Islamic New Year. Public holiday in both states.' },
    { name: 'Bonalu', date: '2026-07-19', states: ['telangana'], description: 'Traditional Telangana festival honouring Goddess Mahakali. State public holiday.' },
    { name: 'Independence Day', date: '2026-08-15', states: ['national'], description: 'National holiday — Independence of India (1947).' },
    { name: 'Milad un-Nabi', date: '2026-08-26', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Prophet Muhammad. Public holiday.' },
    { name: 'Vinayaka Chavithi', date: '2026-09-14', states: ['telangana', 'andhra-pradesh'], description: 'Ganesh Chaturthi. Public holiday in Telangana and Andhra Pradesh.' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', states: ['national'], description: 'Birth anniversary of Mahatma Gandhi. National public holiday.' },
    { name: 'Bathukamma (Saddula Bathukamma)', date: '2026-10-19', states: ['telangana'], description: 'Final day of Bathukamma festival. Telangana state public holiday.' },
    { name: 'Dussehra (Vijayadashami)', date: '2026-10-20', states: ['telangana', 'andhra-pradesh'], description: 'Vijaya Dashami. Major public holiday in both Telugu states.' },
    { name: 'Diwali (Deepavali)', date: '2026-11-08', states: ['national'], description: 'Festival of lights. National public holiday.' },
    { name: 'Guru Nanak Jayanti', date: '2026-11-24', states: ['national'], description: 'Birth anniversary of Guru Nanak Dev Ji. National public holiday.' },
    { name: 'Andhra Pradesh Formation Day', date: '2026-11-01', states: ['andhra-pradesh'], description: 'Andhra Pradesh state formation day. Public holiday in AP only.' },
    { name: 'Christmas', date: '2026-12-25', states: ['national'], description: 'Christmas. National public holiday.' },
  ],
  2027: [
    { name: 'Republic Day', date: '2027-01-26', states: ['national'], description: 'National holiday — adoption of the Constitution of India.' },
    { name: 'Bhogi (Sankranti)', date: '2027-01-14', states: ['telangana', 'andhra-pradesh'], description: 'First day of Sankranti festival.' },
    { name: 'Sankranti / Pongal', date: '2027-01-15', states: ['telangana', 'andhra-pradesh'], description: 'Harvest festival. Major public holiday in both Telugu states.' },
    { name: 'Kanuma', date: '2027-01-16', states: ['andhra-pradesh'], description: 'Third day of Sankranti. Public holiday in Andhra Pradesh.' },
    { name: 'Maha Shivaratri', date: '2027-03-06', states: ['telangana', 'andhra-pradesh'], description: 'Festival dedicated to Lord Shiva.' },
    { name: 'Holi', date: '2027-03-22', states: ['national'], description: 'Festival of colours. National public holiday.' },
    { name: 'Ugadi', date: '2027-04-08', states: ['telangana', 'andhra-pradesh'], description: 'Telugu New Year.' },
    { name: 'Ram Navami', date: '2027-04-15', states: ['telangana', 'andhra-pradesh'], description: 'Birth anniversary of Lord Rama.' },
    { name: 'Good Friday', date: '2027-03-26', states: ['national'], description: 'National public holiday.' },
    { name: 'Dr. Ambedkar Jayanti', date: '2027-04-14', states: ['national'], description: 'National public holiday.' },
    { name: 'May Day', date: '2027-05-01', states: ['telangana', 'andhra-pradesh'], description: 'International Labour Day.' },
    { name: 'Telangana Formation Day', date: '2027-06-02', states: ['telangana'], description: 'Telangana state formation day.' },
    { name: 'Independence Day', date: '2027-08-15', states: ['national'], description: 'National holiday.' },
    { name: 'Vinayaka Chavithi', date: '2027-09-03', states: ['telangana', 'andhra-pradesh'], description: 'Ganesh Chaturthi.' },
    { name: 'Gandhi Jayanti', date: '2027-10-02', states: ['national'], description: 'National public holiday.' },
    { name: 'Dussehra (Vijayadashami)', date: '2027-10-09', states: ['telangana', 'andhra-pradesh'], description: 'Vijaya Dashami.' },
    { name: 'Bathukamma', date: '2027-10-08', states: ['telangana'], description: 'Telangana floral festival. State public holiday.' },
    { name: 'Diwali (Deepavali)', date: '2027-10-28', states: ['national'], description: 'Festival of lights.' },
    { name: 'Andhra Pradesh Formation Day', date: '2027-11-01', states: ['andhra-pradesh'], description: 'AP state formation day.' },
    { name: 'Christmas', date: '2027-12-25', states: ['national'], description: 'National public holiday.' },
  ],
};

export function formatHolidayStates(states = []) {
  if (!states.length || states.includes('national') && states.length === 1) {
    return 'India (National)';
  }
  const hasTs = states.includes('telangana');
  const hasAp = states.includes('andhra-pradesh');
  if (hasTs && hasAp) return 'Telangana & Andhra Pradesh';
  if (hasTs) return 'Telangana';
  if (hasAp) return 'Andhra Pradesh';
  return 'India';
}

export function filterHolidaysByState(holidays, stateFilter) {
  if (!stateFilter || stateFilter === STATE_FILTERS.ALL) return holidays;
  return holidays.filter((holiday) => {
    if (holiday.source === 'company' || holiday.type === 'company') return true;
    const states = holiday.states || ['national'];
    if (stateFilter === STATE_FILTERS.NATIONAL) return states.includes('national');
    return states.includes(stateFilter);
  });
}

export function holidayDisplayClass(holiday) {
  if (!holiday || holiday.source === 'company' || holiday.type === 'company') return 'company';
  const states = holiday.states || [];
  if (states.includes('telangana') && states.includes('andhra-pradesh')) return 'regional';
  if (states.includes('telangana')) return 'telangana';
  if (states.includes('andhra-pradesh')) return 'andhra-pradesh';
  return 'public';
}

function normalizePublicHoliday(entry, year) {
  const [y] = entry.date.split('-').map(Number);
  const states = entry.states || ['national'];
  return {
    id: `public-${entry.date}-${entry.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: entry.name,
    date: entry.date,
    year: y || year,
    type: 'public',
    states,
    description: entry.description,
    region: formatHolidayStates(states),
    source: 'national',
    readOnly: true,
  };
}

export function getIndiaPublicHolidays(year) {
  const list = HOLIDAY_DATA[year] || [];
  return list
    .map((entry) => normalizePublicHoliday(entry, year))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.name.localeCompare(b.name));
}

export function countPublicHolidays(year, stateFilter = STATE_FILTERS.ALL) {
  return filterHolidaysByState(getIndiaPublicHolidays(year), stateFilter).length;
}

export function countHolidaysByState(year) {
  const all = getIndiaPublicHolidays(year);
  return {
    total: all.length,
    telangana: filterHolidaysByState(all, STATE_FILTERS.TELANGANA).length,
    andhraPradesh: filterHolidaysByState(all, STATE_FILTERS.ANDHRA_PRADESH).length,
    national: filterHolidaysByState(all, STATE_FILTERS.NATIONAL).length,
  };
}
