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
      login(data.token, data.user);
      toast.success(isLogin ? "Welcome back" : "Account created");
      navigate(data.user.role === "admin" ? "/admin" : isLogin ? "/opportunities" : "/profile");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-white rounded-full px-5 py-3 text-sm border border-lilac/40 focus:border-ink focus:outline-none placeholder:text-ink/40";
  const label = "text-[10px] uppercase tracking-[0.25em] text-ink/60 font-semibold block mb-1.5 ml-4";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 bg-paper">
      <div className="grid grid-cols-12 gap-4 md:gap-5">
        {/* Copy tile */}
        <div className="col-span-12 lg:col-span-5 order-2 lg:order-1 bg-ink text-butter rounded-3xl p-10 bento flex flex-col justify-between min-h-[500px]">
          <div>
            <p className="section-num mb-4">{isLogin ? "00 / Welcome" : "00 / Join"}</p>
            <h1 className="font-display text-5xl md:text-6xl text-butter leading-[0.95]">
              {isLogin ? <>Welcome<br />back to the <span className="marker-lilac">desk</span>.</> : <>Start your<br /><span className="marker-lilac">opportunity</span> desk.</>}
            </h1>
          </div>
          <div className="space-y-2 text-sm text-lilac">
            <p>· Match scores across every listing</p>
            <p>· Track applications from interest to accepted</p>
            <p>· Weekly digests to your inbox</p>
          </div>
        </div>

        {/* Form tile */}
        <div className="col-span-12 lg:col-span-7 order-1 lg:order-2 bg-white rounded-3xl p-8 md:p-10 bento">
          <h2 className="font-display text-3xl text-ink mb-2">{isLogin ? "Log in" : "Create your account"}</h2>
          <p className="text-sm text-ink/60 mb-8">{isLogin ? "Enter your credentials to continue." : "One profile, unlimited discovery."}</p>
          <form onSubmit={submit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className={label}>Name</label>
                <input data-testid="auth-name-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Your full name" />
              </div>
            )}
            <div>
              <label className={label}>Email</label>
              <input data-testid="auth-email-input" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="you@example.com" />
            </div>
            <div>
              <label className={label}>Password</label>
              <input data-testid="auth-password-input" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} placeholder="••••••••" />
            </div>
            {error && <p data-testid="auth-error" className="text-sm text-flame font-medium">{error}</p>}
            <button data-testid="auth-submit-button" disabled={busy} type="submit"
              className="w-full bg-flame text-white py-3.5 rounded-full text-sm font-semibold hover:bg-ink hover:text-butter transition-all disabled:opacity-60">
              {busy ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
            </button>
          </form>
          <p className="mt-6 text-sm text-ink/60">
            {isLogin ? "New to Onanar? " : "Already have an account? "}
            <Link data-testid="auth-switch-link" to={isLogin ? "/signup" : "/login"} className="text-flame font-semibold hover:underline">
              {isLogin ? "Create an account" : "Log in"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
