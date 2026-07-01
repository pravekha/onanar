import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(isLogin ? "/auth/login" : "/auth/register",
        isLogin ? { email: form.email, password: form.password } : form);
      login(data.user);
      toast.success(isLogin ? "Welcome back" : "Account created");
      navigate(data.user.role === "admin" ? "/admin" : isLogin ? "/opportunities" : "/profile");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full border border-[#D8CFC2] bg-white rounded-sm px-3 py-2.5 text-sm focus:border-[#1F1F1F]";

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight mb-2">{isLogin ? "Log in" : "Create your account"}</h1>
      <p className="text-sm text-[#7A7A7A] mb-8">{isLogin ? "Welcome back to your opportunity desk." : "Start discovering opportunities matched to your practice."}</p>
      <form onSubmit={submit} className="bg-white border border-[#D8CFC2] rounded-sm p-6 space-y-4">
        {!isLogin && (
          <div>
            <label className="text-xs uppercase tracking-widest text-[#7A7A7A]">Name</label>
            <input data-testid="auth-name-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Your full name" />
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-widest text-[#7A7A7A]">Email</label>
          <input data-testid="auth-email-input" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-[#7A7A7A]">Password</label>
          <input data-testid="auth-password-input" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} placeholder="••••••••" />
        </div>
        {error && <p data-testid="auth-error" className="text-sm text-[#D94A2B]">{error}</p>}
        <button data-testid="auth-submit-button" disabled={busy} type="submit"
          className="w-full bg-[#D94A2B] text-white py-2.5 rounded-sm text-sm font-medium hover:bg-[#B83D21] transition-colors disabled:opacity-60">
          {busy ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[#7A7A7A]">
        {isLogin ? "New to Onanar? " : "Already have an account? "}
        <Link data-testid="auth-switch-link" to={isLogin ? "/signup" : "/login"} className="text-[#D94A2B] hover:underline">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </main>
  );
}
