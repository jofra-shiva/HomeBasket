"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!identifier.trim()) e.identifier = "Required";
    if (!password) e.password = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      toast("Welcome back!", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid credentials";
      toast(msg, "error");
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lc animate-fade-in">
      <div className="lc-bar" />

      {/* Brand */}
      <div className="lc-brand">
        <div className="lc-logo">🧺</div>
        <div>
          <h1 className="lc-name">HomeBasket</h1>
          <p className="lc-tagline">Expense Tracker</p>
        </div>
      </div>

      <div className="lc-sep" />

      {/* Heading */}
      <div className="lc-heading">
        <h2 className="lc-title">Sign In</h2>
        <p className="lc-sub">Enter your credentials to continue</p>
      </div>

      {/* Error */}
      {errors.general && <div className="lc-err">⚠ {errors.general}</div>}

      {/* Form */}
      <form onSubmit={handleSubmit} className="lc-form">
        <div className="lc-field">
          <label className="lc-label" htmlFor="login-identifier">Username or Email</label>
          <input
            id="login-identifier"
            type="text"
            className={`lc-input${errors.identifier ? " lc-input-err" : ""}`}
            placeholder="you@example.com"
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setErrors(p => ({ ...p, identifier: "" })); }}
            disabled={loading}
            autoComplete="username"
          />
          {errors.identifier && <span className="lc-ferr">↑ {errors.identifier}</span>}
        </div>

        <div className="lc-field">
          <div className="lc-label-row">
            <label className="lc-label" htmlFor="login-password">Password</label>
            <a href="#" className="lc-forgot">Forgot?</a>
          </div>
          <div className="lc-input-wrap">
            <input
              id="login-password"
              type={showPass ? "text" : "password"}
              className={`lc-input${errors.password ? " lc-input-err" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
              disabled={loading}
              autoComplete="current-password"
            />
            <button type="button" className="lc-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <span className="lc-ferr">↑ {errors.password}</span>}
        </div>

        <button type="submit" className="lc-btn" disabled={loading} id="login-submit">
          {loading
            ? <><span className="spinner" />Signing in…</>
            : <><span>Sign In</span><ArrowRight size={15} /></>
          }
        </button>
      </form>

      <p className="lc-foot">
        No account?{" "}
        <Link href="/register" className="lc-link" id="login-register-link">Create one</Link>
      </p>
    </div>
  );
}
