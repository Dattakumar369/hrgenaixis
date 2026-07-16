import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY, formatInr, computePayslipBreakdown } from '../utils/payrollCalculator';
import { formatMonthYear } from '../utils/employeeHelpers';

const M = { left: 14, right: 14, top: 10 };
const ADDR_RIGHT_MARGIN = 8;
const ROW_H_MM = 6.5;
const HEADER_LOGO_SIZE = 38;
const LOGO_IMAGE_TOP_TRIM = 9.5;
const WATERMARK_W = 155;
const WATERMARK_H = 98;

function ensureBreakdown(payslip, employee) {
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

function formatDoj(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).trim().split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [year, month, day] = parts;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${String(day).padStart(2, '0')}-${months[monthIndex]}-${year}`;
}

function formatDisplayName(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
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

function estimateTableHeight(bodyRowCount) {
  return (bodyRowCount + 1) * ROW_H_MM + 4;
}

/** Faint full-logo watermark centered behind the salary table */
function drawTableWatermark(doc, logoDataUrl, tableTopY, tableHeightMm) {
  if (!logoDataUrl) return;

  const pw = doc.internal.pageSize.getWidth();
  const logoW = WATERMARK_W;
  const logoH = WATERMARK_H;
  const centerY = tableTopY + tableHeightMm / 2;
  const x = pw / 2 - logoW / 2;
  const y = centerY - logoH / 2;

  try {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.11 }));
    doc.addImage(logoDataUrl, 'JPEG', x, y, logoW, logoH);
    doc.restoreGraphicsState();
  } catch {
    // GState unsupported — skip watermark
  }
}

/** Company address — right column */
function drawCompanyAddress(doc, firstBaselineY) {
  const pw = doc.internal.pageSize.getWidth();
  const blockRight = pw - ADDR_RIGHT_MARGIN;
  const blockLeft = pw / 2 + 32;
  const blockW = blockRight - blockLeft;
  const cx = blockLeft + blockW / 2;

  let ry = firstBaselineY;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY.name, cx, ry, { align: 'center', maxWidth: blockW });
  ry += 4;

  doc.setFont('helvetica', 'normal');
  COMPANY.address.forEach((line) => {
    doc.text(line, cx, ry, { align: 'center', maxWidth: blockW });
    ry += 3.5;
  });

  doc.text(`Contact : ${COMPANY.phone}`, cx, ry, { align: 'center', maxWidth: blockW });
  ry += 3.5;
  doc.text(COMPANY.website, cx, ry, { align: 'center', maxWidth: blockW });

  return ry + 5;
}

/** Logo top-left | Title center (underlined) | Company address top-right */
function drawTopHeader(doc, logo, monthLabel) {
  const pw = doc.internal.pageSize.getWidth();
  const addrFirstLineY = M.top + 1;
  const textCapOffset = 2.8;
  const logoY = Math.max(2, addrFirstLineY - textCapOffset - LOGO_IMAGE_TOP_TRIM);

  if (logo) {
    doc.addImage(logo, 'JPEG', M.left, logoY, HEADER_LOGO_SIZE, HEADER_LOGO_SIZE);
  }

  const title = `Salary Slip \u2013 ${monthLabel}`;
  const titleY = addrFirstLineY + 18.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(title, pw / 2, titleY, { align: 'center' });
  const titleW = doc.getTextWidth(title);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(pw / 2 - titleW / 2, titleY + 1.2, pw / 2 + titleW / 2, titleY + 1.2);

  const ry = drawCompanyAddress(doc, addrFirstLineY);

  return Math.max(logoY + HEADER_LOGO_SIZE + 2, ry);
}

function drawEmployeeBlock(doc, startY, rows) {
  const pw = doc.internal.pageSize.getWidth();
  const labelX = M.left;
  const valueX = pw * 0.62;
  let y = startY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Employee Details', labelX, y);
  doc.text('Information', valueX, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  rows.forEach(([label, value]) => {
    doc.text(label, labelX, y);
    doc.text(String(value), valueX, y);
    y += 4.5;
  });

  return y + 3;
}

export async function downloadPayslipPdf(payslip, employee = {}) {
  const b = ensureBreakdown(payslip, employee);
  const salary = payslip.salary || employee?.salary || {};
  const monthLabel = formatMonthYear(payslip.month, payslip.year);
  const rawName = payslip.employeeName || `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim();
  const name = formatDisplayName(rawName);
  const d = b.deductions;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logo = await loadLogoDataUrl();

  let y = drawTopHeader(doc, logo, monthLabel);

  y = drawEmployeeBlock(doc, y, [
    ['Employee Name', name],
    ['Employee ID', salary.employeeCode || payslip.employeeCode || employee?.employeeCode || '—'],
    ['Designation', payslip.jobTitle || employee?.jobTitle || '—'],
    ['DOJ', formatDoj(payslip.startDate || employee?.startDate)],
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
    [d.professionalTax.label, formatInr(d.professionalTax.monthly), formatInr(d.professionalTax.payable)],
    ['Total Deductions (B+C)', formatInr(b.totalDeductionsMonthly), formatInr(b.totalDeductionsPayable)],
    ['Net Salary Payable : A - (B+C)', formatInr(b.netMonthly), formatInr(b.netPayable)],
  ];

  const tableTopY = y;
  const tableHeight = estimateTableHeight(tableBody.length);
  drawTableWatermark(doc, logo, tableTopY, tableHeight);

  const boldRows = new Set([3, 7, 8]);
  const deductionsHeaderRow = 4;

  autoTable(doc, {
    startY: tableTopY,
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
      fontSize: 10,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      overflow: 'linebreak',
      fillColor: false,
    },
    headStyles: {
      fillColor: false,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
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
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "**System generated Payslip, doesn't require stamp and signature",
    pw / 2,
    doc.lastAutoTable.finalY + 8,
    { align: 'center' }
  );

  const filename = `payslip-${(rawName || 'employee').replace(/\s+/g, '-')}-${payslip.year}-${String(payslip.month).padStart(2, '0')}.pdf`;
  doc.save(filename);
}

export function previewPayslipHtml() {
  return '';
}
