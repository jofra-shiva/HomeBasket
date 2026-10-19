"use client";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { formatINR, SHORT_MONTH_NAMES, CATEGORY_COLORS } from "@/lib/utils";
import type { DashboardSummary, MonthlyExpense, CategoryExpense } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import {
  TrendingUp, ShoppingCart, AlertCircle, Clock,
  Receipt, CheckCircle2, RefreshCw, Plus, ArrowUpRight, Package
} from "lucide-react";

/* ── Brutalism Stat Card ─────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="stat-card" style={{ borderLeft: `6px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{
          width: 32, height: 32, background: accent,
          border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "2px 2px 0 #000", color: "#fff", flexShrink: 0
        }}>{icon}</div>
      </div>
      <p style={{ fontSize: "1.375rem", fontWeight: 800, color: "#000", marginBottom: "0.15rem", letterSpacing: "-0.03em", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#606060", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Space Mono', monospace" }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: "0.625rem", color: "#808080", marginTop: "0.2rem", fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ height: 80, width: "100%" }} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartFormatter = (v: any) => [`₹${Number(v).toFixed(2)}`, ""];

/* Brutalism Chart Tooltip */
const tooltipStyle = {
  background: "#fff",
  border: "3px solid #000",
  borderRadius: 0,
  fontSize: 11,
  fontFamily: "'Space Mono', monospace",
  boxShadow: "4px 4px 0 #000",
  padding: "6px 10px",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyExpense[]>([]);
  const [categories, setCategories] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, m, c] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getMonthlyExpenses(),
        dashboardApi.getCategoryExpenses(),
      ]);
      setSummary(s.data.summary);
      setMonthly(m.data.months);
      setCategories(c.data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = monthly.map((m) => ({
    name: SHORT_MONTH_NAMES[m.month - 1],
    Spent: parseFloat((m.totalPaise / 100).toFixed(2)),
    Paid: parseFloat((m.paidPaise / 100).toFixed(2)),
  }));

  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const greeting = now.getHours() < 12 ? "MORNING" : now.getHours() < 17 ? "AFTERNOON" : "EVENING";

  return (
    <div>
      {/* ── TOP GREETING & REFRESH ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "3px solid #000",
        flexWrap: "wrap", gap: "0.5rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#000", letterSpacing: "-0.03em", textTransform: "uppercase" }}>
            GOOD {greeting}, {user?.fullName.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: "0.68rem", color: "#606060", marginTop: "0.2rem", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            HOUSEHOLD OVERVIEW • {monthName.toUpperCase()}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: "0.35rem 0.65rem", fontSize: "0.6875rem" }}
          id="refresh-dashboard"
          title="Refresh Dashboard"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          REFRESH
        </button>
      </div>

      {/* ── ACTION CHIPS (BRUTALIST) ── */}
      <div className="action-chips-scroll">
        <Link
          href="/shopping"
          className="action-chip action-chip-primary"
        >
          <ShoppingCart size={13} />
          <span>+ SHOPPING LIST</span>
        </Link>
        <Link
          href="/products"
          className="action-chip action-chip-secondary"
        >
          <Plus size={13} />
          <span>ADD PRODUCT</span>
        </Link>
        <Link
          href="/history"
          className="action-chip action-chip-secondary"
        >
          <Receipt size={13} />
          <span>VIEW BILLS</span>
        </Link>
      </div>

      {/* ── 2x2 BRUTALIST STAT CARDS GRID ── */}
      <div className="stat-grid-2x2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : summary ? (
          <>
            <StatCard
              label={`${monthName} Spent`}
              value={formatINR(summary.monthSpendingPaise)}
              icon={<TrendingUp size={16} />}
              accent="#00b300"
              sub={`${formatINR(summary.monthPaidPaise)} paid`}
            />
            <StatCard
              label="Shopping Trips"
              value={String(summary.totalShoppingTrips)}
              icon={<ShoppingCart size={16} />}
              accent="#4361ee"
              sub="Completed trips"
            />
            <StatCard
              label="Unpaid Bills"
              value={formatINR(summary.unpaidBillsPaise)}
              icon={<AlertCircle size={16} />}
              accent="#e63946"
              sub={`${summary.unpaidBillsCount} pending`}
            />
            <StatCard
              label="Pending Lists"
              value={String(summary.pendingLists)}
              icon={<Clock size={16} />}
              accent="#f7b731"
              sub="Active lists"
            />
          </>
        ) : null}
      </div>

      {/* ── TODAY'S SHOPPING ── */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "3px solid #000"
        }}>
          <h2 style={{
            fontSize: "0.72rem", fontWeight: 800, color: "#000",
            textTransform: "uppercase", letterSpacing: "0.08em",
            fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: "0.35rem"
          }}>
            <ShoppingCart size={13} /> TODAY&apos;S SHOPPING
          </h2>
          <Link href="/shopping" style={{ fontSize: "0.68rem", fontWeight: 800, color: "#000", textDecoration: "underline", fontFamily: "'Space Mono', monospace" }}>
            MANAGE ↗
          </Link>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 80, width: "100%" }} />
        ) : summary?.todayItems && summary.todayItems.length > 0 ? (
          <div>
            {summary.todayItems.slice(0, 5).map((item, i) => (
              <div
                key={i}
                className="brute-list-item"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <div
                    style={{
                      width: 10, height: 10, border: "2px solid #000",
                      background: item.status === "purchased" ? "#00b300" : item.status === "skipped" ? "#909090" : "#f7b731",
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#000" }}>{item.productName}</span>
                </div>
                <span style={{ fontSize: "0.6875rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <CheckCircle2 size={24} style={{ marginBottom: "0.5rem" }} />
            <p>NO SHOPPING TODAY</p>
          </div>
        )}
      </div>

      {/* ── MONTHLY EXPENSES BAR CHART ── */}
      <div className="card" style={{ padding: "1rem" }}>
        <h2 style={{
          fontSize: "0.72rem", fontWeight: 800, color: "#000", marginBottom: "0.875rem",
          textTransform: "uppercase", letterSpacing: "0.08em",
          fontFamily: "'Space Mono', monospace", paddingBottom: "0.5rem", borderBottom: "3px solid #000"
        }}>
          ▪ MONTHLY EXPENSES {now.getFullYear()}
        </h2>

        {loading ? (
          <div className="skeleton" style={{ height: 160, width: "100%" }} />
        ) : chartData.some((d) => d.Spent > 0) ? (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} barGap={3}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#000", fontSize: 9, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}
                axisLine={{ stroke: "#000", strokeWidth: 2 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#606060", fontSize: 9, fontFamily: "'Space Mono', monospace" }}
                axisLine={{ stroke: "#000", strokeWidth: 2 }}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
                width={36}
              />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#000", fontWeight: 800 }} formatter={chartFormatter} />
              <Bar dataKey="Spent" fill="#000000" radius={0} />
              <Bar dataKey="Paid" fill="#606060" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <Package size={28} style={{ marginBottom: "0.5rem" }} />
            <p>NO DATA YET</p>
          </div>
        )}
      </div>

      {/* ── RECENT PURCHASES ── */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "3px solid #000"
        }}>
          <h2 style={{
            fontSize: "0.72rem", fontWeight: 800, color: "#000",
            textTransform: "uppercase", letterSpacing: "0.08em",
            fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: "0.35rem"
          }}>
            <Receipt size={13} /> RECENT PURCHASES
          </h2>
          <Link href="/history" style={{ fontSize: "0.68rem", fontWeight: 800, color: "#000", textDecoration: "underline", fontFamily: "'Space Mono', monospace" }}>
            ALL ↗
          </Link>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 80, width: "100%" }} />
        ) : summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
          <div>
            {summary.recentTransactions.slice(0, 4).map((txn) => (
              <div
                key={txn._id}
                className="brute-list-item"
              >
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#000" }}>{txn.storeName || "STORE"}</p>
                  <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace" }}>
                    {new Date(txn.purchaseDate).toLocaleDateString("en-IN")} • {txn.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#000" }}>
                    {formatINR(txn.finalBillAmountPaise)}
                  </p>
                  <span
                    className={`badge ${txn.paymentStatus === "Paid" ? "badge-emerald" : "badge-red"}`}
                  >
                    {txn.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Receipt size={24} style={{ marginBottom: "0.5rem" }} />
            <p>NO PURCHASES YET</p>
          </div>
        )}
      </div>
    </div>
  );
}
