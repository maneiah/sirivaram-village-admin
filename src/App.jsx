import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminPanelLayoutTest from "./layouts/AdminLayout";
import Users from "./pages/Users/Users";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import AdminBlogs from "./pages/Blogs/AdminBlogs";
import AdminGallery from "./pages/Gallery/AdminGallery";
import AdminReportSummary from "./pages/Reports/AdminReports";
import AdminEvents from "./pages/Events/AdminEvents";
import FooterSettings from "./pages/Footer/FooterSettings";
import AdminPayments from "./pages/AdminPayments/AdminPayments";
import ChitFundDashboard from "./pages/ChitFund/ChitFundDashboard";
import ChitFundLogin from "./pages/ChitFund/ChitFundLogin";
import ChitFundAdminLayout from "./pages/ChitFund/ChitFundAdminLayout";

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* CHIT FUND ROUTES - SEPARATE ADMIN SYSTEM */}
          <Route path="/chitadmin" element={<ChitFundLogin />} />
          <Route path="/chitdashboard" element={<ChitFundAdminLayout><ChitFundDashboard /></ChitFundAdminLayout>} />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* MAIN ADMIN ROUTES */}
          <Route element={<AdminPanelLayoutTest />}>
            {/* choose one */}
            <Route index element={<Navigate to="/login" replace />} />
            {/* or: <Route index element={<Navigate to="/login" replace />} /> */}

            <Route path="reports" element={<AdminReportSummary />} />
            <Route path="users" element={<Users />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="footer" element={<FooterSettings />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
