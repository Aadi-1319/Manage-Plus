import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import VeriLoader from "./contexts/veriLoader";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Supervisors from "@/pages/Supervisors";
import SupervisorProfile from "@/pages/SupervisorProfile";
import Attendance from "@/pages/Attendance";
import AttendanceHistory from "@/pages/AttendanceHistory";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<VeriLoader />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/supervisors" element={<Supervisors />} />
            <Route path="/profile" element={<SupervisorProfile />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/attendance-history" element={<AttendanceHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>

);

export default App;
