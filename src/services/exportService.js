import * as XLSX from 'xlsx';
import { EMPLOYMENT_STATUS_LABELS } from './employeeService';

function formatDate(value) {
  if (!value) return '';
  const date = value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function mapEmployeeRow(emp) {
  const docs = emp.documents || {};
  return {
    'First name': emp.firstName || '',
    'Last name': emp.lastName || '',
    Email: emp.email || '',
    Phone: emp.phone || '',
    Department: emp.department || '',
    'Job title': emp.jobTitle || '',
    'Start date': emp.startDate || '',
    'Onboarding status': emp.status || '',
    'Employment status': EMPLOYMENT_STATUS_LABELS[emp.employmentStatus] || (emp.status === 'approved' ? 'Active' : '—'),
    'Aadhar number': docs.aadhar?.number || '',
    'PAN number': docs.pan?.number || '',
    Address: emp.address || '',
    City: emp.city || '',
    State: emp.state || '',
    ZIP: emp.zipCode || '',
    'Emergency contact': emp.emergencyContactName || '',
    'Emergency phone': emp.emergencyContactPhone || '',
    'Previous companies': (docs.previousCompanies || []).map((c) => c.companyName).filter(Boolean).join(', '),
    'Invited on': formatDate(emp.createdAt),
    'Submitted on': formatDate(emp.submittedAt),
    'Approved on': formatDate(emp.approvedAt),
  };
}

export function exportEmployeesToExcel(employees, fileLabel = 'employees') {
  const rows = employees.map(mapEmployeeRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  const headers = Object.keys(rows[0] || mapEmployeeRow({}));
  worksheet['!cols'] = headers.map((header) => ({
    wch: Math.max(header.length + 2, 16),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `genaixis-${fileLabel}-${stamp}.xlsx`);
}
