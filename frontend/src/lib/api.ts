import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL !== undefined
  ? process.env.NEXT_PUBLIC_API_URL
  : (process.env.NODE_ENV === "production" ? "" : "http://localhost:5000");

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: object) => api.post("/api/auth/register", data),
  login: (data: object) => api.post("/api/auth/login", data),
  logout: () => api.post("/api/auth/logout"),
  getMe: () => api.get("/api/auth/me"),
};

// Products
export const productsApi = {
  getAll: (params?: object) => api.get("/api/products", { params }),
  create: (data: object) => api.post("/api/products", data),
  getOne: (id: string) => api.get(`/api/products/${id}`),
  update: (id: string, data: object) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
};

// Shopping Lists
export const shoppingApi = {
  getAll: (params?: object) => api.get("/api/shopping-lists", { params }),
  create: (data: object) => api.post("/api/shopping-lists", data),
  getOne: (id: string) => api.get(`/api/shopping-lists/${id}`),
  update: (id: string, data: object) => api.put(`/api/shopping-lists/${id}`, data),
  delete: (id: string) => api.delete(`/api/shopping-lists/${id}`),
};

// Transactions
export const transactionsApi = {
  getAll: (params?: object) => api.get("/api/transactions", { params }),
  create: (data: object) => api.post("/api/transactions", data),
  getOne: (id: string) => api.get(`/api/transactions/${id}`),
  update: (id: string, data: object) => api.put(`/api/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/api/transactions/${id}`),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => api.get("/api/dashboard/summary"),
  getMonthlyExpenses: (year?: number) => api.get("/api/dashboard/monthly-expenses", { params: { year } }),
  getCategoryExpenses: (month?: number, year?: number) => api.get("/api/dashboard/category-expenses", { params: { month, year } }),
};

export default api;
