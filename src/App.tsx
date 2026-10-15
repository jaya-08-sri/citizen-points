import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ledger from "./pages/Ledger";
import ReportIssue from "./pages/ReportIssue";
import MyReports from "./pages/MyReports";
import EarnPoints from "./pages/EarnPoints";
import Rewards from "./pages/Rewards";
import Help from "./pages/Help";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/earn" element={<EarnPoints />} />
        <Route path="/help" element={<Help />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/rewards" element={<Rewards />} />
        </Route>

        <Route element={<RequireAuth role="verifier" />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
