"use client";
import { useEffect, useState, useCallback } from "react";
import { transactionsApi } from "@/lib/api";
import { formatINR, formatDate, rupeesToPaise, paiseToRupees } from "@/lib/utils";
import type { Transaction, PaymentMethod } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Receipt, Search, Filter, Trash2, Edit2, ChevronDown, ChevronUp, X } from "lucide-react";

const PAYMENT_METHODS: PaymentMethod[] = ["Cash","UPI","Debit Card","Credit Card","Other"];

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ paymentMethod: "Cash" as PaymentMethod, paymentStatus: "Paid" as "Paid"|"Unpaid", storeName: "", notes: "", finalBillRupees: "" });
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ paymentStatus: "", paymentMethod: "", from: "", to: "" });
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await transactionsApi.getAll(params);
      setTransactions(res.data.transactions);
    } catch { toast("Failed to load history", "error"); }
    finally { setLoading(false); }
  }, [filters, toast]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (txn: Transaction) => {
    setEditTxn(txn);
    setEditForm({ paymentMethod: txn.paymentMethod, paymentStatus: txn.paymentStatus, storeName: txn.storeName, notes: txn.notes, finalBillRupees: paiseToRupees(txn.finalBillAmountPaise).toFixed(2) });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTxn) return;
    setSubmitting(true);
    try {
      await transactionsApi.update(editTxn._id, {
        paymentMethod: editForm.paymentMethod,
        paymentStatus: editForm.paymentStatus,
        storeName: editForm.storeName,
        notes: editForm.notes,
        finalBillAmountPaise: rupeesToPaise(parseFloat(editForm.finalBillRupees)||0),
        purchaseDate: editTxn.purchaseDate.split("T")[0],
      });
      toast("Transaction updated!", "success");
      setEditTxn(null);
      load();
    } catch { toast("Failed to update", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (txn: Transaction) => {
    try {
      await transactionsApi.delete(txn._id);
      toast("Transaction deleted", "success");
      setDeleteConfirm(null);
      load();
    } catch { toast("Failed to delete", "error"); }
  };

  const totalSpent = transactions.reduce((s, t) => s + t.finalBillAmountPaise, 0);
  const totalUnpaid = transactions.filter(t => t.paymentStatus === "Unpaid").reduce((s, t) => s + t.finalBillAmountPaise, 0);

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="text-xl font-extrabold text-black flex items-center gap-2 uppercase tracking-tight"><Receipt size={20} />Purchase History</h1>
          <p className="text-gray-600 font-mono font-bold text-xs mt-0.5 uppercase">{transactions.length} transactions · {formatINR(totalSpent)} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={14} className="text-black" />
          <span className="text-xs font-mono font-bold uppercase text-black">Filter Purchases</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className="form-select text-xs py-1.5" value={filters.paymentStatus} onChange={e => setFilters(p => ({...p, paymentStatus: e.target.value}))}>
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <select className="form-select text-xs py-1.5" value={filters.paymentMethod} onChange={e => setFilters(p => ({...p, paymentMethod: e.target.value}))}>
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="date" className="form-input text-xs py-1.5" value={filters.from} onChange={e => setFilters(p => ({...p, from: e.target.value}))} placeholder="From date" />
          <input type="date" className="form-input text-xs py-1.5" value={filters.to} onChange={e => setFilters(p => ({...p, to: e.target.value}))} placeholder="To date" />
        </div>
        {(filters.paymentStatus || filters.paymentMethod || filters.from || filters.to) && (
          <button className="btn-secondary text-xs mt-2 py-1" onClick={() => setFilters({ paymentStatus:"", paymentMethod:"", from:"", to:"" })}>
            <X size={12} />Clear Filters
          </button>
        )}
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="stat-card" style={{ borderLeft: "6px solid #000" }}>
            <p className="text-gray-600 font-mono font-bold text-xs mb-1 uppercase">Total Spent</p>
            <p className="text-lg font-extrabold text-black">{formatINR(totalSpent)}</p>
          </div>
          <div className="stat-card" style={{ borderLeft: "6px solid #e63946" }}>
            <p className="text-gray-600 font-mono font-bold text-xs mb-1 uppercase">Unpaid Balance</p>
            <p className="text-lg font-extrabold text-red-600">{formatINR(totalUnpaid)}</p>
          </div>
        </div>
      )}

      {/* Transactions */}
      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <Receipt size={48} className="mb-2 text-black" />
          <h3 className="text-base font-extrabold text-black uppercase mb-1">No transactions found</h3>
          <p className="text-gray-600 font-mono text-xs font-bold uppercase">Complete a checkout to see purchase history here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(txn => (
            <div key={txn._id} className="card p-3 animate-fade-in mb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-black text-sm uppercase">{txn.storeName || "Shopping Trip"}</h3>
                    <span className={`badge ${txn.paymentStatus === "Paid" ? "badge-emerald" : "badge-red"}`}>{txn.paymentStatus}</span>
                    <span className="badge badge-amber text-xs">{txn.paymentMethod}</span>
                  </div>
                  <p className="text-xs font-mono text-gray-600 mt-0.5 font-bold">{formatDate(txn.purchaseDate)} · {txn.purchasedItems.length} items</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-extrabold text-black text-sm">{formatINR(txn.finalBillAmountPaise)}</p>
                    {txn.discountPaise > 0 && <p className="text-xs font-mono text-emerald-700 font-bold">-{formatINR(txn.discountPaise)}</p>}
                  </div>
                  <button className="btn-secondary text-xs py-1 px-1.5" onClick={() => setExpanded(expanded === txn._id ? null : txn._id)}>
                    {expanded === txn._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button className="btn-secondary text-xs py-1 px-1.5" onClick={() => openEdit(txn)} id={`edit-txn-${txn._id}`}><Edit2 size={13} /></button>
                  <button className="btn-danger text-xs py-1 px-1.5" onClick={() => setDeleteConfirm(txn)} id={`del-txn-${txn._id}`}><Trash2 size={13} /></button>
                </div>
              </div>
              {expanded === txn._id && (
                <div className="border-t border-slate-800/60 px-4 py-3">
                  <table className="data-table">
                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                    <tbody>
                      {txn.purchasedItems.map((item) => (
                        <tr key={item._id}>
                          <td className="text-slate-300">{item.productName}</td>
                          <td className="text-slate-400">{item.quantity} {item.unit}</td>
                          <td className="text-emerald-400 font-medium">{formatINR(item.pricePaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {txn.notes && <p className="text-xs text-slate-500 mt-2 italic">{txn.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editTxn && (
        <div className="dialog-overlay" onClick={() => setEditTxn(null)}>
          <div className="dialog-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Edit Transaction</h2>
              <button onClick={() => setEditTxn(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Final Bill (₹)</label>
                <input type="number" className="form-input" min="0" step="0.50" value={editForm.finalBillRupees} onChange={e => setEditForm(p => ({...p, finalBillRupees: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={editForm.paymentMethod} onChange={e => setEditForm(p => ({...p, paymentMethod: e.target.value as PaymentMethod}))}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select className="form-select" value={editForm.paymentStatus} onChange={e => setEditForm(p => ({...p, paymentStatus: e.target.value as "Paid"|"Unpaid"}))}>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input type="text" className="form-input" value={editForm.storeName} onChange={e => setEditForm(p => ({...p, storeName: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input resize-none h-16" value={editForm.notes} onChange={e => setEditForm(p => ({...p, notes: e.target.value}))} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setEditTxn(null)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? <><span className="spinner" />Saving...</> : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Transaction?</h3>
              <p className="text-slate-400 text-sm mb-2">Amount: <strong className="text-white">{formatINR(deleteConfirm.finalBillAmountPaise)}</strong></p>
              <p className="text-slate-400 text-sm mb-6">Date: <strong className="text-white">{formatDate(deleteConfirm.purchaseDate)}</strong></p>
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-danger flex-1" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

