"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  title?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", title?: string, duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, title, duration }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

const TOAST_THEMES: Record<
  ToastType,
  {
    accent: string;
    bgLight: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    defaultTitle: string;
    icon: (size?: number) => React.ReactNode;
    progressGradient: string;
  }
> = {
  success: {
    accent: "#10b981",
    bgLight: "#f0fdf4",
    border: "#86efac",
    badgeBg: "#dcfce7",
    badgeText: "#15803d",
    defaultTitle: "SUCCESS",
    icon: (s = 16) => <CheckCircle2 size={s} color="#15803d" strokeWidth={2.5} />,
    progressGradient: "linear-gradient(90deg, #10b981, #059669)",
  },
  error: {
    accent: "#ef4444",
    bgLight: "#fef2f2",
    border: "#fca5a5",
    badgeBg: "#fee2e2",
    badgeText: "#b91c1c",
    defaultTitle: "ERROR",
    icon: (s = 16) => <AlertCircle size={s} color="#b91c1c" strokeWidth={2.5} />,
    progressGradient: "linear-gradient(90deg, #ef4444, #dc2626)",
  },
  warning: {
    accent: "#f59e0b",
    bgLight: "#fffbeb",
    border: "#fde68a",
    badgeBg: "#fef3c7",
    badgeText: "#b45309",
    defaultTitle: "WARNING",
    icon: (s = 16) => <AlertTriangle size={s} color="#b45309" strokeWidth={2.5} />,
    progressGradient: "linear-gradient(90deg, #f59e0b, #d97706)",
  },
  info: {
    accent: "#3b82f6",
    bgLight: "#eff6ff",
    border: "#bfdbfe",
    badgeBg: "#dbeafe",
    badgeText: "#1d4ed8",
    defaultTitle: "NOTICE",
    icon: (s = 16) => <Info size={s} color="#1d4ed8" strokeWidth={2.5} />,
    progressGradient: "linear-gradient(90deg, #3b82f6, #2563eb)",
  },
};

function ToastCard({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = item.duration || 4000;
  const theme = TOAST_THEMES[item.type] || TOAST_THEMES.info;

  useEffect(() => {
    if (isPaused) return;
    const intervalTime = 20;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onRemove(item.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, duration, onRemove, item.id]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="toast-slide-in"
      style={{
        position: "relative",
        background: "#ffffff",
        border: "2.5px solid #000000",
        boxShadow: "5px 5px 0px #000000",
        borderRadius: "4px",
        overflow: "hidden",
        cursor: "default",
        userSelect: "none",
        transition: "transform 0.15s ease",
      }}
    >
      {/* Toast Content Header & Body */}
      <div style={{ padding: "0.85rem 1rem", borderLeft: `6px solid ${theme.accent}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
          {/* Badge & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                background: theme.badgeBg,
                border: "1.5px solid #000",
                boxShadow: "1px 1px 0 #000",
                flexShrink: 0,
              }}
            >
              {theme.icon(14)}
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 900,
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#000000",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {item.title || theme.defaultTitle}
            </span>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            title="Dismiss"
            style={{
              background: "#ffffff",
              border: "1.5px solid #000",
              boxShadow: "1px 1px 0 #000",
              color: "#000000",
              cursor: "pointer",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#000000";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#000000";
            }}
          >
            <X size={12} strokeWidth={3} />
          </button>
        </div>

        {/* Toast Message */}
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: "#1e293b",
            fontFamily: "'Space Grotesk', sans-serif",
            lineHeight: 1.45,
            margin: 0,
            paddingLeft: "0.1rem",
            wordBreak: "break-word",
          }}
        >
          {item.message}
        </p>
      </div>

      {/* Countdown Progress Track */}
      <div
        style={{
          width: "100%",
          height: "4px",
          background: "#e2e8f0",
          borderTop: "1px solid #000",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, progress)}%`,
            height: "100%",
            background: theme.progressGradient,
            transition: "width 0.05s linear",
          }}
        />
      </div>
    </div>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        right: "1.25rem",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxWidth: "380px",
        width: "calc(100% - 2.5rem)",
        pointerEvents: "auto",
      }}
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onRemove={removeToast} />
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
