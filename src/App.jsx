import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HRLayout from './layouts/HRLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import HRDashboardHome from './pages/hr/HRDashboardHome';
import HREmployeesPage from './pages/hr/HREmployeesPage';
import HROnboardingPage from './pages/hr/HROnboardingPage';
import HRPayrollPage from './pages/hr/HRPayrollPage';
import EmployeeOnboardingPage from './pages/employee/EmployeeOnboardingPage';
import EmployeePayslipsPage from './pages/employee/EmployeePayslipsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute role="hr" />}>
            <Route path="/hr" element={<HRLayout />}>
              <Route index element={<HRDashboardHome />} />
              <Route path="employees" element={<HREmployeesPage />} />
              <Route path="onboarding" element={<HROnboardingPage />} />
              <Route path="payroll" element={<HRPayrollPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="employee" />}>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route index element={<EmployeeOnboardingPage />} />
              <Route path="payslips" element={<EmployeePayslipsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
