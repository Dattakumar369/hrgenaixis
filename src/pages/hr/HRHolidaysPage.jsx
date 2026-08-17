import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createHoliday,
  filterCompanyHolidayRecords,
  loadHolidayCalendar,
  removeHolidayFromCalendar,
  tryGetCustomHolidays,
  updateHoliday,
  HOLIDAY_TYPES,
  HOLIDAY_TYPE_LABELS,
  formatHolidayDate,
} from '../../services/holidayService';
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
import { toUserMessage, USER_MESSAGES } from '../../utils/userMessages';

const EMPTY_FORM = {
  name: '',
  date: '',
  type: HOLIDAY_TYPES.COMPANY,
  description: '',
};

function isCompanyHoliday(holiday) {
  return holiday && holiday.source === 'company';
}

function startAddForm(date = '') {
  return { ...EMPTY_FORM, date };
}

function startEditForm(holiday) {
  return {
    name: holiday.name || '',
    date: holiday.date || '',
    type: holiday.type || HOLIDAY_TYPES.COMPANY,
    description: holiday.description || '',
  };
}

export default function HRHolidaysPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendarHolidays, setCalendarHolidays] = useState([]);
  const [customHolidays, setCustomHolidays] = useState([]);
  const [companySyncFailed, setCompanySyncFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [stateFilter, setStateFilter] = useState(STATE_FILTERS.ALL);

  const years = buildYearOptions(now);
  const stateCounts = countHolidaysByState(year);
  const filteredCalendarHolidays = filterHolidaysByState(calendarHolidays, stateFilter);
  const companyHolidays = filterCompanyHolidayRecords(customHolidays);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { holidays: calendar, companySyncFailed: syncFailed } = await loadHolidayCalendar(year);
      const { holidays: custom } = await tryGetCustomHolidays(year);
      setCalendarHolidays(calendar);
      setCustomHolidays(custom);
      setCompanySyncFailed(syncFailed);
    } catch (err) {
      setError(toUserMessage(err, 'Could not load holidays. Please try again.'));
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

  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate('');
  }

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    clearMessages();
  }

  function openAddForm(date = '') {
    clearMessages();
    setEditingId(null);
    setSelectedDate(date);
    setForm(startAddForm(date));
    document.getElementById('holiday-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openEditForm(holiday) {
    if (!isCompanyHoliday(holiday)) return;
    clearMessages();
    setEditingId(holiday.id);
    setSelectedDate(holiday.date);
    setForm(startEditForm(holiday));
    document.getElementById('holiday-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSelectDate(dateKey, _primary, dayHolidays = []) {
    setSelectedDate(dateKey);
    clearMessages();
    const companyHoliday = dayHolidays.find(isCompanyHoliday);
    if (companyHoliday) {
      openEditForm(companyHoliday);
    } else {
      openAddForm(dateKey);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    clearMessages();
    try {
      if (editingId) {
        await updateHoliday(editingId, form);
        setSuccess('Holiday updated.');
      } else {
        await createHoliday(form, user.email);
        setSuccess('Holiday added.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(toUserMessage(err, USER_MESSAGES.holidaySaveFailed));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(holiday) {
    const label = holiday?.name || 'this holiday';
    const isPublic = holiday?.source === 'national' || holiday?.readOnly;
    const ok = window.confirm(
      isPublic
        ? `Remove "${label}" from the calendar? It will be hidden for all employees.`
        : `Delete "${label}" permanently?`,
    );
    if (!ok) return;
    setSaving(true);
    clearMessages();
    try {
      await removeHolidayFromCalendar(holiday, user.email);
      if (editingId === holiday.id) resetForm();
      setSuccess(isPublic ? 'Holiday removed from calendar.' : 'Holiday deleted.');
      await load();
    } catch (err) {
      setError(toUserMessage(err, USER_MESSAGES.deleteFailed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="portal-page portal-page--wide">
      <PageHeader
        title="Holiday calendar"
        subtitle="Add, edit, or delete holidays. Built-in Telangana & Andhra Pradesh public holidays can also be removed from the calendar."
        actions={(
          <button type="button" className="btn btn-primary" onClick={() => openAddForm()} disabled={saving}>
            + Add holiday
          </button>
        )}
      />

      <div className="holiday-year-bar">
        <label htmlFor="holidayYear">Year</label>
        <select
          id="holidayYear"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[...years, year + 1].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => b - a).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="field-hint">
          {stateCounts.total} public · {stateCounts.telangana} TS · {stateCounts.andhraPradesh} AP · {companyHolidays.length} company
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
          Could not sync with the server. Add, edit, and delete may fail until you publish the latest Firestore rules in Firebase Console.
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card holiday-manage-card" id="holiday-form-section">
        <div className="card-title-row">
          <h2 className="card-title">{editingId ? 'Edit holiday' : 'Add holiday'}</h2>
          {editingId && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm} disabled={saving}>
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="holiday-form holiday-form--inline">
          <div className="form-group">
            <label htmlFor="holidayName">Holiday name *</label>
            <input
              id="holidayName"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Company foundation day"
              required
              disabled={saving}
            />
          </div>
          <div className="form-group">
            <label htmlFor="holidayDate">Date *</label>
            <input
              id="holidayDate"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
              disabled={saving}
            />
          </div>
          <div className="form-group">
            <label htmlFor="holidayType">Type</label>
            <select
              id="holidayType"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              disabled={saving}
            >
              {Object.values(HOLIDAY_TYPES).map((type) => (
                <option key={type} value={type}>{HOLIDAY_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <div className="form-group holiday-form-note">
            <label htmlFor="holidayDesc">Note (optional)</label>
            <input
              id="holidayDesc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Details visible to all employees"
              disabled={saving}
            />
          </div>
          <div className="holiday-form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : '+ Add holiday'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete({ id: editingId, name: form.name, source: 'company' })}
                disabled={saving}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-title-row">
          <h2 className="card-title">Company holidays — {year}</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openAddForm()} disabled={saving}>
            + Add
          </button>
        </div>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : companyHolidays.length === 0 ? (
          <p className="empty-state">No company holidays yet. Use the form above to add one.</p>
        ) : (
          <div className="holiday-table-wrap">
            <table className="holiday-table holiday-table--actions">
              <thead>
                <tr>
                  <th>Holiday</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="holiday-table-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companyHolidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td>
                      <strong>{holiday.name}</strong>
                      {holiday.description && (
                        <span className="holiday-table-note">{holiday.description}</span>
                      )}
                    </td>
                    <td>{formatHolidayDate(holiday.date)}</td>
                    <td>{HOLIDAY_TYPE_LABELS[holiday.type] || 'Company holiday'}</td>
                    <td className="holiday-table-actions-col">
                      <div className="holiday-table-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditForm({ ...holiday, source: 'company' })}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete({ ...holiday, source: 'company' })}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        {loading ? (
          <p className="empty-state">Loading calendar…</p>
        ) : (
          <>
            <p className="field-hint holiday-calendar-hint">
              Click a date to add a holiday. Use Edit or Delete in the table below for any holiday.
            </p>
            <HolidayCalendar
              year={year}
              month={month}
              holidays={filteredCalendarHolidays}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
              onToday={goToday}
            />
          </>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">All holidays — {year}</h2>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : filteredCalendarHolidays.length === 0 ? (
          <p className="empty-state">No holidays for this filter in {year}.</p>
        ) : (
          <div className="holiday-table-wrap">
            <table className="holiday-table holiday-table--actions">
              <thead>
                <tr>
                  <th>Holiday</th>
                  <th>Date</th>
                  <th>Region / type</th>
                  <th className="holiday-table-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalendarHolidays.map((holiday) => (
                  <tr key={holiday.id} className={`holiday-table-row--${holidayDisplayClass(holiday)}`}>
                    <td>
                      <strong>{holiday.name}</strong>
                      {holiday.description && (
                        <span className="holiday-table-note">{holiday.description}</span>
                      )}
                    </td>
                    <td>{formatHolidayDate(holiday.date)}</td>
                    <td>
                      {isCompanyHoliday(holiday)
                        ? (HOLIDAY_TYPE_LABELS[holiday.type] || 'Company')
                        : (holiday.region || 'Public')}
                    </td>
                    <td className="holiday-table-actions-col">
                      <div className="holiday-table-actions">
                        {isCompanyHoliday(holiday) && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditForm(holiday)}
                            disabled={saving}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(holiday)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
