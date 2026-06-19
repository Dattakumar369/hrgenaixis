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
 * Payroll formulas:
 * Basic = Gross × 50%
 * HRA = Basic × 50%
 * Special = Gross − Basic − HRA
 * PayableX = (X × PaidDays) / TotalDays
 * EmployeePF = MIN(PayableBasic, 15000) × 12%
 * EmployerPF = MIN(PayableBasic, 15000) × 12%
 * NetSalary = GrossPayable − EmployeePF − EmployerPF − ProfessionalTax
 */
export function computePayslipBreakdown({
  grossMonthly,
  paidDays,
  totalDays,
  pfRate = PAYROLL_DEFAULTS.pfRate,
  pfBasicCap = PAYROLL_DEFAULTS.pfBasicCap,
  professionalTax = PAYROLL_DEFAULTS.professionalTax,
}) {
  const gross = Math.round(Number(grossMonthly) || 0);
  const paid = Number(paidDays) || 0;
  const total = Number(totalDays) || 30;
  const rate = Number(pfRate) || 0;
  const pfCap = Number(pfBasicCap) || PAYROLL_DEFAULTS.pfBasicCap;
  const pt = Math.round(Number(professionalTax) || 0);

  const basic = Math.round(gross * 0.5);
  const hra = Math.round(basic * 0.5);
  const specialAllowance = gross - basic - hra;

  const payableBasic = proRate(basic, paid, total);
  const payableHra = proRate(hra, paid, total);
  const payableSpecial = proRate(specialAllowance, paid, total);

  const grossPayable = payableBasic + payableHra + payableSpecial;

  const pfWageMonthly = Math.min(basic, pfCap);
  const pfWagePayable = Math.min(payableBasic, pfCap);
  const employeePfMonthly = Math.round(pfWageMonthly * rate);
  const employerPfMonthly = Math.round(pfWageMonthly * rate);
  const employeePfPayable = Math.round(pfWagePayable * rate);
  const employerPfPayable = Math.round(pfWagePayable * rate);

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
  const employerPF = {
    label: 'Employer PF (C)',
    monthly: employerPfMonthly,
    payable: employerPfPayable,
  };
  const professionalTaxRow = {
    label: 'Professional Tax (D)',
    monthly: pt,
    payable: pt,
  };

  const totalDeductionsMonthly = employeePfMonthly + employerPfMonthly + pt;
  const totalDeductionsPayable = employeePfPayable + employerPfPayable + pt;

  const netMonthly = gross - totalDeductionsMonthly;
  const netPayable = grossPayable - totalDeductionsPayable;

  return {
    grossMonthly: gross,
    grossPayable,
    paidDays: paid,
    totalDays: total,
    pfRate: rate,
    professionalTax: pt,
    earnings,
    deductions: { employeePF, employerPF, professionalTax: professionalTaxRow },
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
