"use client";
import { useEffect, useState, useCallback } from "react";
import { productsApi, shoppingApi, transactionsApi } from "@/lib/api";
import { formatINR, rupeesToPaise, paiseToRupees, CATEGORY_COLORS } from "@/lib/utils";
import type { Product, ShoppingList, ShoppingItem, PaymentMethod } from "@/types";
import { useToast } from "@/context/ToastContext";
import { Plus, ShoppingCart, CheckCircle2, Circle, MinusCircle, Trash2, X, Receipt, ChevronDown, ChevronUp, Search, Calendar, Tag, Check } from "lucide-react";

const PAYMENT_METHODS: PaymentMethod[] = ["Cash","UPI","Debit Card","Credit Card","Other"];

const CATEGORY_ORDER = [
  "Vegetables",
  "Maliga Saman",
  "Oil",
  "Eggs",
  "Dairy & Milk",
  "Cleaning & Household",
  "Fruits",
  "Snacks & Drinks",
  "Meat & Seafood",
  "Other"
];

interface CategoryTheme {
  icon: string;
  color: string;
  bgLight: string;
  border: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  "Vegetables": {
    icon: "🥦",
    color: "#16a34a",
    bgLight: "#f0fdf4",
    border: "#86efac",
    headerBg: "linear-gradient(90deg, #15803d 0%, #22c55e 100%)",
    badgeBg: "#15803d",
    badgeText: "#ffffff",
  },
  "Maliga Saman": {
    icon: "🌾",
    color: "#ea580c",
    bgLight: "#fff7ed",
    border: "#fdba74",
    headerBg: "linear-gradient(90deg, #c2410c 0%, #f97316 100%)",
    badgeBg: "#c2410c",
    badgeText: "#ffffff",
  },
  "Oil": {
    icon: "🛢️",
    color: "#ca8a04",
    bgLight: "#fefce8",
    border: "#fde047",
    headerBg: "linear-gradient(90deg, #a16207 0%, #eab308 100%)",
    badgeBg: "#a16207",
    badgeText: "#ffffff",
  },
  "Eggs": {
    icon: "🥚",
    color: "#d97706",
    bgLight: "#fffbeb",
    border: "#fcd34d",
    headerBg: "linear-gradient(90deg, #b45309 0%, #f59e0b 100%)",
    badgeBg: "#b45309",
    badgeText: "#ffffff",
  },
  "Dairy & Milk": {
    icon: "🥛",
    color: "#2563eb",
    bgLight: "#eff6ff",
    border: "#93c5fd",
    headerBg: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)",
    badgeBg: "#1d4ed8",
    badgeText: "#ffffff",
  },
  "Cleaning & Household": {
    icon: "🧼",
    color: "#0891b2",
    bgLight: "#ecfeff",
    border: "#67e8f9",
    headerBg: "linear-gradient(90deg, #0e7490 0%, #06b6d4 100%)",
    badgeBg: "#0e7490",
    badgeText: "#ffffff",
  },
  "Fruits": {
    icon: "🍎",
    color: "#db2777",
    bgLight: "#fdf2f8",
    border: "#f9a8d4",
    headerBg: "linear-gradient(90deg, #be185d 0%, #ec4899 100%)",
    badgeBg: "#be185d",
    badgeText: "#ffffff",
  },
  "Snacks & Drinks": {
    icon: "🍿",
    color: "#7c3aed",
    bgLight: "#faf5ff",
    border: "#d8b4fe",
    headerBg: "linear-gradient(90deg, #6d28d9 0%, #8b5cf6 100%)",
    badgeBg: "#6d28d9",
    badgeText: "#ffffff",
  },
  "Meat & Seafood": {
    icon: "🍗",
    color: "#dc2626",
    bgLight: "#fef2f2",
    border: "#fca5a5",
    headerBg: "linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)",
    badgeBg: "#b91c1c",
    badgeText: "#ffffff",
  },
  "Other": {
    icon: "📦",
    color: "#475569",
    bgLight: "#f8fafc",
    border: "#cbd5e1",
    headerBg: "linear-gradient(90deg, #334155 0%, #64748b 100%)",
    badgeBg: "#334155",
    badgeText: "#ffffff",
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  "Vegetables": "🥦",
  "Maliga Saman": "🌾",
  "Oil": "🛢️",
  "Eggs": "🥚",
  "Dairy & Milk": "🥛",
  "Cleaning & Household": "🧼",
  "Fruits": "🍎",
  "Snacks & Drinks": "🍿",
  "Meat & Seafood": "🍗",
  "Other": "📦",
};

interface CheckoutItemState {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePaise: number;
  category: string;
  checked: boolean;
}

