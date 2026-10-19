// User types
export interface User {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Product types
export type ProductCategory =
  | "Maliga Saman"
  | "Vegetables"
  | "Oil"
  | "Eggs"
  | "Dairy & Milk"
  | "Fruits"
  | "Snacks & Drinks"
  | "Cleaning & Household"
  | "Meat & Seafood"
  | "Other"
  | "Grains & Pulses"
  | "Dairy & Eggs"
  | "Oils & Condiments"
  | "Snacks & Beverages"
  | "Cleaning & Hygiene"
  | "Personal Care"
  | "Bakery"
  | "Frozen Foods";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Vegetables",
  "Maliga Saman",
  "Oil",
  "Eggs",
  "Other"
];

export interface Product {
  _id: string;
  userId: string;
  name: string;
  category: ProductCategory;
  defaultQuantity: number;
  unit: string;
  estimatedPricePaise: number;
  notes: string;
  isFavourite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  category: ProductCategory;
  defaultQuantity: number;
  unit: string;
  estimatedPricePaise: number;
  notes: string;
  isFavourite: boolean;
}

// Shopping list types
export type ShoppingItemStatus = "pending" | "purchased" | "skipped";
export type ShoppingListStatus = "draft" | "shopping" | "completed" | "cancelled";

export interface ShoppingItem {
  _id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  estimatedPricePaise: number;
  status: ShoppingItemStatus;
  notes: string;
  category?: string;
}

export interface ShoppingList {
  _id: string;
  userId: string;
  title: string;
  shoppingDate: string;
  items: ShoppingItem[];
  estimatedTotalPaise: number;
  status: ShoppingListStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export type PaymentMethod = "Cash" | "UPI" | "Debit Card" | "Credit Card" | "Other";
export type PaymentStatus = "Paid" | "Unpaid";

export interface PurchasedItem {
  _id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePaise: number;
  category: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  shoppingListId?: string;
  purchasedItems: PurchasedItem[];
  finalBillAmountPaise: number;
  discountPaise: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  storeName: string;
  notes: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardSummary {
  monthSpendingPaise: number;
  monthPaidPaise: number;
  totalShoppingTrips: number;
  pendingLists: number;
  unpaidBillsPaise: number;
  unpaidBillsCount: number;
  todayItems: ShoppingItem[];
  recentTransactions: Transaction[];
  productCount: number;
}

export interface MonthlyExpense {
  month: number;
  totalPaise: number;
  paidPaise: number;
  unpaidPaise: number;
  count: number;
}

export interface CategoryExpense {
  _id: string;
  totalPaise: number;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
