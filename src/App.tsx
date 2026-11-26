import React, { useEffect, useState } from "react";
import { AppView, CartItem, Dish, Order, UserRole } from "./types/choyfood";
import { DISH_IMAGES } from "./data/seedData";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SupabaseProvider, useChoyFood } from "./context/SupabaseContext";
import { PublicPages } from "./components/PublicPages";
import { CustomerDashboard, CustomerTab } from "./components/CustomerDashboard";
import { RiderDashboard } from "./components/RiderDashboard";
import { StoreDashboard } from "./components/StoreDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminOpsDashboard } from "./components/AdminOpsDashboard";
import { SidebarDrawer } from "./components/SidebarDrawer";
import { KycModal } from "./components/KycModal";
import { AuthModal } from "./components/AuthModal";
import { CartDrawer } from "./components/CartDrawer";
import { AskChoyDrawer } from "./components/AskChoyDrawer";
import { Download, LogIn, LogOut, Menu, ShieldCheck, ShoppingBag, X } from "lucide-react";

const ROLE_TABS: { id: AppView; role: UserRole; label: string }[] = [
  { id: "super_admin", role: "super_admin", label: "1. Super Admin" },
  { id: "admin", role: "admin", label: "2. Admin" },
  { id: "store", role: "store", label: "3. Store" },
  { id: "rider", role: "rider", label: "4. Rider" },
  { id: "customer", role: "customer", label: "5. Customer" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  store: "Store",
  rider: "Rider",
  customer: "Customer",
};

function ChoyFoodShell() {
  const { authUser, profile, dishes, toasts, dismissToast, openAuthModal, logout, pushToast } =
    useChoyFood();

  const [view, setView] = useState<AppView>("customer");
  const [customerTab, setCustomerTab] = useState<CustomerTab>("explore");
  const [customerTabSeq, setCustomerTabSeq] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedRewardPromo, setAppliedRewardPromo] = useState<{ code: string; seq: number }>({
    code: "",
    seq: 0,
  });
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

  const navigateCustomerTab = (tab: CustomerTab) => {
    setView("customer");
    setCustomerTab(tab);
    setCustomerTabSeq((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyRewardCode = (code: string) => {
    setAppliedRewardPromo((prev) => ({ code, seq: prev.seq + 1 }));
    setIsCartOpen(true);
    pushToast("Voucher Applied", `${code} loaded into your Food Saver Bag.`, "success");
  };

  const isPublicPage =
    view === "landing" ||
    view === "blog" ||
    view === "about" ||
    view === "contact" ||
    view === "privacy";

  const activeDashboardRole: UserRole =
    ROLE_TABS.find((t) => t.id === view)?.role || "customer";

  const signedInRoleLabel = profile?.role ? ROLE_LABELS[profile.role] : "Account";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar Contract: [Sidebar Button + Brand Wordmark] — [5 Single-Line Nav Links] — [Primary Action] */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[#1C1917] transition-colors shrink-0"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("landing")}
              className="font-display text-xl font-extrabold tracking-tight text-[#D12D11] whitespace-nowrap shrink-0"
            >
              CHOY <span className="text-[#E08E00]">DELIVERY</span>
            </button>
          </div>

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
                className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title={`Signed in as ${signedInRoleLabel} (${authUser.email || authUser.uid}) — click to sign out`}
              >
                <span className="text-[10px] font-mono uppercase bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                  {signedInRoleLabel}
                </span>
                <span className="max-w-[110px] truncate">
                  {profile?.displayName || authUser.displayName || "Account"}
                </span>
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
              </button>
            ) : (
              <button
                onClick={() => openAuthModal(activeDashboardRole)}
                className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Workspace 5-Dashboard Milestone Toolbar (Below Header) */}
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
                      ? tab.id === "super_admin"
                        ? "bg-[#0B1120] text-amber-300 shadow-xs"
                        : tab.id === "admin"
                        ? "bg-slate-900 text-sky-300 shadow-xs"
                        : tab.id === "store"
                        ? "bg-[#A61F09] text-white shadow-xs"
                        : tab.id === "rider"
                        ? "bg-[#1F7A4C] text-white shadow-xs"
                        : "bg-white text-[#1C1917] shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => openAuthModal(activeDashboardRole)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#D12D11] px-3 py-1.5 rounded-lg border border-stone-200 bg-white transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D12D11]" />
              <span>{authUser ? "Switch Account" : "Role Login"}</span>
            </button>

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
        {view === "super_admin" && <AdminDashboard />}
        {view === "admin" && <AdminOpsDashboard />}
        {view === "store" && <StoreDashboard />}
        {view === "rider" && <RiderDashboard />}
        {view === "customer" && (
          <CustomerDashboard
            onAddToCart={handleAddToCart}
            onReorderOrder={handleReorderOrder}
            onOpenKyc={() => setIsKycOpen(true)}
            onApplyRewardCode={handleApplyRewardCode}
            requestedTab={customerTab}
            tabRequestSeq={customerTabSeq}
            onTabChange={setCustomerTab}
          />
        )}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="bg-[#1C1917] text-stone-400 text-xs py-8 border-t border-stone-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-display font-bold text-white text-sm">CHOY DELIVERY</span>
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

      {/* Slide-Out Forest Green Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={view}
        activeCustomerTab={customerTab}
        onNavigateView={navigate}
        onNavigateCustomerTab={navigateCustomerTab}
        onOpenKyc={() => setIsKycOpen(true)}
      />

      {/* Modals & Slide-Over Drawers */}
      <AuthModal onAuthenticated={(role) => navigate(role)} />
      <KycModal isOpen={isKycOpen} onClose={() => setIsKycOpen(false)} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onChangeQty={handleChangeCartQty}
        onClearCart={() => setCart([])}
        externalPromoCode={appliedRewardPromo.code}
        externalPromoSeq={appliedRewardPromo.seq}
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
      <SupabaseProvider>
        <ChoyFoodShell />
      </SupabaseProvider>
    </ErrorBoundary>
  );
}
