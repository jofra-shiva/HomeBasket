"use client";
import { useEffect, useState, useCallback } from "react";
import { productsApi } from "@/lib/api";
import { formatINR, rupeesToPaise, paiseToRupees, PRODUCT_CATEGORIES, CATEGORY_COLORS } from "@/lib/utils";
import type { Product, ProductFormData, ProductCategory } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Plus, Search, Edit2, Trash2, Star, Package, X, Heart, Filter } from "lucide-react";

const UNITS = ["kg", "L", "box", "other"];

const emptyForm: ProductFormData = {
  name: "", category: "Maliga Saman", defaultQuantity: 1, unit: "kg",
  estimatedPricePaise: 0, notes: "", isFavourite: false,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [favFilter, setFavFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [qtyInput, setQtyInput] = useState<string>("1");
  const [priceInput, setPriceInput] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      if (favFilter) params.favourite = "true";
      const res = await productsApi.getAll(params);
      setProducts(res.data.products);
    } catch { toast("Failed to load products", "error"); }
    finally { setLoading(false); }
  }, [search, catFilter, favFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = (prefillName?: string) => {
    setEditing(null);
    const defaultCat = (catFilter && PRODUCT_CATEGORIES.includes(catFilter as ProductCategory))
      ? (catFilter as ProductCategory)
      : "Maliga Saman";
    setForm({
      ...emptyForm,
      name: typeof prefillName === "string" ? prefillName : (search.trim() || ""),
      category: defaultCat,
      defaultQuantity: 1,
      unit: "kg",
      estimatedPricePaise: 0,
    });
    setQtyInput("1");
    setPriceInput("");
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      defaultQuantity: p.defaultQuantity,
      unit: p.unit,
      estimatedPricePaise: p.estimatedPricePaise,
      notes: p.notes,
      isFavourite: p.isFavourite,
    });
    setQtyInput(p.defaultQuantity.toString());
    setPriceInput(p.estimatedPricePaise > 0 ? (p.estimatedPricePaise / 100).toString() : "");
    setFormErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    const q = parseFloat(qtyInput);
    if (isNaN(q) || q < 0) e.defaultQuantity = "Quantity must be positive";
    const pr = parseFloat(priceInput);
    if (!isNaN(pr) && pr < 0) e.estimatedPricePaise = "Price must be positive";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const parsedQty = parseFloat(qtyInput);
      const defaultQuantity = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;
      const parsedPrice = parseFloat(priceInput);
      const estimatedPricePaise = isNaN(parsedPrice) || parsedPrice <= 0 ? 0 : rupeesToPaise(parsedPrice);

      const payload: ProductFormData = {
        ...form,
        defaultQuantity,
        estimatedPricePaise,
      };

      if (editing) {
        await productsApi.update(editing._id, payload);
        toast("Product updated!", "success");
      } else {
        await productsApi.create(payload);
        toast("Product added!", "success");
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save product";
      toast(msg, "error");
    } finally { setSubmitting(false); }
  };

  const handleInstantAdd = async (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return;
    const defaultCat = (catFilter && PRODUCT_CATEGORIES.includes(catFilter as ProductCategory))
      ? (catFilter as ProductCategory)
      : "Maliga Saman";

    try {
      await productsApi.create({
        name: trimmed,
        category: defaultCat,
        defaultQuantity: 1,
        unit: "kg",
        estimatedPricePaise: 0,
        notes: "",
        isFavourite: false,
      });
      toast(`Added "${trimmed}" to ${defaultCat}!`, "success");
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add product";
      toast(msg, "error");
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await productsApi.delete(p._id);
      toast("Product deleted", "success");
      setDeleteConfirm(null);
      load();
    } catch { toast("Failed to delete product", "error"); }
  };

  const toggleFav = async (p: Product) => {
    try {
      await productsApi.update(p._id, { isFavourite: !p.isFavourite });
      setProducts(prev => prev.map(x => x._id === p._id ? { ...x, isFavourite: !x.isFavourite } : x));
    } catch { toast("Failed to update", "error"); }
  };

  const setF = (k: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm(p => ({ ...p, [k]: val }));
    setFormErrors(p => ({ ...p, [k]: "" }));
  };

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "2.5px solid #000",
        flexWrap: "wrap", gap: "0.5rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#000", letterSpacing: "-0.03em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={22} /> PRODUCTS
          </h1>
          <p style={{ fontSize: "0.6875rem", color: "#606060", marginTop: "0.15rem", fontFamily: "'Space Grotesk', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
            {products.length} PRODUCTS IN CATALOGUE
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          id="add-product-btn"
          style={{
            background: "#000",
            color: "#fff",
            border: "2px solid #000",
            borderRadius: "4px",
            boxShadow: "3px 3px 0 #606060",
            padding: "0.5rem 0.875rem",
            fontSize: "0.8125rem",
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> ADD PRODUCT
        </button>
      </div>

      {/* ── FILTERS BAR (CLEAN & INTEGRATED) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {/* Search input with proper icon padding & instant add button */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#000", pointerEvents: "none" }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.5rem", paddingRight: search ? "2.5rem" : "0.875rem", height: "42px" }}
              placeholder="Search or type product to add..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && search.trim()) {
                  e.preventDefault();
                  handleInstantAdd(search.trim());
                }
              }}
              id="product-search"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#606060" }}
              >
                <X size={15} />
              </button>
            )}
          </div>
          {search.trim() && (
            <button
              type="button"
              onClick={() => handleInstantAdd(search.trim())}
              style={{
                background: "#000",
                color: "#fff",
                padding: "0 0.875rem",
                fontSize: "0.75rem",
                fontWeight: 800,
                fontFamily: "'Space Grotesk', sans-serif",
                border: "2px solid #000",
                borderRadius: "4px",
                boxShadow: "2px 2px 0 #606060",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                whiteSpace: "nowrap"
              }}
              title={`Instantly add "${search.trim()}"`}
            >
              <Plus size={15} /> ADD
            </button>
          )}
        </div>

        {/* Instant Add Pill if search text has no exact match */}
        {search.trim() && !products.some(p => p.name.toLowerCase() === search.trim().toLowerCase()) && (
          <button
            type="button"
            onClick={() => handleInstantAdd(search.trim())}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.55rem 0.85rem",
              background: "#fff9db",
              border: "2px dashed #000",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#000" }}>
                + Add &quot;{search.trim()}&quot; to {catFilter || "Maliga Saman"}
              </p>
              <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Grotesk', sans-serif" }}>
                Press Enter or tap here to save immediately
              </p>
            </div>
            <span style={{ background: "#000", color: "#fff", padding: "0.25rem 0.5rem", fontSize: "0.6875rem", fontWeight: 800, borderRadius: "3px" }}>
              + ADD NOW
            </span>
          </button>
        )}

        {/* Quick Category Filter Pills + Favourites (Unified 1-Touch Row) */}
        <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.35rem", scrollbarWidth: "none" }}>
          {[
            { label: "ALL", value: "" },
            { label: "MALIGA SAMAN", value: "Maliga Saman" },
            { label: "VEGETABLES", value: "Vegetables" },
            { label: "OIL", value: "Oil" },
            { label: "EGGS", value: "Eggs" },
            { label: "OTHER", value: "Other" },
          ].map(tab => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setCatFilter(tab.value)}
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.75rem",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
                borderRadius: "4px",
                border: "2px solid #000",
                background: catFilter === tab.value ? "#000" : "#fff",
                color: catFilter === tab.value ? "#fff" : "#000",
                boxShadow: catFilter === tab.value ? "2px 2px 0 #606060" : "2px 2px 0 #000",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFavFilter(!favFilter)}
            style={{
              padding: "0.4rem 0.75rem",
              fontSize: "0.75rem",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              whiteSpace: "nowrap",
              borderRadius: "4px",
              border: "2px solid #000",
              background: favFilter ? "#ffe600" : "#fff",
              color: "#000",
              boxShadow: favFilter ? "2px 2px 0 #606060" : "2px 2px 0 #000",
              cursor: "pointer",
              transition: "all 0.1s ease",
            }}
            id="fav-filter"
          >
            ★ FAVOURITES
          </button>
        </div>
      </div>

      {/* ── PRODUCTS LIST ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, width: "100%", borderRadius: 6 }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <Package size={48} style={{ marginBottom: "0.75rem", color: "#000" }} />
          <h3>NO PRODUCTS FOUND</h3>
          <p>{search || catFilter || favFilter ? "TRY CHANGING YOUR FILTERS" : "ADD YOUR FIRST PRODUCT TO GET STARTED"}</p>
          <button className="btn-primary" onClick={() => openCreate()}>
            <Plus size={16} /> + ADD PRODUCT
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {products.map(p => {
            const catColor = CATEGORY_COLORS[p.category] || "#606060";
            return (
              <div
                key={p._id}
                style={{
                  background: "#fff",
                  border: "2px solid #000",
                  borderRadius: "6px",
                  boxShadow: "3px 3px 0 #000",
                  padding: "0.875rem 1rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Accent line indicator on left */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "5px", background: catColor }} />

                {/* Header row: Name, Category Pill, Favourite Button */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem", paddingLeft: "0.25rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#000", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                        {p.name}
                      </h3>
                      <span
                        style={{
                          backgroundColor: `${catColor}18`,
                          color: "#000",
                          border: `1.5px solid #000`,
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          borderRadius: "3px",
                          padding: "0.15rem 0.5rem",
                          boxShadow: "1.5px 1.5px 0 #000",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em"
                        }}
                      >
                        {p.category}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.8125rem", color: "#505050", fontWeight: 700 }}>
                      <span>QTY: <strong style={{ color: "#000" }}>{p.defaultQuantity} {p.unit}</strong></span>
                      <span>EST: <strong style={{ color: "#000", fontFamily: "system-ui, -apple-system, sans-serif" }}>{formatINR(p.estimatedPricePaise)}</strong></span>
                    </div>

                    {p.notes && (
                      <p style={{ fontSize: "0.72rem", color: "#707070", marginTop: "0.3rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.notes}
                      </p>
                    )}
                  </div>

                  {/* Favourite button */}
                  <button
                    onClick={() => toggleFav(p)}
                    style={{
                      width: 34, height: 34,
                      background: p.isFavourite ? "#fff9db" : "#fff",
                      border: "2px solid #000",
                      borderRadius: "4px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                      boxShadow: "2px 2px 0 #000",
                      transition: "all 0.1s ease",
                    }}
                    title={p.isFavourite ? "Remove from favourites" : "Add to favourites"}
                  >
                    <Heart size={16} fill={p.isFavourite ? "#e63946" : "none"} stroke={p.isFavourite ? "#e63946" : "#000"} />
                  </button>
                </div>

                {/* Actions row: Edit and Delete */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem", paddingTop: "0.625rem", borderTop: "1.5px solid #eaeaea", paddingLeft: "0.25rem" }}>
                  <button
                    onClick={() => openEdit(p)}
                    id={`edit-${p._id}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      background: "#fff",
                      color: "#000",
                      border: "2px solid #000",
                      borderRadius: "4px",
                      boxShadow: "2px 2px 0 #000",
                      cursor: "pointer",
                    }}
                  >
                    <Edit2 size={13} /> EDIT
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p)}
                    id={`delete-${p._id}`}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.65rem",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      fontFamily: "'Space Grotesk', sans-serif",
                      background: "#fee2e2",
                      color: "#b91c1c",
                      border: "2px solid #000",
                      borderRadius: "4px",
                      boxShadow: "2px 2px 0 #000",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} /> DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PRODUCT FORM DIALOG (MODAL) ── */}
      {showForm && (
        <div className="dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "3px solid #000" }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#000", textTransform: "uppercase" }}>
                  {editing ? "EDIT PRODUCT" : "ADD NEW PRODUCT"}
                </h2>
                <p style={{ fontSize: "0.68rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, marginTop: "0.15rem" }}>
                  {editing ? "UPDATE PRODUCT DETAILS" : "STORE IN YOUR HOUSEHOLD CATALOGUE"}
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{ width: "32px", height: "32px", background: "#000", color: "#fff", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">PRODUCT NAME *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Basmati Rice, Sunflower Oil"
                  value={form.name}
                  onChange={setF("name")}
                  id="prod-name"
                  required
                />
                {formErrors.name && <p className="form-error">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">CATEGORY *</label>
                  <select className="form-select" value={form.category} onChange={setF("category")} id="prod-category">
                    {PRODUCT_CATEGORIES.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">UNIT</label>
                  <select className="form-select" value={form.unit} onChange={setF("unit")} id="prod-unit">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">DEFAULT QUANTITY</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.5"
                    placeholder="1"
                    value={qtyInput}
                    onChange={e => setQtyInput(e.target.value)}
                    onFocus={e => e.target.select()}
                    id="prod-qty"
                  />
                  {formErrors.defaultQuantity && <p className="form-error">{formErrors.defaultQuantity}</p>}
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">EST. PRICE (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.50"
                    placeholder="0.00"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    onFocus={e => e.target.select()}
                    id="prod-price"
                  />
                  {formErrors.estimatedPricePaise && <p className="form-error">{formErrors.estimatedPricePaise}</p>}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">NOTES (OPTIONAL)</label>
                <textarea
                  className="form-textarea"
                  style={{ height: "64px", resize: "none" }}
                  placeholder="Brand preference, store, etc..."
                  value={form.notes}
                  onChange={setF("notes")}
                  id="prod-notes"
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.5rem 0" }}>
                <input
                  type="checkbox"
                  style={{ width: 18, height: 18, accentColor: "#000" }}
                  checked={form.isFavourite}
                  onChange={e => setForm(p => ({ ...p, isFavourite: e.target.checked }))}
                  id="prod-fav"
                />
                <span style={{ fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", fontWeight: 800, textTransform: "uppercase" }}>
                  MARK AS FAVOURITE ⭐
                </span>
              </label>

              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: "0.625rem" }} onClick={() => setShowForm(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: "0.625rem" }} disabled={submitting} id="save-product">
                  {submitting ? <><span className="spinner" /> SAVING...</> : editing ? "UPDATE PRODUCT" : "+ ADD PRODUCT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM DIALOG ── */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
              <div style={{ width: 48, height: 48, background: "#fee2e2", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "2px 2px 0 #000" }}>
                <Trash2 size={24} color="#e63946" />
              </div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#000", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                DELETE PRODUCT?
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#606060", fontFamily: "'Space Mono', monospace", marginBottom: "1.25rem" }}>
                Are you sure you want to delete <strong style={{ color: "#000" }}>{deleteConfirm.name}</strong>?
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn-secondary" style={{ flex: 1, padding: "0.625rem" }} onClick={() => setDeleteConfirm(null)}>
                  CANCEL
                </button>
                <button className="btn-danger" style={{ flex: 1, padding: "0.625rem" }} onClick={() => handleDelete(deleteConfirm)} id="confirm-delete">
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
