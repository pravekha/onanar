import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const linkCls = ({ isActive }) =>
  `text-sm tracking-wide transition-colors ${isActive ? "text-[#D94A2B]" : "text-[#1F1F1F] hover:text-[#D94A2B]"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); setOpen(false); navigate("/"); };

  const links = (
    <>
      <NavLink data-testid="nav-opportunities" to="/opportunities" className={linkCls} onClick={() => setOpen(false)}>Opportunities</NavLink>
      {user && user.role !== "admin" && (
        <>
          <NavLink data-testid="nav-tracker" to="/tracker" className={linkCls} onClick={() => setOpen(false)}>My Tracker</NavLink>
          <NavLink data-testid="nav-profile" to="/profile" className={linkCls} onClick={() => setOpen(false)}>Profile</NavLink>
        </>
      )}
      {user?.role === "admin" && (
        <>
          <NavLink data-testid="nav-admin" to="/admin" className={linkCls} onClick={() => setOpen(false)}>Dashboard</NavLink>
          <NavLink data-testid="nav-digest" to="/admin/digest" className={linkCls} onClick={() => setOpen(false)}>Digest</NavLink>
          <NavLink data-testid="nav-impact" to="/admin/impact" className={linkCls} onClick={() => setOpen(false)}>Impact</NavLink>
        </>
      )}
    </>
  );

  const authBtns = user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-[#7A7A7A] hidden sm:inline">{user.name}</span>
      <button data-testid="logout-button" onClick={handleLogout}
        className="text-sm border border-[#1F1F1F] px-4 py-1.5 rounded-sm hover:bg-[#1F1F1F] hover:text-white transition-colors">
        Log out
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Link data-testid="nav-login" to="/login" onClick={() => setOpen(false)}
        className="text-sm border border-[#1F1F1F] px-4 py-1.5 rounded-sm hover:bg-[#1F1F1F] hover:text-white transition-colors">Log in</Link>
      <Link data-testid="nav-signup" to="/signup" onClick={() => setOpen(false)}
        className="text-sm bg-[#D94A2B] text-white px-4 py-1.5 rounded-sm hover:bg-[#B83D21] transition-colors">Sign up</Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-[#F7F2EA]/95 backdrop-blur-sm border-b border-[#D8CFC2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        <Link data-testid="nav-logo" to="/" className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold tracking-tight text-[#1F1F1F]">Onanar</span>
          <span className="hidden md:inline text-xs uppercase tracking-widest text-[#7A7A7A]">India's Opportunity Desk</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">{links}</nav>
        <div className="hidden lg:block">{authBtns}</div>
        <button data-testid="mobile-menu-button" className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-[#D8CFC2] px-6 py-4 flex flex-col gap-4 bg-[#F7F2EA]">
          {links}
          {authBtns}
        </div>
      )}
    </header>
  );
}
