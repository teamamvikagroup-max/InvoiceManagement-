import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import CreateDocumentPage from "./pages/CreateDocumentPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import OtpLoginPage from "./pages/OtpLoginPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
      <Route path="/otp-login" element={<PublicOnlyRoute><OtpLoginPage /></PublicOnlyRoute>} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="invoice/create" element={<CreateDocumentPage type="invoice" />} />
        <Route path="quotation/create" element={<CreateDocumentPage type="quotation" />} />
        <Route path="invoices" element={<HistoryPage type="invoice" />} />
        <Route path="quotations" element={<HistoryPage type="quotation" />} />
        <Route path="company-profile" element={<CompanyProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}