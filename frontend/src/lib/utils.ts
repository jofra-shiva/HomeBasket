import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ProductCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Vegetables",
  "Maliga Saman",
  "Oil",
  "Eggs",
  "Other"
];

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(rupees);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const SHORT_MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Maliga Saman": "#ff6b35",
  "Vegetables": "#22c55e",
  "Oil": "#eab308",
  "Eggs": "#f97316",
  "Dairy & Milk": "#3b82f6",
  "Fruits": "#ec4899",
  "Snacks & Drinks": "#8b5cf6",
  "Cleaning & Household": "#06b6d4",
  "Meat & Seafood": "#ef4444",
  "Other": "#64748b",
  "Grains & Pulses": "#ff6b35",
  "Dairy & Eggs": "#3b82f6",
  "Oils & Condiments": "#eab308",
  "Snacks & Beverages": "#8b5cf6",
  "Cleaning & Hygiene": "#06b6d4",
  "Personal Care": "#ec4899",
  "Bakery": "#d97706",
  "Frozen Foods": "#6366f1",
};
