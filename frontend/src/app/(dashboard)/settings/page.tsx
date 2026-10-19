"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { User, Mail, AtSign, Calendar, LogOut, Shield } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast("Logged out successfully", "success");
      router.push("/login");
    } catch { toast("Logout failed", "error"); }
    finally { setLoggingOut(false); }
  };

  if (!user) return null;

  return (
    <div>
      <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#000", letterSpacing: "-0.03em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "3px solid #000" }}>
        <User size={20} /> PROFILE & SETTINGS
      </h1>

      <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "2px solid #000" }}>
          <div style={{ width: "54px", height: "54px", background: "#000", color: "#fff", border: "3px solid #000", boxShadow: "3px 3px 0 #606060", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>
            {user.fullName[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#000", textTransform: "uppercase" }}>{user.fullName}</h2>
            <p style={{ fontSize: "0.75rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>@{user.username}</p>
            <span className="badge badge-emerald" style={{ marginTop: "0.25rem" }}>ACTIVE ACCOUNT</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="brute-list-item" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <User size={16} />
              <div>
                <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, textTransform: "uppercase" }}>Full Name</p>
                <p style={{ fontSize: "0.8125rem", color: "#000", fontWeight: 800 }}>{user.fullName}</p>
              </div>
            </div>
          </div>

          <div className="brute-list-item" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <AtSign size={16} />
              <div>
                <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, textTransform: "uppercase" }}>Username</p>
                <p style={{ fontSize: "0.8125rem", color: "#000", fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>@{user.username}</p>
              </div>
            </div>
          </div>

          <div className="brute-list-item" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Mail size={16} />
              <div>
                <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, textTransform: "uppercase" }}>Email Address</p>
                <p style={{ fontSize: "0.8125rem", color: "#000", fontWeight: 800 }}>{user.email}</p>
              </div>
            </div>
          </div>

          <div className="brute-list-item" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Calendar size={16} />
              <div>
                <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, textTransform: "uppercase" }}>Member Since</p>
                <p style={{ fontSize: "0.8125rem", color: "#000", fontWeight: 800 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "2024"}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-danger"
          style={{ width: "100%", marginTop: "1.25rem", padding: "0.75rem", fontSize: "0.75rem", letterSpacing: "0.04em" }}
          id="settings-logout-btn"
        >
          <LogOut size={16} />
          {loggingOut ? "SIGNING OUT..." : "SIGN OUT FROM HOMEBASKET"}
        </button>
      </div>
    </div>
  );
}
