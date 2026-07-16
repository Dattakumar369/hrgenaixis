/** Company-wide payroll settings and generic formulas */

export const COMPANY = {
  name: 'GENAIXIS Labs Pvt Ltd',
  address: [
    'Ground Floor, Krishe Emerald, Kondapur,',
    'Laxmi Cyber City, Whitefields, HITEC City,',
    'Hyderabad,Telangana 500081',
  ],
  phone: '+8466932302',
  website: 'www.genaixis.com',
};

/** PF is 12% of basic capped at ₹15,000; professional tax is a fixed deduction */
export const PAYROLL_DEFAULTS = {
  pfRate: 0.12,
  pfBasicCap: 15000,
  professionalTax: 200,
};

export function proRate(monthlyAmount, paidDays, totalDays) {
  const paid = Number(paidDays) || 0;
  const total = Number(totalDays) || 30;
  if (total <= 0) return 0;
  return Math.round((Number(monthlyAmount) || 0) * paid / total);
}

export function formatInr(amount) {
  return Number(amount || 0).toLocaleString('en-IN');
}

/**
 * Total gross (CTC component) includes employer PF.
 * Salary gross = total gross − employer PF, then basic/HRA/special are split from salary gross.
 */
export function deriveSalaryGrossFromTotal(
  totalGross,
  pfRate = PAYROLL_DEFAULTS.pfRate,
  pfBasicCap = PAYROLL_DEFAULTS.pfBasicCap,
) {
  const total = Math.round(Number(totalGross) || 0);
  if (total <= 0) {
    return { totalGrossMonthly: 0, salaryGrossMonthly: 0, employerPfMonthly: 0 };
  }

  let salaryGross = total;
  for (let i = 0; i < 6; i += 1) {
    const basic = Math.round(salaryGross * 0.5);
    const employerPf = Math.round(Math.min(basic, pfBasicCap) * pfRate);
    const next = total - employerPf;
    if (next === salaryGross) break;
    salaryGross = next;
  }

  const basic = Math.round(salaryGross * 0.5);
  const employerPfMonthly = Math.round(Math.min(basic, pfBasicCap) * pfRate);

  return {
    totalGrossMonthly: total,
    salaryGrossMonthly: total - employerPfMonthly,
    employerPfMonthly,
  };
}

/**
 * Payroll formulas:
 * Total gross → minus employer PF → salary gross
 * Basic = salary gross × 50%
 * HRA = Basic × 50%
 * Special = salary gross − Basic − HRA
 * EmployeePF monthly = MIN(Basic, 15000) × 12%
 * EmployeePF payable = monthly PF × (PaidDays / TotalDays)
 * NetSalary = GrossPayable − EmployeePF − ProfessionalTax
 * (Employer PF is excluded from employee payslip and net deductions.)
 */
export function computePayslipBreakdown({
  grossMonthly,
  paidDays,
  totalDays,
  pfRate = PAYROLL_DEFAULTS.pfRate,
  pfBasicCap = PAYROLL_DEFAULTS.pfBasicCap,
  professionalTax = PAYROLL_DEFAULTS.professionalTax,
}) {
  const rate = Number(pfRate) || 0;
  const pfCap = Number(pfBasicCap) || PAYROLL_DEFAULTS.pfBasicCap;
  const pt = Math.round(Number(professionalTax) || 0);
  const paid = Number(paidDays) || 0;
  const total = Number(totalDays) || 30;

  const { totalGrossMonthly, salaryGrossMonthly, employerPfMonthly } = deriveSalaryGrossFromTotal(
    grossMonthly,
    rate,
    pfCap,
  );

  const basic = Math.round(salaryGrossMonthly * 0.5);
  const hra = Math.round(basic * 0.5);
  const specialAllowance = salaryGrossMonthly - basic - hra;

  const payableBasic = proRate(basic, paid, total);
  const payableHra = proRate(hra, paid, total);
  const payableSpecial = proRate(specialAllowance, paid, total);

  const grossPayable = payableBasic + payableHra + payableSpecial;

  const pfWageMonthly = Math.min(basic, pfCap);
  const employeePfMonthly = Math.round(pfWageMonthly * rate);
  const employeePfPayable = proRate(employeePfMonthly, paid, total);
  const employerPfPayable = proRate(employerPfMonthly, paid, total);

  const earnings = {
    basic: { label: 'Basic Salary', monthly: basic, payable: payableBasic },
    hra: { label: 'House Rent Allowance (HRA)', monthly: hra, payable: payableHra },
    specialAllowance: {
      label: 'Special Allowance',
      monthly: specialAllowance,
      payable: payableSpecial,
    },
  };

  const employeePF = {
    label: 'Employee PF (B)',
    monthly: employeePfMonthly,
    payable: employeePfPayable,
  };
  const professionalTaxRow = {
    label: 'Professional Tax (C)',
    monthly: pt,
    payable: pt,
  };

  const totalDeductionsMonthly = employeePfMonthly + pt;
  const totalDeductionsPayable = employeePfPayable + pt;

  const netMonthly = salaryGrossMonthly - totalDeductionsMonthly;
  const netPayable = grossPayable - totalDeductionsPayable;

  return {
    totalGrossMonthly,
    grossMonthly: salaryGrossMonthly,
    grossPayable,
    paidDays: paid,
    totalDays: total,
    pfRate: rate,
    professionalTax: pt,
    employerPfMonthly,
    employerPfPayable,
    earnings,
    deductions: { employeePF, professionalTax: professionalTaxRow },
    totalDeductionsMonthly,
    totalDeductionsPayable,
    netMonthly,
    netPayable,
  };
}

export const DEFAULT_SALARY = {
  grossMonthly: 0,
  pfRate: PAYROLL_DEFAULTS.pfRate,
  professionalTax: PAYROLL_DEFAULTS.professionalTax,
  employeeCode: '',
  uan: '',
  bankName: '',
  bankAccount: '',
};
