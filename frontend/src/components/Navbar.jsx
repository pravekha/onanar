import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const linkCls = ({ isActive }) =>
  `text-sm font-medium tracking-wide transition-colors ${isActive ? "text-flame" : "text-ink hover:text-flame"}`;

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
          <NavLink data-testid="nav-tracker" to="/tracker" className={linkCls} onClick={() => setOpen(false)}>Tracker</NavLink>
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
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink/60 hidden sm:inline">{user.name}</span>
      <button data-testid="logout-button" onClick={handleLogout}
        className="text-sm bg-ink text-butter px-5 py-2 rounded-full hover:bg-flame hover:text-white transition-all">
        Log out
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link data-testid="nav-login" to="/login" onClick={() => setOpen(false)}
        className="text-sm text-ink px-4 py-2 rounded-full hover:bg-lilac transition-colors">Log in</Link>
      <Link data-testid="nav-signup" to="/signup" onClick={() => setOpen(false)}
        className="text-sm bg-flame text-white px-5 py-2 rounded-full hover:bg-ink transition-all">Sign up</Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-lilac/40 shadow-[0_1px_0_rgba(35,0,63,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        <Link data-testid="nav-logo" to="/" className="flex items-baseline gap-3 group">
          <span className="font-display text-4xl leading-none text-ink group-hover:text-flame transition-colors">Onanar</span>
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.3em] text-ink/50 font-medium">Opportunity Desk</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">{links}</nav>
        <div className="hidden lg:block">{authBtns}</div>
        <button data-testid="mobile-menu-button" className="lg:hidden text-ink" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-lilac/40 px-6 py-5 flex flex-col gap-4 bg-paper">
          {links}
          <div className="pt-2 border-t border-lilac/40">{authBtns}</div>
        </div>
      )}
    </header>
  );
}
