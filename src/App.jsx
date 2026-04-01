import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import CreateDocumentPage from "./pages/CreateDocumentPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="invoice/create" element={<CreateDocumentPage type="invoice" />} />
        <Route path="quotation/create" element={<CreateDocumentPage type="quotation" />} />
        <Route path="invoices" element={<HistoryPage type="invoice" />} />
        <Route path="quotations" element={<HistoryPage type="quotation" />} />
        <Route path="company-profile" element={<CompanyProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
