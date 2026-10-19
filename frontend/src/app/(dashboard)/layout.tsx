"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Home, Package, ShoppingCart, Receipt, User,
  LogOut, ChevronRight, X
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", icon: Home,         label: "Home"     },
  { href: "/products",  icon: Package,      label: "Products" },
  { href: "/shopping",  icon: ShoppingCart, label: "Shopping" },
  { href: "/history",   icon: Receipt,      label: "History"  },
  { href: "/settings",  icon: User,         label: "Profile"  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="brute-viewport flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-black border-3 border-black text-white flex items-center justify-center text-3xl mx-auto mb-4 shadow-[4px_4px_0_#606060]">
            🧺
          </div>
          <div className="spinner mx-auto" />
          <p className="font-mono text-xs uppercase font-bold text-black mt-3">Loading HomeBasket...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    setProfileDrawerOpen(false);
    await logout();
    router.push("/login");
  };

  const getPageTitle = () => {
    if (pathname.startsWith("/products")) return "PRODUCTS CATALOGUE";
    if (pathname.startsWith("/shopping")) return "SHOPPING LISTS";
    if (pathname.startsWith("/history")) return "PURCHASE HISTORY";
    if (pathname.startsWith("/expenses")) return "EXPENSE ANALYTICS";
    if (pathname.startsWith("/settings")) return "ACCOUNT & PROFILE";
    return "OVERVIEW DASHBOARD";
  };

  return (
    <div className="brute-viewport">
      {/* ── BRUTALIST MOBILE APP FRAME ── */}
      <div className="brute-app-frame">

        {/* ── TOP BRUTALIST HEADER ── */}
        <header className="brute-mobile-header">
          <div className="flex items-center gap-2.5">
            <div className="brute-logo-box">
              🧺
            </div>
            <div>
              <div className="brute-app-name leading-none">HomeBasket</div>
              <div className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider mt-0.5">
                EXPENSE TRACKER
              </div>
            </div>
          </div>

          {/* User Profile Badge */}
          <button
            onClick={() => setProfileDrawerOpen(true)}
            className="brute-user-badge"
            id="mobile-user-profile-btn"
          >
            <span className="font-mono text-xs font-bold text-white max-w-[80px] truncate uppercase">
              {user.fullName.split(" ")[0]}
            </span>
            <div className="w-5 h-5 bg-white text-black font-mono font-bold text-xs flex items-center justify-center">
              {user.fullName[0].toUpperCase()}
            </div>
          </button>
        </header>

        {/* ── PAGE STRIPE (Space Mono indicator) ── */}
        <div className="brute-page-stripe flex items-center justify-between">
          <span>▸ {getPageTitle()}</span>
          <span className="text-[9px] text-emerald-400 font-mono">● LIVE</span>
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="brute-main">
          {children}
        </main>

        {/* ── BOTTOM BRUTALIST NAVIGATION BAR ── */}
        <nav className="brute-bottom-nav">
          <div className="brute-bottom-bar">
            {mobileNavItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`brute-nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={18} className={isActive ? "scale-110" : ""} />
                  <span className="text-[9px] mt-1 tracking-tight">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── PROFILE BOTTOM DRAWER (BRUTALIST) ── */}
        {profileDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
            onClick={() => setProfileDrawerOpen(false)}
          >
            <div
              className="w-full max-w-[480px] bg-[#f5f5f0] border-t-4 border-black p-5 pb-8 animate-slide-up shadow-[0_-8px_0_#000]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black text-white border-2 border-black font-mono text-xl font-bold flex items-center justify-center shadow-[3px_3px_0_#606060]">
                    {user.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-black text-base uppercase leading-tight">{user.fullName}</h3>
                    <p className="font-mono text-xs text-gray-600 mt-0.5">@{user.username} • {user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setProfileDrawerOpen(false)}
                  className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0_#606060]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <Link
                  href="/settings"
                  onClick={() => setProfileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 bg-white border-3 border-black shadow-[3px_3px_0_#000] font-mono font-bold text-xs uppercase"
                >
                  <div className="flex items-center gap-2.5">
                    <User size={16} />
                    <span>Account Settings</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>

                <Link
                  href="/expenses"
                  onClick={() => setProfileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 bg-white border-3 border-black shadow-[3px_3px_0_#000] font-mono font-bold text-xs uppercase"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt size={16} />
                    <span>Expense Analytics</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-600 text-white border-3 border-black shadow-[4px_4px_0_#000] font-bold text-xs uppercase tracking-wider cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                id="drawer-logout-btn"
              >
                <LogOut size={16} />
                Sign Out from HomeBasket
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
