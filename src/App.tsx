import React, { useEffect, useState } from "react";
import { AppView, CartItem, Dish, Order } from "./types/choyfood";
import { DISH_IMAGES } from "./data/seedData";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { FirebaseProvider, useChoyFood } from "./context/FirebaseContext";
import { PublicPages } from "./components/PublicPages";
import { CustomerDashboard } from "./components/CustomerDashboard";
import { RiderDashboard } from "./components/RiderDashboard";
import { StoreDashboard } from "./components/StoreDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { KycModal } from "./components/KycModal";
import { CartDrawer } from "./components/CartDrawer";
import { AskChoyDrawer } from "./components/AskChoyDrawer";
import { Download, LogOut, ShieldCheck, ShoppingBag, X } from "lucide-react";

const ROLE_TABS: { id: AppView; label: string }[] = [
  { id: "customer", label: "Customer View" },
  { id: "rider", label: "Rider Portal" },
  { id: "store", label: "Store Board" },
  { id: "admin", label: "Super Admin" },
];

function ChoyFoodShell() {
  const { authUser, profile, dishes, toasts, dismissToast, loginWithGoogle, logout, pushToast, loginAsDemoUser } =
    useChoyFood();

  const [view, setView] = useState<AppView>("customer");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      pushToast(
        "Install ChoyFood App",
        "Add ChoyFood to your mobile home screen via your browser menu (Add to Home Screen).",
        "info"
      );
      return;
    }
    installPromptEvent.prompt();
    const result = await installPromptEvent.userChoice;
    if (result.outcome === "accepted") {
      pushToast("App Installed", "Thank you for installing ChoyFood!", "success");
    }
    setInstallPromptEvent(null);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleAddToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { dish, qty: 1 }];
    });
    pushToast("Added to Bag", `${dish.name} — ₱${dish.price.toFixed(2)}`, "success");
  };

  const handleReorderOrder = (order: Order) => {
    const nextItems: CartItem[] = order.items.map((item) => {
      const matched = dishes.find((d) => d.id === item.dishId);
      const fallbackDish: Dish = matched || {
        id: item.dishId,
        name: item.name,
        description: `Reordered from ${order.storeName}`,
        price: item.price,
        saleGroup: "Combo Meal",
        storeName: order.storeName,
        storeOwnerId: order.storeOwnerId,
        imageUrl: DISH_IMAGES.lechonKawali,
        likes: 0,
        available: true,
      };
      return { dish: fallbackDish, qty: item.qty };
    });
    setCart(nextItems);
    setIsCartOpen(true);
    pushToast(
      `Order ${order.orderNumber} Loaded`,
      `${nextItems.reduce((s, i) => s + i.qty, 0)} item(s) ready in your Food Saver Bag.`,
      "success"
    );
  };

  const handleChangeCartQty = (dishId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.dish.id === dishId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const navigate = (next: AppView) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isPublicPage =
    view === "landing" ||
    view === "blog" ||
    view === "about" ||
    view === "contact" ||
    view === "privacy";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar Contract: [Brand Wordmark] — [5 Single-Line Nav Links] — [1 Primary Action] */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <button
            onClick={() => navigate("landing")}
            className="font-display text-xl font-extrabold tracking-tight text-[#D12D11] whitespace-nowrap shrink-0"
          >
            Choy<span className="text-[#E08E00]">Food</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <button
              onClick={() => navigate("customer")}
              className={`hover:text-[#D12D11] transition-colors whitespace-nowrap shrink-0 ${
                !isPublicPage ? "text-[#1C1917] font-semibold" : ""
              }`}
            >
              Order Now
            </button>
            <button
              onClick={() => navigate("landing")}
              className={`hover:text-[#D12D11] transition-colors whitespace-nowrap shrink-0 ${
                view === "landing" ? "text-[#1C1917] font-semibold" : ""
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("blog")}
              className={`hover:text-[#D12D11] transition-colors whitespace-nowrap shrink-0 ${
                view === "blog" ? "text-[#1C1917] font-semibold" : ""
              }`}
            >
              Blog
            </button>
            <button
              onClick={() => navigate("about")}
              className={`hover:text-[#D12D11] transition-colors whitespace-nowrap shrink-0 ${
                view === "about" ? "text-[#1C1917] font-semibold" : ""
              }`}
            >
              About
            </button>
            <button
              onClick={() => navigate("contact")}
              className={`hover:text-[#D12D11] transition-colors whitespace-nowrap shrink-0 ${
                view === "contact" ? "text-[#1C1917] font-semibold" : ""
              }`}
            >
              Support
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Install ChoyFood Mobile App"
            >
              <Download className="w-3.5 h-3.5 text-[#D12D11]" />
              <span className="hidden sm:inline">Install App</span>
            </button>

            {authUser ? (
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title={authUser.email || "Signed in account"}
              >
                <span className="max-w-[120px] truncate">
                  {profile?.displayName || authUser.displayName || "Account"}
                </span>
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={loginWithGoogle}
                  className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={() => loginAsDemoUser("admin")}
                  className="bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  title="Instant Demo Super Admin Access (Bypasses Firebase 2FA)"
                >
                  ⚡ Demo Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Workspace Role Toolbar (Below Header) */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto scrollbar-none">
            {ROLE_TABS.map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? tab.id === "admin"
                        ? "bg-[#0B1120] text-white"
                        : "bg-white text-[#1C1917] shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsKycOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#D12D11] px-3 py-1.5 rounded-lg border border-stone-200 bg-white transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D12D11]" />
              <span>Verify KYC</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 bg-[#1C1917] hover:bg-[#D12D11] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
              <span className="font-mono tabular-nums text-amber-300">({cartCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === "landing" && (
          <PublicPages
            view={view}
            onNavigate={navigate}
            onOpenKyc={() => setIsKycOpen(true)}
          />
        )}
        {view === "blog" && (
          <PublicPages
            view={view}
            onNavigate={navigate}
            onOpenKyc={() => setIsKycOpen(true)}
          />
        )}
        {view === "about" && (
          <PublicPages
            view={view}
            onNavigate={navigate}
            onOpenKyc={() => setIsKycOpen(true)}
          />
        )}
        {view === "contact" && (
          <PublicPages
            view={view}
            onNavigate={navigate}
            onOpenKyc={() => setIsKycOpen(true)}
          />
        )}
        {view === "privacy" && (
          <PublicPages
            view={view}
            onNavigate={navigate}
            onOpenKyc={() => setIsKycOpen(true)}
          />
        )}
        {view === "customer" && (
          <CustomerDashboard
            onAddToCart={handleAddToCart}
            onReorderOrder={handleReorderOrder}
            onOpenKyc={() => setIsKycOpen(true)}
          />
        )}
        {view === "rider" && <RiderDashboard />}
        {view === "store" && <StoreDashboard />}
        {view === "admin" && <AdminDashboard />}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="bg-[#1C1917] text-stone-400 text-xs py-8 border-t border-stone-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-display font-bold text-white text-sm">ChoyFood</span>
            <p className="text-stone-400 mt-0.5">
              Local Filipino food delivery connecting neighborhood kitchens, riders, and diners.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button onClick={() => navigate("privacy")} className="hover:text-white transition-colors">
              Privacy &amp; Terms
            </button>
            <button onClick={() => navigate("blog")} className="hover:text-white transition-colors">
              Blog
            </button>
            <button onClick={() => navigate("about")} className="hover:text-white transition-colors">
              About
            </button>
            <button onClick={() => navigate("contact")} className="hover:text-white transition-colors">
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-Over Drawers */}
      <KycModal isOpen={isKycOpen} onClose={() => setIsKycOpen(false)} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onChangeQty={handleChangeCartQty}
        onClearCart={() => setCart([])}
      />
      <AskChoyDrawer />

      {/* Non-Blocking Toast Stack (replaces window.alert) */}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl px-4 py-3 shadow-lg border text-xs flex items-start justify-between gap-3 ${
                toast.variant === "error"
                  ? "bg-rose-950 border-rose-800 text-rose-100"
                  : toast.variant === "success"
                  ? "bg-[#1C1917] border-emerald-700 text-white"
                  : "bg-[#1C1917] border-stone-700 text-stone-100"
              }`}
            >
              <div className="space-y-0.5">
                <p className="font-semibold">{toast.title}</p>
                {toast.description && <p className="text-stone-300">{toast.description}</p>}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-stone-400 hover:text-white shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <ChoyFoodShell />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
