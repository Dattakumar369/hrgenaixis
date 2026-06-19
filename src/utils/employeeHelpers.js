import { STATUS, EMPLOYMENT_STATUS } from '../services/employeeService';
import { PAYROLL_DEFAULTS } from './payrollCalculator';

export function employmentStatusOf(emp) {
  if (emp.employmentStatus) return emp.employmentStatus;
  if (emp.status === STATUS.APPROVED) return EMPLOYMENT_STATUS.ACTIVE;
  return null;
}

export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

export function formatMonthYear(month, year) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function payslipDocId(month, year) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Identity and bank details from onboarding (employee root), with salary fallback */
export function resolveEmployeePayrollInfo(employee) {
  const salary = employee?.salary || {};
  const legacyGross =
    (Number(salary.basicSalary) || 0) +
    (Number(salary.hra) || 0) +
    (Number(salary.specialAllowance) || 0) +
    (Number(salary.conveyance) || 0) +
    (Number(salary.otherEarnings) || 0);

  let grossMonthly = Number(salary.grossMonthly) || 0;
  if (!grossMonthly && legacyGross) grossMonthly = legacyGross;

  return {
    employeeCode: String(employee?.employeeCode || salary.employeeCode || '').trim(),
    uan: String(employee?.uan || salary.uan || '').trim(),
    bankName: String(employee?.bankName || salary.bankName || '').trim(),
    bankAccount: String(employee?.bankAccount || salary.bankAccount || '').trim(),
    grossMonthly,
    pfRate: PAYROLL_DEFAULTS.pfRate,
    professionalTax: PAYROLL_DEFAULTS.professionalTax,
  };
}
