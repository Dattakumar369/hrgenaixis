import { useCallback, useEffect, useState } from 'react';
import { loadHolidayCalendar, formatHolidayDate } from '../../services/holidayService';
import {
  countHolidaysByState,
  filterHolidaysByState,
  holidayDisplayClass,
  STATE_FILTERS,
  STATE_FILTER_LABELS,
} from '../../data/indiaPublicHolidays';
import HolidayCalendar from '../../components/HolidayCalendar';
import PageHeader from '../../components/PageHeader';
import { buildYearOptions } from '../../utils/payrollPeriod';
import { toUserMessage } from '../../utils/userMessages';

export default function EmployeeHolidaysPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companySyncFailed, setCompanySyncFailed] = useState(false);
  const [stateFilter, setStateFilter] = useState(STATE_FILTERS.ALL);

  const [error, setError] = useState('');

  const years = buildYearOptions(now);
  const stateCounts = countHolidaysByState(year);
  const filteredHolidays = filterHolidaysByState(holidays, stateFilter);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { holidays: calendar, companySyncFailed: syncFailed } = await loadHolidayCalendar(year);
      setHolidays(calendar);
      setCompanySyncFailed(syncFailed);
    } catch (err) {
      setError(toUserMessage(err, 'Could not load the holiday calendar. Please try again later.'));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  function shiftMonth(delta) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  }

  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const upcoming = filteredHolidays.filter((h) => h.date >= todayIso).slice(0, 8);

  return (
    <div className="portal-page">
      <PageHeader
        title="Holiday calendar"
        subtitle="Telangana & Andhra Pradesh public holidays, plus company holidays"
      />

      <div className="holiday-year-bar">
        <label htmlFor="empHolidayYear">Year</label>
        <select
          id="empHolidayYear"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[...years, year + 1].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => b - a).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="field-hint">
          {stateCounts.total} public · {stateCounts.telangana} TS · {stateCounts.andhraPradesh} AP
        </span>
      </div>

      <div className="filter-group">
        <span className="filter-group-label">Show</span>
        <div className="filter-tabs">
          {Object.entries(STATE_FILTER_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`filter-tab ${stateFilter === key ? 'active' : ''}`}
              onClick={() => setStateFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {companySyncFailed && (
        <div className="alert alert-warn">
          Public holidays are shown below. Extra company holidays may appear once HR has enabled them on the server.
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="portal-grid-2">
        <div className="card">
          {loading ? (
            <p className="empty-state">Loading calendar…</p>
          ) : (
            <HolidayCalendar
              year={year}
              month={month}
              holidays={filteredHolidays}
              readOnly
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
            />
          )}
        </div>

        <div className="card">
          <h2 className="card-title">Upcoming holidays</h2>
          {loading ? (
            <p className="empty-state">Loading…</p>
          ) : upcoming.length === 0 ? (
            <p className="empty-state">No upcoming holidays for this filter.</p>
          ) : (
            <ul className="holiday-list holiday-list--detailed">
              {upcoming.map((holiday) => (
                <li key={holiday.id} className={`holiday-list-item holiday-list-item--${holidayDisplayClass(holiday)}`}>
                  <div className="holiday-list-body">
                    <div className="holiday-list-head">
                      <strong>{holiday.name}</strong>
                      <span className="holiday-type-badge">
                        {holiday.region || (holiday.source === 'national' ? 'Public' : 'Company')}
                      </span>
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

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h2 className="card-title">All holidays — {year}</h2>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : filteredHolidays.length === 0 ? (
          <p className="empty-state">No holidays for this filter in {year}.</p>
        ) : (
          <ul className="holiday-list holiday-list--detailed holiday-list--year">
            {filteredHolidays.map((holiday) => (
              <li key={holiday.id} className={`holiday-list-item holiday-list-item--${holidayDisplayClass(holiday)}`}>
                <div className="holiday-list-body">
                  <div className="holiday-list-head">
                    <strong>{holiday.name}</strong>
                    <span className="holiday-type-badge">
                      {holiday.region || (holiday.source === 'national' ? 'Public holiday' : 'Company holiday')}
                    </span>
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
