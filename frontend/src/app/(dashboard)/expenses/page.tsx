"use client";
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api";
import { formatINR, MONTH_NAMES, SHORT_MONTH_NAMES, CATEGORY_COLORS } from "@/lib/utils";
import type { MonthlyExpense, CategoryExpense } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartFormatter = (v: any) => [`₹${Number(v).toFixed(2)}`];
const tooltipStyle = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: 10, fontSize: 12 };

export default function ExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthly, setMonthly] = useState<MonthlyExpense[]>([]);
  const [categories, setCategories] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [m, c] = await Promise.all([
          dashboardApi.getMonthlyExpenses(year),
          dashboardApi.getCategoryExpenses(month, year),
        ]);
        setMonthly(m.data.months);
        setCategories(c.data.categories);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [year, month]);

  const currentMonthData = monthly[month - 1];
  const prevMonthData = month > 1 ? monthly[month - 2] : null;
  const yearTotal = monthly.reduce((s, m) => s + m.totalPaise, 0);

  const barData = monthly.map((m, i) => ({
    name: SHORT_MONTH_NAMES[i],
    Paid: +(m.paidPaise / 100).toFixed(2),
    Unpaid: +(m.unpaidPaise / 100).toFixed(2),
  }));

  const pieData = categories.slice(0, 9).map(c => ({
    name: c._id || "Other",
    value: +(c.totalPaise / 100).toFixed(2),
    color: CATEGORY_COLORS[c._id] || "#6b7280",
  }));

  const yearRange = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const pctChange = prevMonthData && prevMonthData.totalPaise > 0
    ? (((currentMonthData?.totalPaise || 0) - prevMonthData.totalPaise) / prevMonthData.totalPaise) * 100
    : null;

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="text-xl font-extrabold text-black flex items-center gap-2 uppercase tracking-tight">
            <BarChart3 size={20} />Expense Analytics
          </h1>
          <p className="text-gray-600 font-mono font-bold text-xs mt-0.5 uppercase">Monthly spending overview</p>
        </div>
        <div className="flex gap-2">
          <select className="form-select text-xs py-1 w-auto" value={month} onChange={e => setMonth(parseInt(e.target.value))} id="month-select">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select text-xs py-1 w-auto" value={year} onChange={e => setYear(parseInt(e.target.value))} id="year-select">
            {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? Array.from({length:4}).map((_,i) => <div key={i} className="skeleton h-24 rounded-2xl" />) : (
          <>
            <div className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{MONTH_NAMES[month-1]} Total</p>
              <p className="text-xl font-bold text-white">{formatINR(currentMonthData?.totalPaise || 0)}</p>
              {pctChange !== null && (
                <p className={`text-xs flex items-center gap-1 mt-1 ${pctChange > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {pctChange > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(pctChange).toFixed(1)}% vs last month
                </p>
              )}
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-400 mb-1">Paid</p>
              <p className="text-xl font-bold text-emerald-400">{formatINR(currentMonthData?.paidPaise || 0)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-400 mb-1">Unpaid</p>
              <p className="text-xl font-bold text-red-400">{formatINR(currentMonthData?.unpaidPaise || 0)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-slate-400 mb-1">{year} Total</p>
              <p className="text-xl font-bold text-white">{formatINR(yearTotal)}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-sm font-bold text-white mb-4">Monthly Trend ({year})</h2>
          {loading ? <div className="skeleton h-52 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={2}>
                <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={chartFormatter} />
                <Bar dataKey="Paid" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="Unpaid" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-bold text-white mb-4">Category Breakdown — {MONTH_NAMES[month-1]}</h2>
          {loading ? <div className="skeleton h-52 w-full" /> : pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={chartFormatter} />
                <Legend iconSize={10} iconType="circle" formatter={v => <span style={{color:"#94a3b8",fontSize:11}}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state h-48 text-sm">No spending data for this month</div>}
        </div>
      </div>

      {!loading && categories.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-white mb-4">Category Details — {MONTH_NAMES[month-1]} {year}</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Category</th><th>Transactions</th><th>Amount</th><th>Share</th></tr></thead>
              <tbody>
                {categories.map(c => {
                  const share = (currentMonthData?.totalPaise || 0) > 0
                    ? ((c.totalPaise / (currentMonthData?.totalPaise || 1)) * 100)
                    : 0;
                  return (
                    <tr key={c._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{background: CATEGORY_COLORS[c._id] || "#6b7280"}} />
                          <span className="text-slate-300">{c._id || "Other"}</span>
                        </div>
                      </td>
                      <td className="text-slate-400">{c.count}</td>
                      <td className="text-emerald-400 font-medium">{formatINR(c.totalPaise)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-emerald-500" style={{width:`${Math.min(share,100)}%`}} />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">{share.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
