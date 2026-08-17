import { HOLIDAY_TYPE_LABELS, formatHolidayDate } from '../services/holidayService';
import { holidayDisplayClass } from '../data/indiaPublicHolidays';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildHolidayMap(holidays) {
  return holidays.reduce((acc, holiday) => {
    if (!acc[holiday.date]) acc[holiday.date] = [];
    acc[holiday.date].push(holiday);
    return acc;
  }, {});
}

function cellStateClass(holiday) {
  return holidayDisplayClass(holiday);
}

function sourceLabel(holiday) {
  if (holiday.source === 'national') return holiday.region || 'Public holiday';
  if (holiday.type === 'company') return 'Company holiday';
  if (holiday.type === 'optional') return 'Optional holiday';
  return HOLIDAY_TYPE_LABELS[holiday.type] || 'Holiday';
}

export default function HolidayCalendar({
  year,
  month,
  holidays = [],
  onPrevMonth,
  onNextMonth,
  onToday,
  selectedDate,
  onSelectDate,
  readOnly = false,
}) {
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const holidayMap = buildHolidayMap(holidays);
  const cells = buildMonthGrid(year, month);

  const monthHolidays = holidays.filter((h) => {
    const [y, m] = String(h.date).split('-').map(Number);
    return y === year && m === month;
  });

  const companyCount = holidays.filter((h) => h.source !== 'national').length;
  const publicCount = holidays.length - companyCount;

  return (
    <div className="holiday-calendar">
      <div className="holiday-calendar-toolbar">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <div className="holiday-calendar-title">
          <strong>{MONTH_NAMES[month - 1]} {year}</strong>
          {!readOnly && onToday && (
            <button type="button" className="btn btn-secondary btn-sm holiday-today-btn" onClick={onToday}>
              Today
            </button>
          )}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="holiday-calendar-summary">
        <span>{holidays.length} holidays shown</span>
        <span className="holiday-summary-dot">·</span>
        <span>{publicCount} public</span>
        {companyCount > 0 && (
          <>
            <span className="holiday-summary-dot">·</span>
            <span>{companyCount} company</span>
          </>
        )}
      </div>

      <div className="holiday-calendar-legend">
        <span className="holiday-legend-item"><i className="holiday-dot holiday-dot--public" /> National</span>
        <span className="holiday-legend-item"><i className="holiday-dot holiday-dot--regional" /> TS & AP</span>
        <span className="holiday-legend-item"><i className="holiday-dot holiday-dot--telangana" /> Telangana</span>
        <span className="holiday-legend-item"><i className="holiday-dot holiday-dot--andhra-pradesh" /> Andhra Pradesh</span>
        <span className="holiday-legend-item"><i className="holiday-dot holiday-dot--company" /> Company</span>
      </div>

      <div className="holiday-calendar-grid">
        {WEEKDAYS.map((label) => (
          <div key={label} className="holiday-calendar-weekday">{label}</div>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="holiday-calendar-cell holiday-calendar-cell--empty" />;
          }

          const dateKey = isoDate(year, month, day);
          const dayHolidays = holidayMap[dateKey] || [];
          const primary = dayHolidays[0];
          const isToday = dateKey === todayIso;
          const isSelected = selectedDate === dateKey;
          const title = dayHolidays
            .map((h) => `${h.name}${h.region ? ` (${h.region})` : ''}${h.description ? `: ${h.description}` : ''}`)
            .join('\n');

          return (
            <button
              key={dateKey}
              type="button"
              className={[
                'holiday-calendar-cell',
                isToday ? 'holiday-calendar-cell--today' : '',
                primary ? `holiday-calendar-cell--${cellStateClass(primary)}` : '',
                isSelected ? 'holiday-calendar-cell--selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDate?.(dateKey, primary, dayHolidays)}
              disabled={readOnly && dayHolidays.length === 0}
              title={title || undefined}
            >
              <span className="holiday-calendar-day">{day}</span>
              {primary && (
                <>
                  <span className="holiday-calendar-label">{primary.name}</span>
                  {dayHolidays.length > 1 && (
                    <span className="holiday-calendar-tag">+{dayHolidays.length - 1}</span>
                  )}
                  {primary.region && dayHolidays.length === 1 && (
                    <span className="holiday-calendar-tag">{primary.region.replace('Telangana & Andhra Pradesh', 'TS & AP')}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="holiday-month-list">
        <h3 className="holiday-month-list-title">
          Holidays in {MONTH_NAMES[month - 1]}
        </h3>
        {monthHolidays.length === 0 ? (
          <p className="empty-state">No holidays this month for the selected filter.</p>
        ) : (
          <ul className="holiday-list holiday-list--detailed">
            {monthHolidays.map((holiday) => (
              <li key={holiday.id} className={`holiday-list-item holiday-list-item--${cellStateClass(holiday)}`}>
                <div className="holiday-list-body">
                  <div className="holiday-list-head">
                    <strong>{holiday.name}</strong>
                    <span className="holiday-type-badge">{sourceLabel(holiday)}</span>
                  </div>
                  <span className="row-sub">{formatHolidayDate(holiday.date)}</span>
                  {holiday.description && (
                    <p className="holiday-list-desc">{holiday.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
