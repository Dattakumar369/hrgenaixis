import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { payslipDocId, resolveEmployeePayrollInfo } from '../utils/employeeHelpers';
import { DEFAULT_SALARY, PAYROLL_DEFAULTS, computePayslipBreakdown } from '../utils/payrollCalculator';

function mapFirestoreError(error) {
  const message = error?.message || '';
  if (message.includes('permission-denied')) {
    return 'Firestore blocked this action. Publish updated firestore.rules in Firebase Console.';
  }
  return message || 'Payslip operation failed.';
}

function resolveGrossMonthly(employee) {
  const salary = employee.salary || {};
  if (salary.grossMonthly) return Number(salary.grossMonthly);
  const legacy =
    (Number(salary.basicSalary) || 0) +
    (Number(salary.hra) || 0) +
    (Number(salary.specialAllowance) || 0) +
    (Number(salary.conveyance) || 0) +
    (Number(salary.otherEarnings) || 0);
  return legacy;
}

export async function updateSalaryStructure(employeeId, salaryData) {
  const salary = {
    ...DEFAULT_SALARY,
    ...salaryData,
    grossMonthly: Number(salaryData.grossMonthly) || 0,
    pfRate: PAYROLL_DEFAULTS.pfRate,
    professionalTax: PAYROLL_DEFAULTS.professionalTax,
    employeeCode: String(salaryData.employeeCode || '').trim(),
    uan: String(salaryData.uan || '').trim(),
    bankName: String(salaryData.bankName || '').trim(),
    bankAccount: String(salaryData.bankAccount || '').trim(),
  };

  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      salary,
      salaryUpdatedAt: serverTimestamp(),
    });
    return salary;
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function generatePayslip(employee, options, hrEmail) {
  const {
    month,
    year,
    paidDays,
    totalDays = 30,
    payPeriodStart = '',
    payPeriodEnd = '',
    lopDays = 0,
  } = options;

  const grossMonthly = resolveGrossMonthly(employee);
  if (grossMonthly <= 0) {
    throw new Error('Set monthly gross salary before generating a payslip.');
  }
  if (!paidDays || paidDays <= 0) {
    throw new Error('Enter paid days for this payslip.');
  }

  const payrollInfo = resolveEmployeePayrollInfo(employee);
  const salary = { ...DEFAULT_SALARY, ...(employee.salary || {}), ...payrollInfo, grossMonthly };

  const breakdown = computePayslipBreakdown({
    grossMonthly,
    paidDays,
    totalDays,
    pfRate: salary.pfRate,
    professionalTax: salary.professionalTax,
  });

  const id = payslipDocId(month, year);
  const payload = {
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeCode: payrollInfo.employeeCode,
    email: employee.email,
    department: employee.department || '',
    jobTitle: employee.jobTitle || '',
    startDate: employee.startDate || '',
    uan: payrollInfo.uan,
    month: Number(month),
    year: Number(year),
    paidDays: Number(paidDays),
    totalDays: Number(totalDays),
    lopDays: Number(lopDays) || 0,
    payPeriodStart,
    payPeriodEnd,
    salary: { ...salary, grossMonthly },
    breakdown,
    grossPay: breakdown.grossPayable,
    totalDeductions: breakdown.totalDeductionsPayable,
    netPay: breakdown.netPayable,
    generatedAt: serverTimestamp(),
    generatedBy: hrEmail,
  };

  try {
    await setDoc(doc(db, 'employees', employee.id, 'payslips', id), payload, { merge: true });
    return { id, ...payload };
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function getEmployeePayslips(employeeId) {
  try {
    const snapshot = await getDocs(collection(db, 'employees', employeeId, 'payslips'));
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.year - a.year || b.month - a.month);
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}

export async function getPayslip(employeeId, payslipId) {
  try {
    const snap = await getDoc(doc(db, 'employees', employeeId, 'payslips', payslipId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    throw new Error(mapFirestoreError(error));
  }
}
