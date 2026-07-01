import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Directory from "./pages/Directory";
import OpportunityDetail from "./pages/OpportunityDetail";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import TrackerPage from "./pages/TrackerPage";
import AdminDashboard from "./pages/AdminDashboard";
import OpportunityForm from "./pages/OpportunityForm";
import DigestBuilder from "./pages/DigestBuilder";
import ImpactDashboard from "./pages/ImpactDashboard";

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-16 text-center text-sm text-[#7A7A7A]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App min-h-screen bg-[#F7F2EA]">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/opportunities" element={<Directory />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
            <Route path="/tracker" element={<Protected><TrackerPage /></Protected>} />
            <Route path="/admin" element={<Protected admin><AdminDashboard /></Protected>} />
            <Route path="/admin/opportunities/new" element={<Protected admin><OpportunityForm /></Protected>} />
            <Route path="/admin/opportunities/:id/edit" element={<Protected admin><OpportunityForm /></Protected>} />
            <Route path="/admin/digest" element={<Protected admin><DigestBuilder /></Protected>} />
            <Route path="/admin/impact" element={<Protected admin><ImpactDashboard /></Protected>} />
          </Routes>
          <Toaster position="bottom-right" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