export default function ShoppingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCheckout, setShowCheckout] = useState<ShoppingList | null>(null);
  const [deleteConfirmList, setDeleteConfirmList] = useState<ShoppingList | null>(null);
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Create list form (No title field needed - auto generated!)
  const [shoppingDate, setShoppingDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ productId?: string; productName: string; quantity: number; unit: string; estimatedPricePaise: number; category: string }[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [catalogCatFilter, setCatalogCatFilter] = useState("");
  const [creating, setCreating] = useState(false);

  // Checkout form (no discount field, bill amount optional!)
  const [checkoutForm, setCheckoutForm] = useState({
    customBillAmountRupees: "",
    paymentMethod: "Cash" as PaymentMethod,
    paymentStatus: "Paid" as "Paid" | "Unpaid",
    storeName: "",
    notes: "",
  });
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItemState[]>([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Quick add item to existing list
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Other");
  const [addingItemSaving, setAddingItemSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, l] = await Promise.all([productsApi.getAll(), shoppingApi.getAll()]);
      setProducts(p.data.products);
      setLists(l.data.shoppingLists);
    } catch { toast("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.trim().toLowerCase());
    const matchesCategory = !catalogCatFilter || p.category === catalogCatFilter;
    return matchesSearch && matchesCategory;
  });

  const getItemCategory = useCallback((item: { productId?: string; productName: string; category?: string }): string => {
    // 1. Explicit valid category if already assigned and not generic "Other"
    if (item.category && item.category !== "Other") return item.category;

    // 2. Try match from catalog products
    const matched = products.find(p =>
      (item.productId && p._id === item.productId) ||
      p.name.toLowerCase().trim() === item.productName.toLowerCase().trim()
    );
    if (matched?.category) return matched.category;

    // 3. Keyword matching for common Indian groceries & household
    const name = item.productName.toLowerCase().trim();
    if (/tomato|thakkali|onion|vengayam|potato|urulai|brinjal|kathirikai|carrot|beans|beetroot|cabbage|greens|keerai|chilli|mirchi|garlic|poondu|ginger|inji|lemon|elumichai|coriander|kothamalli|curry|karuveppilai|cucumber|vellarikkai|ladies finger|vendakkai|drumstick|murungaikai|vegetable|cauliflower|capsicum|pudina|mint|mushroom|radish|mullangi|pumpkin|poosanikai|chow chow|avarakkai|kovakkai|pudalangai|snake gourd|bitter gourd|pavakkai|plantain|vazhaikkai|vazhaipoo|vazhaithandu|peas|pattani/i.test(name)) {
      return "Vegetables";
    }
    if (/rice|arisi|dal|paruppu|toor|urad|moong|channa|atta|flour|maida|rava|sooji|salt|uppu|sugar|sakkarai|turmeric|manjal|jeera|cumin|mustard|kadugu|pepper|milagu|appalam|pappad|ghee|nei|masala|paste|noodles|pasta|tamarind|puli|fenugreek|venthayam|cardamom|elakkai|clove|lavangam|cinnamon|pattai|hing|perungayam|asafoetida|kasuri methi|sombu|saunf|rava|aval|poha|vermicelli|semiya/i.test(name)) {
      return "Maliga Saman";
    }
    if (/soap|detergent|areal|aerial|surf|rin|comfort|vim|liquid|shampoo|paste|brush|cleaner|harpic|dettol|lizol|colgate|hamam|arason|washing|dishwash|scrubber|mop|broom|phenol|phenyl|bleach|tide|wheel|exol|pril|exo/i.test(name)) {
      return "Cleaning & Household";
    }
    if (/oil|ennai|gingelly|groundnut|sunflower|coconut oil|mustard oil|deepam/i.test(name)) {
      return "Oil";
    }
    if (/egg|muttai/i.test(name)) {
      return "Eggs";
    }
    if (/milk|paal|curd|thayir|butter|vennai|cheese|paneer|ghee/i.test(name)) {
      return "Dairy & Milk";
    }
    if (/apple|banana|orange|grape|mango|pomegranate|papaya|guava|fruit/i.test(name)) {
      return "Fruits";
    }
    if (/biscuit|chips|mixture|snack|drink|juice|coke|pepsi|tea|coffee|horlicks|boost/i.test(name)) {
      return "Snacks & Drinks";
    }
    if (/chicken|mutton|fish|meat|prawn|crab/i.test(name)) {
      return "Meat & Seafood";
    }
    return item.category || "Other";
  }, [products]);

  const addExistingProduct = (product: Product) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.productId === product._id || i.productName.toLowerCase() === product.name.toLowerCase());
      if (exists) {
        return prev.map(i => (i.productId === product._id || i.productName.toLowerCase() === product.name.toLowerCase())
          ? { ...i, quantity: i.quantity + product.defaultQuantity }
          : i
        );
      }
      return [...prev, {
        productId: product._id,
        productName: product.name,
        quantity: product.defaultQuantity,
        unit: product.unit,
        estimatedPricePaise: product.estimatedPricePaise,
        category: product.category,
      }];
    });
    setProductSearch("");
  };

  const addCustomItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    // Check if it matches an existing product in catalogue
    const matched = products.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (matched) {
      addExistingProduct(matched);
      return;
    }

    const detectedCategory = getItemCategory({ productName: trimmed });

    // Otherwise add as new custom item with detected category
    setSelectedItems(prev => {
      const exists = prev.find(i => i.productName.toLowerCase() === trimmed.toLowerCase());
      if (exists) {
        return prev.map(i => i.productName.toLowerCase() === trimmed.toLowerCase()
          ? { ...i, quantity: i.quantity + 1 }
          : i
        );
      }
      return [...prev, {
        productName: trimmed,
        quantity: 1,
        unit: "kg",
        estimatedPricePaise: 0,
        category: detectedCategory,
      }];
    });
    setProductSearch("");
  };

  const removeItem = (productName: string) => {
    setSelectedItems(prev => prev.filter(i => i.productName !== productName));
  };

  const updateQty = (productName: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productName);
      return;
    }
    setSelectedItems(prev => prev.map(i => i.productName === productName ? { ...i, quantity: qty } : i));
  };

  const estimatedTotal = selectedItems.reduce((s, i) => s + (i.estimatedPricePaise * i.quantity), 0);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast("Please add at least one item to your list", "error");
      return;
    }
    setCreating(true);
    try {
      // Auto-generate title with date: e.g. "Shopping List · 19 Oct"
      const dateObj = new Date(shoppingDate);
      const formattedDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const autoTitle = `Shopping List · ${formattedDate}`;

      await shoppingApi.create({
        title: autoTitle,
        shoppingDate: shoppingDate,
        notes: notes,
        items: selectedItems.map(i => ({
          ...(i.productId ? { productId: i.productId } : {}),
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit || "kg",
          estimatedPricePaise: i.estimatedPricePaise || 0,
          category: i.category || "Other",
        })),
      });

      toast("Shopping list created!", "success");
      setShowCreate(false);
      setSelectedItems([]);
      setShoppingDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setProductSearch("");
      loadData();
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create list", "error");
    } finally {
      setCreating(false);
    }
  };

  const isListExpanded = (list: ShoppingList) => {
    if (expandedLists[list._id] !== undefined) {
      return expandedLists[list._id];
    }
    return list.status !== "completed" && list.status !== "cancelled";
  };

  const toggleListExpand = (listId: string, currentExpanded: boolean) => {
    setExpandedLists(prev => ({ ...prev, [listId]: !currentExpanded }));
  };

  const updateItemStatus = async (listId: string, itemId: string, status: ShoppingItem["status"]) => {
    const list = lists.find(l => l._id === listId);
    if (!list) return;
    const updatedItems = list.items.map(i => i._id === itemId ? { ...i, status } : i);
    // Optimistic UI update
    setLists(prev => prev.map(l => l._id === listId ? { ...l, items: updatedItems, status: "shopping" } : l));
    try {
      await shoppingApi.update(listId, { items: updatedItems, status: "shopping" });
    } catch {
      toast("Failed to update item", "error");
      loadData();
    }
  };

  const openCheckout = (list: ShoppingList) => {
    setShowCheckout(list);
    const hasPurchasedItems = list.items.some(i => i.status === "purchased");

    const items: CheckoutItemState[] = list.items.map(i => {
      const isChecked = hasPurchasedItems ? i.status === "purchased" : i.status !== "skipped";
      const lineTotalPaise = (i.estimatedPricePaise || 0) * (i.quantity || 1);
      return {
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        pricePaise: lineTotalPaise,
        category: getItemCategory(i),
        checked: isChecked,
      };
    });

    setCheckoutItems(items);
    setCheckoutForm({
      customBillAmountRupees: "",
      paymentMethod: "Cash",
      paymentStatus: "Paid",
      storeName: "",
      notes: "",
    });
  };

  const checkedCheckoutItems = checkoutItems.filter(i => i.checked);
  const checkoutCalculatedTotalPaise = checkedCheckoutItems.reduce((sum, i) => sum + (i.pricePaise || 0), 0);
  const effectiveFinalBillPaise = checkoutForm.customBillAmountRupees && parseFloat(checkoutForm.customBillAmountRupees) > 0
    ? rupeesToPaise(parseFloat(checkoutForm.customBillAmountRupees))
    : checkoutCalculatedTotalPaise;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckout) return;
    const itemsToSave = checkoutItems.filter(i => i.checked);
    if (itemsToSave.length === 0) {
      toast("Please select at least one purchased item to checkout", "error");
      return;
    }
    setCheckoutSubmitting(true);
    try {
      await transactionsApi.create({
        shoppingListId: showCheckout._id,
        purchasedItems: itemsToSave.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unit: i.unit,
          pricePaise: i.pricePaise,
          category: i.category || "Other",
        })),
        finalBillAmountPaise: effectiveFinalBillPaise,
        discountPaise: 0,
        paymentMethod: checkoutForm.paymentMethod,
        paymentStatus: checkoutForm.paymentStatus,
        storeName: checkoutForm.storeName,
        notes: checkoutForm.notes,
        purchaseDate: showCheckout.shoppingDate.split("T")[0],
      });
      toast(`Checkout completed! ${formatINR(effectiveFinalBillPaise)} saved.`, "success");
      setShowCheckout(null);
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Checkout failed";
      toast(msg, "error");
    } finally { setCheckoutSubmitting(false); }
  };

  const handleAddItemToList = async (listId: string) => {
    const trimmed = newItemName.trim();
    if (!trimmed) {
      toast("Please enter a product name", "error");
      return;
    }
    const list = lists.find(l => l._id === listId);
    if (!list) return;

    setAddingItemSaving(true);
    try {
      const pricePaise = rupeesToPaise(parseFloat(newItemPrice) || 0);
      const cat = newItemCategory && newItemCategory !== "Other"
        ? newItemCategory
        : getItemCategory({ productName: trimmed });

      const matched = products.find(p => p.name.toLowerCase().trim() === trimmed.toLowerCase());

      const newItem = {
        ...(matched ? { productId: matched._id } : {}),
        productName: trimmed,
        quantity: newItemQty > 0 ? newItemQty : 1,
        unit: newItemUnit || "kg",
        estimatedPricePaise: pricePaise || (matched?.estimatedPricePaise ?? 0),
        status: "pending" as const,
        category: cat,
      };

      const updatedItems = [...list.items, newItem];

      await shoppingApi.update(listId, {
        items: updatedItems,
      });

      toast(`Added "${trimmed}" to list!`, "success");
      setNewItemName("");
      setNewItemQty(1);
      setNewItemPrice("");
      setNewItemCategory("Other");
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add item";
      toast(msg, "error");
    } finally {
      setAddingItemSaving(false);
    }
  };

  const deleteList = async (id: string) => {
    try { await shoppingApi.delete(id); toast("List deleted", "success"); loadData(); }
    catch { toast("Failed to delete", "error"); }
  };

  const statusColors: Record<string, string> = { draft: "badge-amber", shopping: "badge-blue", completed: "badge-emerald", cancelled: "badge-red" };

  return (
    <div>
      {/* ── TOP SECTION HEADER ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "3px solid #000",
        flexWrap: "wrap", gap: "0.5rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#000", letterSpacing: "-0.03em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={20} /> SHOPPING LISTS
          </h1>
          <p style={{ fontSize: "0.68rem", color: "#606060", marginTop: "0.2rem", fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
            {lists.length} LISTS TOTAL
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} id="create-list-btn">
          <Plus size={16} /> NEW LIST
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({length:3}).map((_,i) => <div key={i} className="skeleton" style={{ height: 96, width: "100%" }} />)}
        </div>
      ) : lists.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={48} style={{ marginBottom: "0.75rem", color: "#000" }} />
          <h3>NO SHOPPING LISTS YET</h3>
          <p>CREATE YOUR FIRST SHOPPING LIST TO GET STARTED</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> + CREATE LIST
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map(list => {
            const expanded = isListExpanded(list);
            const totalItems = list.items.length;
            const purchasedItems = list.items.filter(i => i.status === "purchased");
            const purchasedCount = purchasedItems.length;
            const purchasedTotalPaise = purchasedItems.reduce((s, i) => s + (i.estimatedPricePaise * i.quantity), 0);
            const estTotalPaise = list.estimatedTotalPaise || list.items.reduce((s, i) => s + (i.estimatedPricePaise * i.quantity), 0);
            const percentBought = totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;

            return (
              <div
                key={list._id}
                className="card"
                style={{
                  padding: "1rem 1.15rem",
                  border: "2px solid #000",
                  boxShadow: "3px 3px 0px #000",
                  background: "#ffffff",
                  transition: "all 0.15s ease",
                  marginBottom: "0.85rem",
                }}
              >
                {/* ── CARD HEADER (CLEAN & SLEEK) ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.02em", margin: 0 }}>
                        {list.title}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 800,
                          fontFamily: "'Space Mono', monospace",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "3px",
                          border: "1px solid #000",
                          textTransform: "uppercase",
                          background: list.status === "completed" ? "#dcfce7" : list.status === "shopping" ? "#e0e7ff" : list.status === "cancelled" ? "#fee2e2" : "#fef3c7",
                          color: list.status === "completed" ? "#15803d" : list.status === "shopping" ? "#3730a3" : list.status === "cancelled" ? "#b91c1c" : "#92400e",
                        }}
                      >
                        {list.status}
                      </span>
                    </div>

                    {/* Clean Subtitle Metadata (No Heavy Clutter Boxes!) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem", fontSize: "0.72rem", color: "#64748b", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, flexWrap: "wrap" }}>
                      <span>📅 {new Date(list.shoppingDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</span>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <span>📦 {totalItems} items</span>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <span style={{ color: "#0f172a", fontWeight: 800 }}>Est. {formatINR(estTotalPaise)}</span>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
                    {list.status !== "completed" && list.status !== "cancelled" && (
                      <button
                        type="button"
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          fontFamily: "'Space Grotesk', sans-serif",
                          padding: "0.38rem 0.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          background: "#22c55e",
                          color: "#000",
                          border: "2px solid #000",
                          borderRadius: "4px",
                          boxShadow: "2px 2px 0 #000",
                          cursor: "pointer",
                        }}
                        onClick={() => openCheckout(list)}
                        id={`checkout-${list._id}`}
                      >
                        <Receipt size={13} strokeWidth={2.5} /> CHECKOUT
                      </button>
                    )}
                    <button
                      type="button"
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        fontFamily: "'Space Grotesk', sans-serif",
                        padding: "0.38rem 0.65rem",
                        border: "2px solid #000",
                        borderRadius: "4px",
                        boxShadow: "2px 2px 0 #000",
                        background: expanded ? "#000" : "#fff",
                        color: expanded ? "#fff" : "#000",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleListExpand(list._id, expanded)}
                      title={expanded ? "Collapse list" : "Expand checklist"}
                    >
                      {expanded ? <><ChevronUp size={13} /> HIDE</> : <><ChevronDown size={13} /> VIEW CHECKLIST</>}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div style={{ borderTop: "1.5px solid #e2e8f0", marginTop: "0.85rem", paddingTop: "0.75rem" }}>
                    
                    {/* Clean Minimal Progress Bar (NO HEAVY NESTED BOXES!) */}
                    <div style={{ marginBottom: "0.9rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem", fontSize: "0.72rem", fontFamily: "'Space Grotesk', sans-serif", flexWrap: "wrap", gap: "0.4rem" }}>
                        <span style={{ fontWeight: 800, color: percentBought === 100 ? "#16a34a" : "#0f172a" }}>
                          ✓ {purchasedCount} of {totalItems} items bought <span style={{ color: "#64748b", fontWeight: 600 }}>({percentBought}%)</span>
                        </span>
                        <div style={{ fontSize: "0.6875rem", fontFamily: "'Space Mono', monospace", color: "#64748b" }}>
                          Bought: <strong style={{ color: "#16a34a" }}>{formatINR(purchasedTotalPaise)}</strong> / Est: <strong style={{ color: "#0f172a" }}>{formatINR(estTotalPaise)}</strong>
                        </div>
                      </div>

                      {/* Smooth Progress Track */}
                      <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", border: "1.5px solid #000" }}>
                        <div
                          style={{
                            width: `${percentBought}%`,
                            height: "100%",
                            borderRadius: "999px",
                            background: percentBought === 100 
                              ? "#10b981" 
                              : "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    {/* Interactive Checklist Items Grouped by Category */}
                    {(() => {
                      const groupedItems = list.items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
                        const cat = getItemCategory(item);
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                      }, {});

                      const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
                        const itemsA = groupedItems[a];
                        const itemsB = groupedItems[b];
                        const allBoughtA = itemsA.every(i => i.status === "purchased");
                        const allBoughtB = itemsB.every(i => i.status === "purchased");

                        // Categories with pending items stay at the top; 100% completed categories sink to the bottom
                        if (!allBoughtA && allBoughtB) return -1;
                        if (allBoughtA && !allBoughtB) return 1;

                        const indexA = CATEGORY_ORDER.indexOf(a);
                        const indexB = CATEGORY_ORDER.indexOf(b);
                        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                      });

                      return (
                        <div className="space-y-3.5">
                          {sortedCategories.map(cat => {
                            const items = groupedItems[cat];
                            const theme = CATEGORY_THEMES[cat] || CATEGORY_THEMES["Other"];
                            const catBought = items.filter(i => i.status === "purchased").length;
                            const isCategoryComplete = catBought === items.length && items.length > 0;

                            // Sort items: TO BUY items at the TOP, BOUGHT (checked) items at the BOTTOM!
                            const sortedCategoryItems = [...items].sort((a, b) => {
                              if (a.status === "purchased" && b.status !== "purchased") return 1;
                              if (a.status !== "purchased" && b.status === "purchased") return -1;
                              return 0;
                            });

                            return (
                              <div
                                key={cat}
                                style={{
                                  background: "#ffffff",
                                  border: "1.5px solid #000",
                                  boxShadow: "2px 2px 0px #000",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                  marginBottom: "0.65rem",
                                }}
                              >
                                {/* Category Header Banner (Clean & Lightweight) */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.42rem 0.75rem",
                                    background: isCategoryComplete ? "#f0fdf4" : theme.bgLight,
                                    borderBottom: "1.5px solid #000",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                    <span style={{ fontSize: "1rem" }}>{theme.icon}</span>
                                    <span style={{
                                      fontSize: "0.78rem",
                                      fontWeight: 800,
                                      color: "#0f172a",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.03em",
                                    }}>
                                      {cat}
                                    </span>
                                    <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
                                      ({items.length})
                                    </span>
                                  </div>
                                  <span style={{
                                    fontSize: "0.6rem",
                                    fontFamily: "'Space Mono', monospace",
                                    fontWeight: 800,
                                    background: isCategoryComplete ? "#dcfce7" : "#ffffff",
                                    color: isCategoryComplete ? "#15803d" : "#0f172a",
                                    padding: "0.12rem 0.45rem",
                                    border: "1px solid #000",
                                    borderRadius: "3px",
                                  }}>
                                    {isCategoryComplete ? "✓ COMPLETED" : `${catBought}/${items.length} BOUGHT`}
                                  </span>
                                </div>

                                {/* Items in this category (Clean & Uncluttered Rows) */}
                                <div style={{ padding: "0.4rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                  {sortedCategoryItems.map(item => {
                                    const isPurchased = item.status === "purchased";
                                    return (
                                      <div
                                        key={item._id}
                                        onClick={() => updateItemStatus(list._id, item._id, isPurchased ? "pending" : "purchased")}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          padding: "0.45rem 0.65rem",
                                          background: isPurchased ? "#f8fafc" : "#ffffff",
                                          border: "1px solid #e2e8f0",
                                          borderLeft: isPurchased ? "4px solid #10b981" : `4px solid ${theme.color}`,
                                          borderRadius: "3px",
                                          cursor: "pointer",
                                          userSelect: "none",
                                          transition: "all 0.1s ease",
                                          opacity: isPurchased ? 0.75 : 1,
                                        }}
                                        onMouseEnter={e => {
                                          e.currentTarget.style.borderColor = "#94a3b8";
                                        }}
                                        onMouseLeave={e => {
                                          e.currentTarget.style.borderColor = "#e2e8f0";
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flex: 1, minWidth: 0 }}>
                                          {/* Custom Checkbox */}
                                          <div
                                            style={{
                                              width: "20px",
                                              height: "20px",
                                              border: "1.5px solid #000",
                                              borderRadius: "3px",
                                              background: isPurchased ? "#10b981" : "#ffffff",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flexShrink: 0,
                                              transition: "background 0.1s ease",
                                            }}
                                          >
                                            {isPurchased && <Check size={13} color="#ffffff" strokeWidth={3.5} />}
                                          </div>

                                          {/* Product details */}
                                          <div style={{ minWidth: 0, flex: 1 }}>
                                            <span style={{
                                              fontSize: "0.8125rem",
                                              fontWeight: 700,
                                              color: isPurchased ? "#64748b" : "#0f172a",
                                              textDecoration: isPurchased ? "line-through" : "none",
                                              display: "block",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}>
                                              {item.productName}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.1rem" }}>
                                              <span
                                                style={{
                                                  fontSize: "0.625rem",
                                                  color: "#475569",
                                                  background: "#f1f5f9",
                                                  padding: "0.05rem 0.35rem",
                                                  borderRadius: "2px",
                                                  fontFamily: "'Space Mono', monospace",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {item.quantity} {item.unit}
                                              </span>
                                              {item.estimatedPricePaise > 0 && (
                                                <span style={{ fontSize: "0.625rem", color: "#94a3b8", fontFamily: "'Space Mono', monospace" }}>
                                                  (@ {formatINR(item.estimatedPricePaise)}/{item.unit})
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Status and Price Column */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                          {isPurchased ? (
                                            <span
                                              style={{
                                                fontSize: "0.58rem",
                                                fontWeight: 800,
                                                fontFamily: "'Space Mono', monospace",
                                                padding: "0.12rem 0.4rem",
                                                background: "#dcfce7",
                                                color: "#15803d",
                                                borderRadius: "2px",
                                              }}
                                            >
                                              ✓ BOUGHT
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                fontSize: "0.58rem",
                                                fontWeight: 700,
                                                fontFamily: "'Space Mono', monospace",
                                                padding: "0.12rem 0.35rem",
                                                color: "#64748b",
                                              }}
                                            >
                                              TO BUY
                                            </span>
                                          )}
                                          <span
                                            style={{
                                              fontSize: "0.75rem",
                                              color: isPurchased ? "#166534" : "#0f172a",
                                              fontFamily: "'Space Mono', monospace",
                                              fontWeight: 800,
                                            }}
                                          >
                                            {formatINR(item.estimatedPricePaise * item.quantity)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Quick Add Form to Existing List */}
                    {addingToListId === list._id && (
                      <div
                        style={{
                          background: "#fffbeb",
                          border: "2.5px solid #000",
                          boxShadow: "4px 4px 0px #000",
                          borderRadius: "4px",
                          overflow: "hidden",
                          marginTop: "0.9rem",
                          marginBottom: "0.6rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.55rem 0.85rem",
                            background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
                            color: "#ffffff",
                            borderBottom: "2px solid #000",
                          }}
                        >
                          <span style={{ fontSize: "0.78rem", fontWeight: 900, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem", letterSpacing: "0.04em" }}>
                            <Plus size={15} strokeWidth={3} /> ADD ITEM TO THIS LIST
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddingToListId(null)}
                            style={{
                              background: "#ffffff",
                              border: "1.5px solid #000",
                              cursor: "pointer",
                              color: "#000",
                              width: "22px",
                              height: "22px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "1px 1px 0 #000",
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div style={{ padding: "0.85rem" }}>
                          {/* Product Name Input with fast search/type */}
                          <div style={{ marginBottom: "0.6rem", position: "relative" }}>
                            <label className="form-label" style={{ fontSize: "0.68rem", fontWeight: 800, marginBottom: "0.25rem", color: "#000" }}>
                              PRODUCT NAME
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Type product name (e.g. Milk, Onions, Soap)..."
                              style={{ border: "2px solid #000", background: "#ffffff", boxShadow: "2px 2px 0 #000" }}
                              value={newItemName}
                              onChange={e => {
                                const val = e.target.value;
                                setNewItemName(val);
                                const matched = products.find(p => p.name.toLowerCase().trim() === val.toLowerCase().trim());
                                if (matched) {
                                  setNewItemUnit(matched.unit || "kg");
                                  setNewItemPrice(matched.estimatedPricePaise ? paiseToRupees(matched.estimatedPricePaise).toString() : "");
                                  setNewItemCategory(matched.category);
                                }
                              }}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddItemToList(list._id);
                                }
                              }}
                              autoFocus
                            />
                            {/* Live search suggestions from catalogue */}
                            {newItemName.trim() && (
                              (() => {
                                const matchedList = products.filter(p =>
                                  p.name.toLowerCase().includes(newItemName.toLowerCase().trim()) &&
                                  p.name.toLowerCase().trim() !== newItemName.toLowerCase().trim()
                                ).slice(0, 4);

                                if (matchedList.length === 0) return null;

                                return (
                                  <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#fff",
                                    border: "2px solid #000",
                                    boxShadow: "3px 3px 0px #000",
                                    zIndex: 25,
                                    maxHeight: "140px",
                                    overflowY: "auto",
                                  }}>
                                    {matchedList.map(p => (
                                      <div
                                        key={p._id}
                                        onClick={() => {
                                          setNewItemName(p.name);
                                          setNewItemUnit(p.unit || "kg");
                                          setNewItemPrice(p.estimatedPricePaise ? paiseToRupees(p.estimatedPricePaise).toString() : "");
                                          setNewItemCategory(p.category);
                                        }}
                                        style={{
                                          padding: "0.4rem 0.6rem",
                                          cursor: "pointer",
                                          fontSize: "0.75rem",
                                          borderBottom: "1px solid #e2e8f0",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = "#fef9c3")}
                                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                                      >
                                        <span style={{ fontWeight: 800 }}>{p.name}</span>
                                        <span style={{ fontSize: "0.65rem", color: "#606060", fontFamily: "'Space Mono', monospace" }}>
                                          <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "0.1rem 0.35rem", border: "1px solid #000", marginRight: "0.35rem" }}>
                                            {p.category}
                                          </span>
                                          {formatINR(p.estimatedPricePaise)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()
                            )}
                          </div>

                          {/* Qty, Unit, Price row */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr", gap: "0.6rem", marginBottom: "0.75rem" }}>
                            <div>
                              <label className="form-label" style={{ fontSize: "0.65rem", fontWeight: 800, marginBottom: "0.2rem" }}>QTY</label>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                style={{ border: "2px solid #000", background: "#ffffff", boxShadow: "2px 2px 0 #000" }}
                                value={newItemQty}
                                onChange={e => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: "0.65rem", fontWeight: 800, marginBottom: "0.2rem" }}>UNIT</label>
                              <select
                                className="form-select"
                                style={{ border: "2px solid #000", background: "#ffffff", boxShadow: "2px 2px 0 #000" }}
                                value={newItemUnit}
                                onChange={e => setNewItemUnit(e.target.value)}
                              >
                                {["kg","g","L","ml","piece","packet","box","bunch","dozen","other"].map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: "0.65rem", fontWeight: 800, marginBottom: "0.2rem" }}>EST. ₹ (OPTIONAL)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.50"
                                placeholder="e.g. 50"
                                className="form-input"
                                style={{ border: "2px solid #000", background: "#ffffff", boxShadow: "2px 2px 0 #000" }}
                                value={newItemPrice}
                                onChange={e => setNewItemPrice(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: "flex", gap: "0.6rem" }}>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: "0.45rem",
                                fontSize: "0.78rem",
                                fontWeight: 900,
                                background: "#fbbf24",
                                color: "#000",
                                border: "2px solid #000",
                                boxShadow: "2px 2px 0 #000",
                              }}
                              disabled={addingItemSaving || !newItemName.trim()}
                              onClick={() => handleAddItemToList(list._id)}
                            >
                              {addingItemSaving ? <><span className="spinner" /> ADDING...</> : <><Plus size={14} strokeWidth={3} /> ADD TO LIST</>}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{
                                padding: "0.45rem 0.85rem",
                                fontSize: "0.78rem",
                                fontWeight: 800,
                                border: "2px solid #000",
                                boxShadow: "2px 2px 0 #000",
                              }}
                              onClick={() => setAddingToListId(null)}
                            >
                              CANCEL
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Inside Expanded Section */}
                    {/* Footer Inside Expanded Section */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "0.9rem",
                        paddingTop: "0.75rem",
                        borderTop: "2px dashed #000",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Left: Delete & Add Item Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            fontFamily: "'Space Grotesk', sans-serif",
                            padding: "0.42rem 0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            border: "2px solid #000",
                            borderRadius: "4px",
                            boxShadow: "2.5px 2.5px 0px #000",
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                            userSelect: "none",
                          }}
                          onClick={() => setDeleteConfirmList(list)}
                          id={`delete-list-${list._id}`}
                          title="Delete list"
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#fecaca";
                            e.currentTarget.style.transform = "translate(-1px, -1px)";
                            e.currentTarget.style.boxShadow = "3.5px 3.5px 0px #000";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "#fee2e2";
                            e.currentTarget.style.transform = "translate(0, 0)";
                            e.currentTarget.style.boxShadow = "2.5px 2.5px 0px #000";
                          }}
                        >
                          <Trash2 size={13} strokeWidth={2.5} /> DELETE LIST
                        </button>

                        {list.status !== "completed" && list.status !== "cancelled" && (
                          <button
                            type="button"
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              fontFamily: "'Space Grotesk', sans-serif",
                              padding: "0.42rem 0.75rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              background: addingToListId === list._id ? "#4f46e5" : "#fef08a",
                              color: addingToListId === list._id ? "#ffffff" : "#000000",
                              border: "2px solid #000",
                              borderRadius: "4px",
                              boxShadow: "2.5px 2.5px 0px #000",
                              cursor: "pointer",
                              transition: "all 0.1s ease",
                              userSelect: "none",
                            }}
                            onClick={() => {
                              if (addingToListId === list._id) {
                                setAddingToListId(null);
                              } else {
                                setAddingToListId(list._id);
                                setNewItemName("");
                                setNewItemQty(1);
                                setNewItemUnit("kg");
                                setNewItemPrice("");
                                setNewItemCategory("Other");
                              }
                            }}
                            id={`add-item-btn-${list._id}`}
                            title="Add item to list"
                            onMouseEnter={e => {
                              if (addingToListId !== list._id) e.currentTarget.style.background = "#fde047";
                              e.currentTarget.style.transform = "translate(-1px, -1px)";
                              e.currentTarget.style.boxShadow = "3.5px 3.5px 0px #000";
                            }}
                            onMouseLeave={e => {
                              if (addingToListId !== list._id) e.currentTarget.style.background = "#fef08a";
                              e.currentTarget.style.transform = "translate(0, 0)";
                              e.currentTarget.style.boxShadow = "2.5px 2.5px 0px #000";
                            }}
                          >
                            <Plus size={14} strokeWidth={3} /> {addingToListId === list._id ? "CLOSE FORM" : "ADD ITEM"}
                          </button>
                        )}
                      </div>

                      {/* Right: Checkout Button (Clean, vivid emerald & compact to prevent unwanted wrapping) */}
                      {list.status !== "completed" && list.status !== "cancelled" && (
                        <button
                          type="button"
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 900,
                            fontFamily: "'Space Grotesk', sans-serif",
                            padding: "0.45rem 0.95rem",
                            background: "#22c55e",
                            color: "#000000",
                            border: "2px solid #000",
                            borderRadius: "4px",
                            boxShadow: "2.5px 2.5px 0px #000",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            letterSpacing: "0.02em",
                            transition: "all 0.1s ease",
                            userSelect: "none",
                            marginLeft: "auto",
                          }}
                          onClick={() => openCheckout(list)}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#16a34a";
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.transform = "translate(-1px, -1px)";
                            e.currentTarget.style.boxShadow = "3.5px 3.5px 0px #000";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "#22c55e";
                            e.currentTarget.style.color = "#000000";
                            e.currentTarget.style.transform = "translate(0, 0)";
                            e.currentTarget.style.boxShadow = "2.5px 2.5px 0px #000";
                          }}
                        >
                          <Receipt size={14} strokeWidth={2.5} /> CHECKOUT ({purchasedCount}/{totalItems}) →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE LIST DIALOG (REFINED & PROFESSIONAL) ── */}
      {showCreate && (
        <div className="dialog-overlay" onClick={() => setShowCreate(false)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "3px solid #000" }}>
              <div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#000", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
                  NEW SHOPPING LIST
                </h2>
                <p style={{ fontSize: "0.68rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, marginTop: "0.15rem" }}>
                  PICK OR TYPE ANY PRODUCTS FOR YOUR TRIP
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                style={{ width: "32px", height: "32px", background: "#000", color: "#fff", border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateList} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              {/* 1. PRODUCT SEARCH & ON-THE-FLY NEW ITEM CREATION */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#000", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Search size={14} /> SEARCH OR ADD PRODUCTS
                  </label>
                  <span style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", color: "#606060", fontWeight: 700 }}>
                    CATALOGUE & CUSTOM
                  </span>
                </div>

                {/* Input with Enter key support */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search or type product (e.g. Milk, Onions)..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (productSearch.trim()) addCustomItem(productSearch);
                      }
                    }}
                  />
                  {productSearch.trim() && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}
                      onClick={() => addCustomItem(productSearch)}
                    >
                      <Plus size={15} /> ADD
                    </button>
                  )}
                </div>

                {/* Quick Category Filter for Regular Items */}
                <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", marginBottom: "0.5rem", paddingBottom: "0.2rem", scrollbarWidth: "none" }}>
                  {[
                    { label: "ALL", value: "" },
                    { label: "MALIGA SAMAN", value: "Maliga Saman" },
                    { label: "VEGETABLES", value: "Vegetables" },
                    { label: "OIL", value: "Oil" },
                    { label: "EGGS", value: "Eggs" },
                  ].map(tab => (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() => setCatalogCatFilter(tab.value)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.625rem",
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        border: "1.5px solid #000",
                        background: catalogCatFilter === tab.value ? "#000" : "#fff",
                        color: catalogCatFilter === tab.value ? "#fff" : "#000",
                        boxShadow: catalogCatFilter === tab.value ? "1.5px 1.5px 0 #606060" : "1.5px 1.5px 0 #000",
                        cursor: "pointer",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search suggestion box / Quick Add button */}
                <div style={{ maxHeight: "150px", overflowY: "auto", border: "2px solid #000", borderRadius: "4px", background: "#fff", padding: "0.35rem" }}>
                  {/* Instant Add Option if user typed text */}
                  {productSearch.trim() && (
                    <button
                      type="button"
                      onClick={() => addCustomItem(productSearch)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.625rem 0.75rem", marginBottom: "0.35rem",
                        background: "#fffef0", border: "2px dashed #000", cursor: "pointer", textAlign: "left"
                      }}
                    >
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#000" }}>
                          + Add &quot;{productSearch.trim()}&quot; as new item
                        </p>
                        <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                          Not in catalogue? Click here to add instantly!
                        </p>
                      </div>
                      <span className="badge badge-amber" style={{ fontSize: "0.625rem" }}>+ NEW ITEM</span>
                    </button>
                  )}

                  {/* Matched Catalogue Products */}
                  {filteredProducts.map(p => (
                    <button
                      key={p._id}
                      type="button"
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.45rem 0.65rem", borderBottom: "1px solid #e8e8e4", background: "none",
                        borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer", textAlign: "left"
                      }}
                      onClick={() => addExistingProduct(p)}
                    >
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#000" }}>{p.name}</p>
                        <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>
                          {p.defaultQuantity} {p.unit} · {p.category} · {formatINR(p.estimatedPricePaise)}
                        </p>
                      </div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#000", border: "1px solid #000", padding: "2px 6px", background: "#f5f5f0" }}>
                        + ADD
                      </span>
                    </button>
                  ))}

                  {/* If nothing in catalogue and no input typed */}
                  {!productSearch.trim() && filteredProducts.length === 0 && (
                    <p style={{ fontSize: "0.6875rem", color: "#808080", textAlign: "center", padding: "1.25rem 0", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                      TYPE ANY PRODUCT NAME ABOVE TO SEARCH OR ADD
                    </p>
                  )}
                </div>
              </div>

              {/* 2. SELECTED ITEMS LIST */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#000", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Tag size={14} /> SELECTED ITEMS ({selectedItems.length})
                  </label>
                  {selectedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedItems([])}
                      style={{ background: "none", border: "none", fontSize: "0.65rem", color: "#e63946", fontFamily: "'Space Mono', monospace", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                    >
                      CLEAR ALL
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: "170px", overflowY: "auto", border: "2px solid #000", borderRadius: "4px", background: "#fff", padding: "0.4rem" }}>
                  {selectedItems.map(item => (
                    <div
                      key={item.productName}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.5rem 0.65rem", marginBottom: "0.35rem",
                        background: "#fafaf7", border: "1.5px solid #000", borderRadius: "2px"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: "0.5rem" }}>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.productName}
                        </p>
                        <p style={{ fontSize: "0.625rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                          {item.unit} {item.estimatedPricePaise > 0 ? `· ${formatINR(item.estimatedPricePaise)}` : ""}
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <button
                          type="button"
                          style={{ width: 24, height: 24, border: "2px solid #000", background: "#fff", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => updateQty(item.productName, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={{ fontSize: "0.8125rem", fontFamily: "'Space Mono', monospace", fontWeight: 800, width: 28, textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          style={{ width: 24, height: 24, border: "2px solid #000", background: "#fff", fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onClick={() => updateQty(item.productName, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          style={{ width: 24, height: 24, background: "#fee2e2", border: "2px solid #000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e63946", marginLeft: "0.25rem" }}
                          onClick={() => removeItem(item.productName)}
                          title="Remove item"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedItems.length === 0 && (
                    <div style={{ padding: "1.5rem 0.5rem", textAlign: "center" }}>
                      <p style={{ fontSize: "0.72rem", color: "#808080", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                        NO ITEMS SELECTED YET
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "#a0a0a0", marginTop: "0.2rem" }}>
                        Type or pick products above to build your shopping list
                      </p>
                    </div>
                  )}
                </div>

                {selectedItems.length > 0 && estimatedTotal > 0 && (
                  <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "#fff", border: "2px solid #000", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6875rem", fontFamily: "'Space Mono', monospace", fontWeight: 700, textTransform: "uppercase" }}>ESTIMATED TOTAL</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#000" }}>{formatINR(estimatedTotal)}</span>
                  </div>
                )}
              </div>

              {/* 3. SHOPPING DATE (MOVED TO THE LAST PART) */}
              <div style={{ borderTop: "2px solid #000", paddingTop: "1rem" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.75rem", fontWeight: 800, color: "#000", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Calendar size={14} /> SHOPPING DATE *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={shoppingDate}
                    onChange={e => setShoppingDate(e.target.value)}
                    id="list-date"
                    required
                  />
                </div>
              </div>

              {/* 4. MODAL ACTION BUTTONS */}
              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: "0.625rem" }}
                  onClick={() => setShowCreate(false)}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: "0.625rem" }}
                  disabled={creating || selectedItems.length === 0}
                  id="save-list"
                >
                  {creating ? (
                    <><span className="spinner" /> CREATING...</>
                  ) : (
                    <><Plus size={16} /> CREATE LIST {selectedItems.length > 0 ? `(${selectedItems.length})` : ""}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHECKOUT DIALOG ── */}
      {showCheckout && (
        <div className="dialog-overlay" onClick={() => setShowCheckout(null)}>
          <div className="dialog-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: "3px solid #000" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#000", textTransform: "uppercase" }}>COMPLETE CHECKOUT</h2>
                <p style={{ fontSize: "0.68rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700, textTransform: "uppercase", marginTop: "0.15rem" }}>
                  {showCheckout.title} · {new Date(showCheckout.shoppingDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <button onClick={() => setShowCheckout(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#000" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-3">
              {/* Checklist in Checkout */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    PURCHASED PRODUCTS CHECKLIST
                  </label>
                  <span style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", color: "#606060", fontWeight: 700 }}>
                    {checkedCheckoutItems.length} OF {checkoutItems.length} SELECTED
                  </span>
                </div>

                <div style={{ maxHeight: "200px", overflowY: "auto", border: "2px solid #000", padding: "0.35rem", background: "#f8f8f5" }}>
                  {CATEGORY_ORDER.map(cat => {
                    const itemsInCat = checkoutItems
                      .map((ci, idx) => ({ ...ci, originalIdx: idx }))
                      .filter(ci => (ci.category || "Other") === cat);
                    if (itemsInCat.length === 0) return null;
                    const catIcon = CATEGORY_ICONS[cat] || "📦";
                    const catColor = CATEGORY_COLORS[cat] || "#64748b";

                    return (
                      <div key={cat} style={{ marginBottom: "0.5rem" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.2rem 0.4rem",
                          background: "#ffffff",
                          border: "1px solid #000",
                          borderLeft: `4px solid ${catColor}`,
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          marginBottom: "0.25rem",
                        }}>
                          <span>{catIcon}</span>
                          <span>{cat}</span>
                          <span style={{ fontSize: "0.6rem", color: "#606060", fontFamily: "'Space Mono', monospace" }}>({itemsInCat.length})</span>
                        </div>
                        {itemsInCat.map(item => (
                          <div
                            key={item.originalIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.35rem 0.5rem",
                              marginBottom: "0.2rem",
                              background: item.checked ? "#ffffff" : "#f1f1ee",
                              border: "1px solid #000",
                              opacity: item.checked ? 1 : 0.6,
                            }}
                          >
                            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", flex: 1, minWidth: 0, margin: 0 }}>
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  setCheckoutItems(prev => prev.map((ci, i) => i === item.originalIdx ? { ...ci, checked: isChecked } : ci));
                                }}
                                style={{ width: "16px", height: "16px", accentColor: "#000", cursor: "pointer" }}
                              />
                              <span style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#000",
                                textDecoration: item.checked ? "none" : "line-through",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {item.productName} ({item.quantity} {item.unit})
                              </span>
                            </label>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                              <span style={{ fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#606060" }}>₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.50"
                                disabled={!item.checked}
                                className="form-input"
                                style={{ width: "95px", padding: "0.2rem 0.4rem", fontSize: "0.75rem", textAlign: "right" }}
                                value={paiseToRupees(item.pricePaise)}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCheckoutItems(prev => prev.map((ci, i) => i === item.originalIdx ? { ...ci, pricePaise: rupeesToPaise(val) } : ci));
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Purchase Summary Box */}
              <div style={{
                background: "#f0fdf4",
                border: "2px solid #000",
                boxShadow: "3px 3px 0px #000",
                padding: "0.65rem 0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div>
                  <span style={{ fontSize: "0.65rem", fontFamily: "'Space Mono', monospace", fontWeight: 800, color: "#166534", textTransform: "uppercase", display: "block" }}>
                    TOTAL PURCHASE AMOUNT ({checkedCheckoutItems.length} ITEMS)
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "#606060" }}>
                    Auto-sum of all checked items
                  </span>
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#000", fontFamily: "'Space Mono', monospace" }}>
                  {formatINR(checkoutCalculatedTotalPaise)}
                </div>
              </div>

              {/* Optional Custom Bill Override (Not mandatory!) */}
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    TOTAL BILL AMOUNT (OPTIONAL)
                  </label>
                  <span style={{ fontSize: "0.65rem", color: "#606060", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                    DEFAULT: {formatINR(checkoutCalculatedTotalPaise)}
                  </span>
                </div>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  step="0.50"
                  placeholder={`Leave blank to use ${formatINR(checkoutCalculatedTotalPaise)}`}
                  value={checkoutForm.customBillAmountRupees}
                  onChange={e => setCheckoutForm(p => ({ ...p, customBillAmountRupees: e.target.value }))}
                  id="checkout-bill"
                />
              </div>

              {/* Payment Method & Payment Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">PAYMENT METHOD</label>
                  <select className="form-select" value={checkoutForm.paymentMethod} onChange={e => setCheckoutForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))} id="checkout-method">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">STATUS</label>
                  <select className="form-select" value={checkoutForm.paymentStatus} onChange={e => setCheckoutForm(p => ({ ...p, paymentStatus: e.target.value as "Paid" | "Unpaid" }))} id="checkout-status">
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              {/* Store Name (Optional) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">STORE NAME (OPTIONAL)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Reliance Fresh, Annachi Kadai"
                  value={checkoutForm.storeName}
                  onChange={e => setCheckoutForm(p => ({ ...p, storeName: e.target.value }))}
                  id="checkout-store"
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.5rem" }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCheckout(null)}>
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5 }}
                  disabled={checkoutSubmitting || checkedCheckoutItems.length === 0}
                  id="confirm-checkout"
                >
                  {checkoutSubmitting ? (
                    <><span className="spinner" />SAVING...</>
                  ) : (
                    <>COMPLETE CHECKOUT · {formatINR(effectiveFinalBillPaise)}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PROFESSIONAL DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmList && (
        <div
          className="dialog-overlay"
          onClick={() => setDeleteConfirmList(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              border: "3px solid #000000",
              boxShadow: "7px 7px 0px #000000",
              borderRadius: "6px",
              maxWidth: "420px",
              width: "100%",
              overflow: "hidden",
              animation: "toastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Modal Header Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                color: "#ffffff",
                borderBottom: "2.5px solid #000000",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    background: "#ffffff",
                    border: "1.5px solid #000",
                    boxShadow: "1px 1px 0 #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={15} color="#b91c1c" strokeWidth={2.5} />
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 900,
                    fontFamily: "'Space Grotesk', sans-serif",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  DELETE SHOPPING LIST?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmList(null)}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #000",
                  cursor: "pointer",
                  width: "22px",
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "1px 1px 0 #000",
                  padding: 0,
                }}
              >
                <X size={13} strokeWidth={3} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "1.1rem" }}>
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "0 0 0.5rem 0",
                }}
              >
                Are you sure you want to permanently delete this list?
              </p>
              <div
                style={{
                  background: "#fef2f2",
                  border: "1.5px solid #f87171",
                  padding: "0.5rem 0.75rem",
                  marginBottom: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>📋</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 900,
                      color: "#991b1b",
                      display: "block",
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {deleteConfirmList.title}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "#b91c1c", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>
                    {deleteConfirmList.items.length} items will be removed
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "0.72rem", color: "#64748b", margin: "0 0 1.1rem 0", lineHeight: 1.45 }}>
                This action cannot be undone. All tracked items, estimated prices, and checklist marks will be deleted permanently.
              </p>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: "0.55rem",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    border: "2px solid #000",
                    boxShadow: "2px 2px 0 #000",
                  }}
                  onClick={() => setDeleteConfirmList(null)}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1.5,
                    padding: "0.55rem",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    background: "#ef4444",
                    color: "#ffffff",
                    border: "2px solid #000",
                    boxShadow: "3px 3px 0 #000",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    letterSpacing: "0.03em",
                  }}
                  onClick={() => {
                    const id = deleteConfirmList._id;
                    setDeleteConfirmList(null);
                    deleteList(id);
                  }}
                >
                  <Trash2 size={14} strokeWidth={2.5} /> YES, DELETE LIST
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
