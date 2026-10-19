"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: "", general: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = "Min 2 characters";
    if (!form.username.trim() || form.username.trim().length < 3) e.username = "Min 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "Letters, numbers, underscores only";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password || form.password.length < 6) e.password = "Min 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast("Account created! Welcome.", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = apiErr?.response?.data?.message || "Registration failed";
      toast(msg, "error");
      if (apiErr?.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        Object.entries(apiErr.response.data.errors).forEach(([k, v]) => { apiErrors[k] = (v as string[])[0]; });
        setErrors(apiErrors);
      } else {
        setErrors({ general: msg });
      }
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

      <div className="lc-heading">
        <h2 className="lc-title">Create Account</h2>
        <p className="lc-sub">Start managing your household</p>
      </div>

      {errors.general && <div className="lc-err">⚠ {errors.general}</div>}

      <form onSubmit={handleSubmit} className="lc-form">
        <div className="lc-field">
          <label className="lc-label" htmlFor="reg-fullname">Full Name</label>
          <input id="reg-fullname" type="text" className={`lc-input${errors.fullName ? " lc-input-err" : ""}`}
            placeholder="Your full name" value={form.fullName} onChange={set("fullName")} disabled={loading} />
          {errors.fullName && <span className="lc-ferr">↑ {errors.fullName}</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <div className="lc-field">
            <label className="lc-label" htmlFor="reg-username">Username</label>
            <input id="reg-username" type="text" className={`lc-input${errors.username ? " lc-input-err" : ""}`}
              placeholder="username" value={form.username} onChange={set("username")} disabled={loading} />
            {errors.username && <span className="lc-ferr">↑ {errors.username}</span>}
          </div>
          <div className="lc-field">
            <label className="lc-label" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className={`lc-input${errors.email ? " lc-input-err" : ""}`}
              placeholder="you@email.com" value={form.email} onChange={set("email")} disabled={loading} />
            {errors.email && <span className="lc-ferr">↑ {errors.email}</span>}
          </div>
        </div>

        <div className="lc-field">
          <label className="lc-label" htmlFor="reg-password">Password</label>
          <div className="lc-input-wrap">
            <input id="reg-password" type={showPass ? "text" : "password"}
              className={`lc-input${errors.password ? " lc-input-err" : ""}`}
              placeholder="Min 6 characters" value={form.password} onChange={set("password")} disabled={loading} />
            <button type="button" className="lc-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <span className="lc-ferr">↑ {errors.password}</span>}
        </div>

        <div className="lc-field">
          <label className="lc-label" htmlFor="reg-confirm">Confirm Password</label>
          <div className="lc-input-wrap">
            <input id="reg-confirm" type={showConfirm ? "text" : "password"}
              className={`lc-input${errors.confirmPassword ? " lc-input-err" : ""}`}
              placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} disabled={loading} />
            <button type="button" className="lc-eye" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && <span className="lc-ferr">↑ {errors.confirmPassword}</span>}
        </div>

        <button type="submit" className="lc-btn" disabled={loading} id="reg-submit">
          {loading
            ? <><span className="spinner" />Creating…</>
            : <><span>Create Account</span><ArrowRight size={15} /></>
          }
        </button>
      </form>

      <p className="lc-foot">
        Have an account?{" "}
        <Link href="/login" className="lc-link" id="reg-login-link">Sign in</Link>
      </p>
    </div>
  );
}
