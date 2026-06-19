import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, formatInr, computePayslipBreakdown } from '../utils/payrollCalculator';
import { formatMonthYear } from '../utils/employeeHelpers';

const M = { left: 14, right: 14, top: 10 };
const LINK_BLUE = [37, 99, 235];

function ensureBreakdown(payslip, employee) {
  if (payslip.breakdown) return payslip.breakdown;
  const salary = payslip.salary || employee?.salary || {};
  const gross = salary.grossMonthly || payslip.grossPay || 0;
  return computePayslipBreakdown({
    grossMonthly: gross,
    paidDays: payslip.paidDays || 30,
    totalDays: payslip.totalDays || 30,
    pfRate: salary.pfRate ?? payslip.pfRate,
    professionalTax: salary.professionalTax ?? payslip.professionalTax,
  });
}

function maskAccount(account) {
  const s = String(account || '').replace(/\s/g, '');
  if (!s) return '—';
  if (s.length <= 4) return s;
  return `${'X'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

async function loadLogoDataUrl() {
  try {
    const resp = await fetch('/genaixislogo.jpeg');
    const blob = await resp.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawWatermark(doc, logoDataUrl) {
  if (!logoDataUrl) return;
  try {
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.07 }));
    doc.addImage(logoDataUrl, 'JPEG', pw / 2 - 35, ph / 2 - 25, 70, 70);
    doc.restoreGraphicsState();
  } catch {
    // GState unsupported — skip watermark
  }
}

/** Logo left | Title center (underlined) | Company right */
function drawTopHeader(doc, logo, monthLabel) {
  const pw = doc.internal.pageSize.getWidth();
  const rightX = pw - M.right;
  const y0 = M.top;

  if (logo) {
    doc.addImage(logo, 'JPEG', M.left, y0, 20, 20);
  }

  const title = `Salary Slip – ${monthLabel}`;
  const titleY = y0 + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pw / 2, titleY, { align: 'center' });
  const titleW = doc.getTextWidth(title);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(pw / 2 - titleW / 2, titleY + 1, pw / 2 + titleW / 2, titleY + 1);

  let ry = y0 + 1;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY.name, rightX, ry, { align: 'right' });
  ry += 3.8;
  doc.setFont('helvetica', 'normal');
  COMPANY.address.forEach((line) => {
    doc.text(line, rightX, ry, { align: 'right' });
    ry += 3.4;
  });
  doc.text(`Contact : ${COMPANY.phone}`, rightX, ry, { align: 'right' });
  ry += 3.4;
  doc.setTextColor(...LINK_BLUE);
  doc.text(COMPANY.website, rightX, ry, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  return Math.max(y0 + 24, ry + 5);
}

function drawEmployeeBlock(doc, startY, rows) {
  const pw = doc.internal.pageSize.getWidth();
  const labelX = M.left;
  const valueX = pw / 2 + 2;
  let y = startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Employee Details', labelX, y);
  doc.text('Information', valueX, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  rows.forEach(([label, value]) => {
    doc.text(label, labelX, y);
    doc.text(String(value), valueX, y);
    y += 3.8;
  });

  return y + 3;
}

export async function downloadPayslipPdf(payslip, employee = {}) {
  const b = ensureBreakdown(payslip, employee);
  const salary = payslip.salary || employee?.salary || {};
  const monthLabel = formatMonthYear(payslip.month, payslip.year);
  const name = payslip.employeeName || `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim();
  const d = b.deductions;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logo = await loadLogoDataUrl();

  drawWatermark(doc, logo);

  let y = drawTopHeader(doc, logo, monthLabel);

  y = drawEmployeeBlock(doc, y, [
    ['Employee Name', name],
    ['Employee ID', salary.employeeCode || payslip.employeeCode || employee?.employeeCode || '—'],
    ['Designation', payslip.jobTitle || employee?.jobTitle || '—'],
    ['UAN', salary.uan || payslip.uan || employee?.uan || '—'],
    ['Bank', salary.bankName || employee?.bankName || '—'],
    ['Account No.', maskAccount(salary.bankAccount || employee?.bankAccount)],
    [
      'Pay Period',
      payslip.payPeriodStart && payslip.payPeriodEnd
        ? `${payslip.payPeriodStart} to ${payslip.payPeriodEnd}`
        : '—',
    ],
    ['Total Days in Month', String(b.totalDays ?? payslip.totalDays ?? 30)],
    ['Paid Days', String(b.paidDays ?? payslip.paidDays ?? '—')],
    ['LOP Days', String(payslip.lopDays ?? 0)],
  ]);

  const tableBody = [
    [b.earnings.basic.label, formatInr(b.earnings.basic.monthly), formatInr(b.earnings.basic.payable)],
    [b.earnings.hra.label, formatInr(b.earnings.hra.monthly), formatInr(b.earnings.hra.payable)],
    [b.earnings.specialAllowance.label, formatInr(b.earnings.specialAllowance.monthly), formatInr(b.earnings.specialAllowance.payable)],
    ['Gross Earnings (A)', formatInr(b.grossMonthly), formatInr(b.grossPayable)],
    ['Deductions', '', ''],
    [d.employeePF.label, formatInr(d.employeePF.monthly), formatInr(d.employeePF.payable)],
    [d.employerPF.label, formatInr(d.employerPF.monthly), formatInr(d.employerPF.payable)],
    [d.professionalTax.label, formatInr(d.professionalTax.monthly), formatInr(d.professionalTax.payable)],
    ['Total Deductions (B+C+D)', formatInr(b.totalDeductionsMonthly), formatInr(b.totalDeductionsPayable)],
    ['Net Salary Payable : A - (B+C+D)', formatInr(b.netMonthly), formatInr(b.netPayable)],
  ];

  const boldRows = new Set([3, 8, 9]);
  const deductionsHeaderRow = 4;
  const netRow = 9;

  autoTable(doc, {
    startY: y,
    margin: { left: M.left, right: M.right },
    head: [['Earnings', 'Monthly *', 'Payable (Pro-Rated)']],
    body: tableBody,
    theme: 'grid',
    tableWidth: 'auto',
    pageBreak: 'avoid',
    rowPageBreak: 'avoid',
    showHead: 'firstPage',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 88 },
      1: { halign: 'right', cellWidth: 38 },
      2: { halign: 'right', cellWidth: 42 },
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index > 0) {
        data.cell.styles.halign = 'right';
      }
      if (data.section === 'body') {
        if (boldRows.has(data.row.index)) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === deductionsHeaderRow) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  const pw = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "**System generated Payslip, doesn't require stamp and signature",
    pw / 2,
    doc.lastAutoTable.finalY + 8,
    { align: 'center' }
  );

  const filename = `payslip-${(name || 'employee').replace(/\s+/g, '-')}-${payslip.year}-${String(payslip.month).padStart(2, '0')}.pdf`;
  doc.save(filename);
}

export function previewPayslipHtml() {
  return '';
}
