import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { useChoyFood } from "../context/SupabaseContext";
import { SUPER_ADMIN_EMAIL } from "../lib/supabase";
import { KycVaultRecord, UserProfile, UserRole } from "../types/choyfood";
import { ORDER_STEPS } from "../data/seedData";
import {
  Bell,
  Bike,
  Bot,
  BrainCircuit,
  Calendar,
  Check,
  CheckCircle2,
  Crown,
  Database,
  DollarSign,
  Eye,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Store,
  Tag,
  TrendingUp,
  Trash2,
  UserCog,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { DISH_IMAGES, HERO_FEAST_IMAGE } from "../data/seedData";
import { calculateHiddenRiderPayout, calculatePlatformMarkup, evaluateMathExpression } from "../lib/fees";
import { StoreOperatingStatus, StorePermitChecklist } from "../types/choyfood";

const USER_ROLES: UserRole[] = ["super_admin", "admin", "store", "rider", "customer"];

export const AdminDashboard: React.FC = () => {
  const {
    authUser,
    isSuperAdmin,
    dishes,
    allDishes,
    orders,
    allUsers,
    kycRecords,
    activityLogs,
    supportTickets,
    openAuthModal,
    openAskChoy,
    reviewKyc,
    advanceOrder,
    updateUserAdmin,
    adjustRiderScore,
    resolveSupportTicket,
    dismissActivityLog,
    runSystemCleaner,
    clearOperationalDemoData,
    seedCatalogToSupabase,
    supabaseProjectLabel,
    pushToast,
    cmsSettings,
    updateCmsSettings,
    setStoreStatus,
    setStorePermit,
    approveDish,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    allPromos,
    createPromoCode,
    togglePromoActive,
    riderDocsByUid,
  } = useChoyFood();

  const isAdmin = isSuperAdmin;

  const [inspectedKyc, setInspectedKyc] = useState<KycVaultRecord | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editWallet, setEditWallet] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("customer");
  const [editRiderCode, setEditRiderCode] = useState("");
  const [editStoreName, setEditStoreName] = useState("");
  const [editChoyPro, setEditChoyPro] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [adminTab, setAdminTab] = useState<
    | "overview"
    | "stores"
    | "riders"
    | "customers"
    | "promos"
    | "banners"
    | "schedule"
    | "brain"
    | "insights"
  >("overview");

  const [cleaning, setCleaning] = useState(false);
  const [wipingDemo, setWipingDemo] = useState(false);
  const [confirmWipeDemo, setConfirmWipeDemo] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dishMarkupDrafts, setDishMarkupDrafts] = useState<Record<string, string>>({});

  // Promo creator state
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("30");
  const [newPromoMinSpend, setNewPromoMinSpend] = useState("250");
  const [newPromoDesc, setNewPromoDesc] = useState("");

  // CMS Editor state
  const [draftBannerText, setDraftBannerText] = useState(cmsSettings.bannerText);
  const [draftRefCust, setDraftRefCust] = useState(String(cmsSettings.referralBonusCustomer));
  const [draftRefRider, setDraftRefRider] = useState(String(cmsSettings.referralBonusRider));
  const [draftProFee, setDraftProFee] = useState(String(cmsSettings.choyProMonthlyFee));
  const [newSlideCaption, setNewSlideCaption] = useState("");
  const [newSlidePromo, setNewSlidePromo] = useState("");
  const [newSlideImg, setNewSlideImg] = useState(HERO_FEAST_IMAGE);

  // AI Brain & Safe Math tester state
  const [draftAiKnowledge, setDraftAiKnowledge] = useState(cmsSettings.aiKnowledgeBase);
  const [brainQuery, setBrainQuery] = useState("");
  const [brainTestOutput, setBrainTestOutput] = useState<string | null>(null);

  const handleToggleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkAdvanceOrders = async (targetStep: number) => {
    const targets = orders.filter((o) => selectedOrderIds.includes(o.id) && o.status !== "cancelled");
    for (const order of targets) {
      await advanceOrder(order, targetStep);
    }
    setSelectedOrderIds([]);
  };

  // Compute live + baseline platform metrics
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const liveOrderRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const livePlatformMarkup = activeOrders.reduce((sum, o) => sum + calculatePlatformMarkup(o), 0);
  const codTotal = activeOrders
    .filter((o) => o.paymentMethod === "COD")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const gcashTotal = activeOrders
    .filter((o) => o.paymentMethod === "GCash")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const cardTotal = activeOrders
    .filter((o) => o.paymentMethod === "Card")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const walletTotal = activeOrders
    .filter((o) => o.paymentMethod === "ChoyWallet")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalRevenue = liveOrderRevenue;
  const totalOrdersCount = activeOrders.length;
  const totalLikes = dishes.reduce((sum, d) => sum + d.likes, 0);
  const pendingKycCount = kycRecords.filter((k) => k.status === "pending").length;
  const openTicketsCount = supportTickets.filter((t) => t.status === "open").length;

  const customerCount = allUsers.filter((u) => u.role === "customer").length;
  const riderCount = allUsers.filter((u) => u.role === "rider").length;
  const storeNamesList = Array.from(
    new Set([
      ...Object.keys(cmsSettings.storeStatuses),
      ...allDishes.map((d) => d.storeName),
      ...allUsers.filter((u) => u.role === "store").map((u) => u.storeName || u.displayName),
    ].filter(Boolean))
  );
  const openStoresCount = storeNamesList.filter(
    (name) => (cmsSettings.storeStatuses[name] || "open") === "open"
  ).length;
  const adminNotifications = notifications.filter(
    (n) => n.audience === "admin" || n.audience === "all"
  );
  const unreadAdminNotifs = adminNotifications.filter((n) => !n.read).length;
  const pendingDishes = allDishes.filter((d) => d.approvalStatus === "pending");

  const handleCleaner = async () => {
    setCleaning(true);
    try {
      await runSystemCleaner();
    } finally {
      setCleaning(false);
    }
  };

  const handleClearDemoData = async () => {
    if (!confirmWipeDemo) {
      setConfirmWipeDemo(true);
      return;
    }
    setWipingDemo(true);
    try {
      await clearOperationalDemoData();
      setConfirmWipeDemo(false);
    } finally {
      setWipingDemo(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCatalogToSupabase();
    } finally {
      setSeeding(false);
    }
  };

  const openUserEditor = (u: UserProfile) => {
    setEditingUser(u);
    setEditWallet(String(u.walletBalance ?? 0));
    setEditRole(u.role);
    setEditRiderCode(u.riderCode || "");
    setEditStoreName(u.storeName || "");
    setEditChoyPro(Boolean(u.choyProActive));
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      await updateUserAdmin(editingUser, {
        role: editRole,
        walletBalance: Math.max(0, Number(editWallet) || 0),
        choyProActive: editChoyPro,
        riderCode: editRiderCode,
        storeName: editStoreName,
      });
      setEditingUser(null);
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className="bg-[#0B1120] text-slate-100 rounded-2xl border border-[#334155] p-6 sm:p-8 lg:p-10 space-y-8">
      {/* Command Center Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[#334155] pb-6">
        <div className="space-y-1">
          <p className="text-xs font-mono text-emerald-400">
            Dashboard 1 of 5 · Super Admin Command Center · Supabase PostgreSQL RBAC
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Platform Control &amp; Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Authorized Super Admin: <span className="font-mono text-slate-200">{SUPER_ADMIN_EMAIL}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => updateCmsSettings({ soundEnabled: !cmsSettings.soundEnabled })}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-200 border border-[#334155] text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
            title="Toggle admin chime alerts"
          >
            {cmsSettings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{cmsSettings.soundEnabled ? "Sound ON" : "Muted"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-200 border border-[#334155] text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Inbox</span>
            {unreadAdminNotifs > 0 && (
              <span className="bg-[#D12D11] text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                {unreadAdminNotifs}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openAskChoy}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-700 text-amber-300 border border-[#334155] text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Choy AI</span>
          </button>

          {!isAdmin && (
            <button
              onClick={() => openAuthModal("super_admin")}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Sign in as Super Admin
            </button>
          )}
          <button
            onClick={handleSeed}
            disabled={!isAdmin || seeding}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-[#334155] text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? "animate-spin" : ""}`} />
            <span>{seeding ? "Syncing..." : "Sync Default Menu"}</span>
          </button>
          <button
            onClick={handleCleaner}
            disabled={!isAdmin || cleaning}
            className="inline-flex items-center gap-1.5 bg-[#1E293B] hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-[#334155] text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{cleaning ? "Cleaning..." : "Clear Logs"}</span>
          </button>
          <button
            onClick={handleClearDemoData}
            disabled={!isAdmin || wipingDemo}
            onBlur={() => setConfirmWipeDemo(false)}
            className="inline-flex items-center gap-1.5 bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {wipingDemo
                ? "Wiping Ledger..."
                : confirmWipeDemo
                ? "Confirm Wipe All Test Data"
                : "Clear All Demo Data"}
            </span>
          </button>
        </div>
      </header>

      {/* Admin Notification Center */}
      {isNotifOpen && (
        <section className="bg-[#111827] border border-[#334155] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Admin Notification Inbox ({adminNotifications.length})</span>
            </h2>
            <div className="flex items-center gap-3 text-xs">
              {unreadAdminNotifs > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead("admin")}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsNotifOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {adminNotifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No notifications logged yet.</p>
          ) : (
            <div className="divide-y divide-[#1E293B] max-h-60 overflow-y-auto">
              {adminNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-2.5 flex items-start justify-between gap-3 text-xs ${
                    n.read ? "opacity-65" : ""
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">
                      {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />}
                      {n.title}
                    </p>
                    <p className="text-slate-300">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                        title="Mark read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(n.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Admin Sidebar & Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Admin Sidebar Navigation */}
        <aside className="lg:col-span-1 bg-[#111827] border border-[#334155] rounded-2xl p-4 space-y-2 sticky top-20">
          <div className="px-3 py-2 border-b border-[#1E293B] pb-3 mb-1">
            <p className="font-display text-sm font-bold text-white">Admin Navigation</p>
            <p className="text-xs text-slate-400">Super Admin Control Hub</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview & Metrics", icon: LayoutDashboard },
              { id: "stores", label: `Stores & Menu (${pendingDishes.length} pending)`, icon: Store },
              { id: "riders", label: "Riders, Score & Docs", icon: Bike },
              { id: "customers", label: "Customer KYC Enforcement", icon: ShieldCheck },
              { id: "promos", label: "Setup Promo Codes", icon: Tag },
              { id: "banners", label: "Platform CMS & Banners", icon: Sliders },
              { id: "schedule", label: "Rider Schedule (Batch A, B, C)", icon: Calendar },
              { id: "brain", label: "Ask Choy AI Brain", icon: BrainCircuit },
              { id: "insights", label: "Delivery Insights (D3.js)", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = adminTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                    active
                      ? "bg-[#D12D11] text-white"
                      : "text-slate-300 hover:bg-[#1E293B]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Tab Content */}
        <main className="lg:col-span-3 space-y-8">
          {adminTab === "overview" && (
            <div className="space-y-8">

      {!isAdmin && (
        <div className="bg-[#111827] border border-amber-500/40 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Super Admin Authentication Required
              </p>
              <p className="text-xs text-slate-300">
                Sign in with your Super Admin Mobile Number &amp; PIN (or Supabase email{" "}
                <span className="font-mono text-emerald-400">{SUPER_ADMIN_EMAIL}</span>) to unlock
                Super Admin controls, KYC approvals, and wallet management.
              </p>
            </div>
          </div>
          {!isAdmin && (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => openAuthModal("super_admin")}
                className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap shrink-0"
              >
                Super Admin Sign In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Section 1: App Overview Analytics */}
      <section className="space-y-4">
        <h2 className="font-display text-base font-bold text-slate-200">App Overview Analytics &amp; Live Payment Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Lifetime Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-display text-2xl font-extrabold text-white tabular-nums">
              ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-emerald-400 pt-2 border-t border-[#334155] font-mono tabular-nums">
              Platform Markup: ₱{livePlatformMarkup.toFixed(2)}
            </p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Successful Orders</span>
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="font-display text-2xl font-extrabold text-white tabular-nums">
              {totalOrdersCount.toLocaleString()} Orders
            </p>
            <p className="text-[11px] text-emerald-400 pt-2 border-t border-[#334155] tabular-nums">
              {activeOrders.length} active · {orders.length} total live
            </p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Fleet &amp; Accounts</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <p className="font-display text-2xl font-extrabold text-white tabular-nums">
              {customerCount} Cust · {riderCount} Riders
            </p>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-[#334155] tabular-nums">
              {openStoresCount}/{storeNamesList.length} partner stores open
            </p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Dish Favorites &amp; Catalog</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <p className="font-display text-2xl font-extrabold text-white tabular-nums">
              {totalLikes.toLocaleString()} Likes
            </p>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-[#334155]">
              {dishes.length} approved · {pendingDishes.length} pending review
            </p>
          </div>
        </div>

        {/* Live Payment Method Breakdown */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#111827] border border-[#334155] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-slate-400">Total COD</span>
            <span className="font-mono font-bold text-white tabular-nums">₱{codTotal.toFixed(2)}</span>
          </div>
          <div className="bg-[#111827] border border-[#334155] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-slate-400">GCash / PayMaya</span>
            <span className="font-mono font-bold text-sky-400 tabular-nums">₱{gcashTotal.toFixed(2)}</span>
          </div>
          <div className="bg-[#111827] border border-[#334155] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-slate-400">Card / Stripe</span>
            <span className="font-mono font-bold text-emerald-400 tabular-nums">₱{cardTotal.toFixed(2)}</span>
          </div>
          <div className="bg-[#111827] border border-[#334155] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-slate-400">ChoyWallet</span>
            <span className="font-mono font-bold text-amber-300 tabular-nums">₱{walletTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Section 2: Super Admin KYC Vault (Strictly Admin Access Only) */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="font-display text-base font-bold text-white">
              Super Admin KYC Vault (Strictly Admin Access Only)
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-300 tabular-nums">
            {pendingKycCount} pending review · {kycRecords.length} total vault records
          </span>
        </div>

        {kycRecords.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            {isAdmin
              ? 'No KYC submissions in the vault yet. Click "Verify KYC" in the top bar to submit a live verification record.'
              : "Sign in as Super Admin to view encrypted customer legal names and Valid ID documents."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="py-3 px-3 font-semibold">Public Display Name</th>
                  <th className="py-3 px-3 font-semibold">Real Legal Name (Vault)</th>
                  <th className="py-3 px-3 font-semibold">Cellphone</th>
                  <th className="py-3 px-3 font-semibold">ID Document</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {kycRecords.map((rec) => (
                  <tr key={rec.uid} className="hover:bg-[#111827]/60">
                    <td className="py-3 px-3 font-semibold text-white">{rec.displayName}</td>
                    <td className="py-3 px-3 text-amber-200">{rec.realLegalName}</td>
                    <td className="py-3 px-3 font-mono tabular-nums">
                      {rec.phoneNumber} ({rec.otpVerified ? "OTP Verified" : "Pending OTP"})
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setInspectedKyc(rec)}
                        className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect {rec.idType}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 capitalize font-medium">
                      <span
                        className={
                          rec.status === "verified"
                            ? "text-emerald-400"
                            : rec.status === "rejected"
                            ? "text-rose-400"
                            : "text-amber-300"
                        }
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => reviewKyc(rec, "verified")}
                        disabled={rec.status === "verified"}
                        className="bg-[#1F7A4C] hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewKyc(rec, "rejected")}
                        disabled={rec.status === "rejected"}
                        className="bg-slate-700 hover:bg-rose-700 disabled:opacity-40 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 3: User Directory, Roles & Choy Wallet Credits */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-4">
          <div className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-sky-400" />
            <h2 className="font-display text-base font-bold text-white">
              User Directory · Role Assignment &amp; Choy Wallet Credits
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {allUsers.length} account{allUsers.length === 1 ? "" : "s"}
          </span>
        </div>

        {allUsers.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            {isAdmin
              ? "Registered ChoyFood accounts appear here for role assignment, Choy Pro toggles, and wallet top-ups."
              : "Sign in as Super Admin to manage user roles and Choy Wallet food credits."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="py-3 px-3 font-semibold">User</th>
                  <th className="py-3 px-3 font-semibold">Role</th>
                  <th className="py-3 px-3 font-semibold">Choy Wallet</th>
                  <th className="py-3 px-3 font-semibold">Choy Pro</th>
                  <th className="py-3 px-3 font-semibold">KYC</th>
                  <th className="py-3 px-3 font-semibold text-right">Quick Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {allUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-[#111827]/60">
                    <td className="py-3 px-3">
                      <p className="font-semibold text-white">{u.displayName}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {u.uid.slice(0, 10)}…
                        {u.riderCode ? ` · Rider ${u.riderCode}` : ""}
                        {u.storeName ? ` · ${u.storeName}` : ""}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        disabled={!isAdmin}
                        onChange={(e) =>
                          updateUserAdmin(u, { role: e.target.value as UserRole })
                        }
                        aria-label={`Role for ${u.displayName}`}
                        className="bg-[#111827] border border-[#334155] text-slate-100 text-xs rounded-md px-2 py-1 capitalize focus:outline-none focus:border-sky-400"
                      >
                        {USER_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-300 tabular-nums">
                      ₱{(u.walletBalance ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => updateUserAdmin(u, { choyProActive: !u.choyProActive })}
                        disabled={!isAdmin}
                        className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                          u.choyProActive
                            ? "text-emerald-400 hover:text-emerald-300"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>{u.choyProActive ? "Active" : "Standard"}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      <span
                        className={
                          u.kycStatus === "verified"
                            ? "text-emerald-400"
                            : u.kycStatus === "pending"
                            ? "text-amber-300"
                            : "text-slate-400"
                        }
                      >
                        {u.kycStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() =>
                          updateUserAdmin(u, {
                            walletBalance: Number(((u.walletBalance ?? 0) + 200).toFixed(2)),
                          })
                        }
                        disabled={!isAdmin}
                        className="bg-[#111827] hover:bg-emerald-900/60 border border-[#334155] text-emerald-300 text-xs font-mono font-semibold px-2.5 py-1.5 rounded-md transition-colors tabular-nums"
                      >
                        +₱200
                      </button>
                      <button
                        onClick={() =>
                          updateUserAdmin(u, {
                            walletBalance: Number(((u.walletBalance ?? 0) + 500).toFixed(2)),
                          })
                        }
                        disabled={!isAdmin}
                        className="bg-[#111827] hover:bg-emerald-900/60 border border-[#334155] text-emerald-300 text-xs font-mono font-semibold px-2.5 py-1.5 rounded-md transition-colors tabular-nums"
                      >
                        +₱500
                      </button>
                      <button
                        onClick={() => openUserEditor(u)}
                        disabled={!isAdmin}
                        className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 4: Live 7-Step Order Oversight */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#334155] pb-4">
          <h2 className="font-display text-base font-bold text-white">
            Live Order Verification &amp; Dispatch Queue
          </h2>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {orders.length} live order{orders.length === 1 ? "" : "s"}
          </span>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No live orders in Supabase yet. Place an order in Customer View to inspect and verify
            Step 2 (Admin Checked).
          </p>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === orders.length && orders.length > 0}
                      onChange={handleToggleSelectAllOrders}
                      aria-label="Select all orders"
                      className="rounded border-[#334155] text-sky-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">Order #</th>
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold">Store</th>
                  <th className="py-3 px-3 font-semibold">Stage</th>
                  <th className="py-3 px-3 font-semibold text-right">Total</th>
                  <th className="py-3 px-3 font-semibold text-right">Admin Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {orders.map((order) => {
                  const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr key={order.id} className={`hover:bg-[#111827]/60 ${isSelected ? "bg-sky-950/20" : ""}`}>
                      <td className="py-3 px-3 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(order.id)}
                          aria-label={`Select order ${order.orderNumber}`}
                          className="rounded border-[#334155] text-sky-600 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">{order.customerDisplayName}</td>
                      <td className="py-3 px-3">{order.storeName}</td>
                      <td className="py-3 px-3 text-emerald-300">
                        {order.status === "cancelled"
                          ? "Cancelled"
                          : stepMeta?.label || `Step ${order.step}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-white">
                        ₱{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {order.step < 7 && order.status !== "cancelled" && isAdmin && (
                          <button
                            onClick={() => advanceOrder(order, order.step + 1)}
                            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                          >
                            Advance to Step {order.step + 1}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Floating Action Bar for Bulk Order Status Updates */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B1120] border border-sky-500/60 rounded-2xl px-6 py-3.5 shadow-2xl flex flex-wrap items-center gap-4 text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500 text-slate-950 font-bold px-2 py-0.5 rounded-full font-mono">
              {selectedOrderIds.length}
            </span>
            <span>order(s) selected</span>
          </div>
          <div className="h-4 w-px bg-[#334155] hidden sm:block" />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkAdvanceOrders(2)}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              Set Admin Checked
            </button>
            <button
              onClick={() => handleBulkAdvanceOrders(4)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              Set Rider Dispatched
            </button>
            <button
              onClick={() => handleBulkAdvanceOrders(7)}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            >
              Mark Delivered (Step 7)
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-slate-400 hover:text-white font-semibold px-2 py-1.5 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Section 5: Support, Top-Up & Rider Applications Queue */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#334155] pb-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display text-base font-bold text-white">
              Support Tickets, Wallet Top-Ups &amp; Rider Applications
            </h2>
          </div>
          <span className="text-xs font-mono text-amber-300 tabular-nums">
            {openTicketsCount} open · {supportTickets.length} total
          </span>
        </div>

        {supportTickets.length === 0 ? (
          <p className="text-xs text-slate-400 py-5 text-center">
            No support tickets, Choy Wallet top-up requests, or rider applications submitted yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#111827] text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="py-3 px-3 font-semibold">Ref #</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Requester</th>
                  <th className="py-3 px-3 font-semibold">Details</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {supportTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#111827]/60 align-top">
                    <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                      {ticket.referenceCode}
                    </td>
                    <td className="py-3 px-3 text-amber-200 whitespace-nowrap">
                      {ticket.category}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <p className="font-semibold text-white">{ticket.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{ticket.contact}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-sm leading-relaxed">
                      {ticket.message}
                    </td>
                    <td className="py-3 px-3 capitalize font-medium whitespace-nowrap">
                      <span
                        className={
                          ticket.status === "resolved" ? "text-emerald-400" : "text-amber-300"
                        }
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isAdmin && (
                        <button
                          onClick={() =>
                            resolveSupportTicket(
                              ticket,
                              ticket.status === "resolved" ? "open" : "resolved"
                            )
                          }
                          className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                            ticket.status === "resolved"
                              ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                              : "bg-[#1F7A4C] hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {ticket.status === "resolved" ? "Reopen" : "Mark Resolved"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 6: System Activity Log & Infrastructure Health */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <h3 className="font-display text-sm font-bold text-white">System Activity Log</h3>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {activityLogs.length} events
            </span>
          </div>
          {activityLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              Live audit events appear here as orders, KYC records, and store dishes are created.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#111827] border border-[#334155] rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] text-amber-300 uppercase mr-2">
                      {log.category}
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                  <button
                    onClick={() => dismissActivityLog(log.id)}
                    aria-label="Dismiss activity log entry"
                    className="text-slate-500 hover:text-rose-400 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" /> Supabase Database
              </span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
            <p className="text-xs font-mono text-white break-all">{supabaseProjectLabel}</p>
            <p className="text-xs text-slate-400">
              Row-Level Security (RLS) enabled with isolated kyc_vault table access.
            </p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-sky-400" /> Ask Choy AI Backend
              </span>
              <span className="text-emerald-400 font-semibold">Operational</span>
            </div>
            <p className="text-xs font-mono text-white">Model: gemini-4-hydrogen (Server-Side)</p>
            <p className="text-xs text-slate-400">
              All Gemini API calls execute exclusively on the Express backend.
            </p>
          </div>
        </div>
      </section>

      {/* Encrypted Valid ID Inspection Modal */}
      {inspectedKyc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#334155] rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <h3 className="font-display text-base font-bold text-white">
                  Encrypted KYC Vault Record
                </h3>
              </div>
              <button
                onClick={() => setInspectedKyc(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Public Display Name</dt>
                <dd className="font-semibold text-white">{inspectedKyc.displayName}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Real Legal Name</dt>
                <dd className="font-semibold text-amber-200">{inspectedKyc.realLegalName}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Phone Number</dt>
                <dd className="font-mono tabular-nums">{inspectedKyc.phoneNumber}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Government ID Type</dt>
                <dd>{inspectedKyc.idType}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">ID Reference Number</dt>
                <dd className="font-mono text-white">{inspectedKyc.idReference}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Profile Photo File</dt>
                <dd className="font-mono text-slate-300 truncate max-w-[200px]">
                  {inspectedKyc.profilePhotoName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Valid ID File</dt>
                <dd className="font-mono text-slate-300 truncate max-w-[200px]">
                  {inspectedKyc.validIdPhotoName}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">Fraud-Privacy Consent</dt>
                <dd className="text-emerald-400 font-semibold">
                  {inspectedKyc.privacyConsentAccepted ? "Explicitly Accepted" : "Missing"}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]">
              <button
                onClick={async () => {
                  await reviewKyc(inspectedKyc, "rejected");
                  setInspectedKyc(null);
                }}
                className="bg-slate-700 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Reject KYC
              </button>
              <button
                onClick={async () => {
                  await reviewKyc(inspectedKyc, "verified");
                  setInspectedKyc(null);
                }}
                className="bg-[#1F7A4C] hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Role, Wallet & Partner Code Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#334155] rounded-2xl max-w-md w-full p-6 space-y-5 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Edit Account · {editingUser.displayName}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">{editingUser.uid}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2 capitalize"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Choy Wallet (PHP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    step="0.01"
                    value={editWallet}
                    onChange={(e) => setEditWallet(e.target.value)}
                    className="w-full bg-[#1E293B] border border-[#334155] text-white font-mono tabular-nums rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rider Code</label>
                  <input
                    type="text"
                    maxLength={20}
                    value={editRiderCode}
                    onChange={(e) => setEditRiderCode(e.target.value)}
                    placeholder="e.g. JC389"
                    className="w-full bg-[#1E293B] border border-[#334155] text-white font-mono rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Partner Store</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    placeholder="e.g. Nanay's BBQ"
                    className="w-full bg-[#1E293B] border border-[#334155] text-white rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 bg-[#1E293B] border border-[#334155] rounded-lg px-3.5 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editChoyPro}
                  onChange={(e) => setEditChoyPro(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-slate-200 font-medium">
                  Choy Pro Active (1-Month Unlimited Free Delivery)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {savingUser ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            </div>
          )}

          {adminTab === "stores" && (
            <div className="space-y-6">
              <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Store Operating Status &amp; Permits Control</h2>
                  <p className="text-xs text-slate-400">
                    Toggle partner stores Open, Closed, or Coming Soon and verify DTI, BIR, Mayor&apos;s, and Sanitary permits.
                  </p>
                </div>

                <div className="space-y-4">
                  {storeNamesList.map((storeName) => {
                    const status: StoreOperatingStatus = cmsSettings.storeStatuses[storeName] || "open";
                    const permits: StorePermitChecklist = cmsSettings.storePermits[storeName] || {
                      dti: false,
                      bir: false,
                      mayors: false,
                      sanitary: false,
                    };
                    return (
                      <div
                        key={storeName}
                        className="p-4 rounded-xl bg-[#1E293B] border border-[#334155] space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="font-bold text-white text-sm">{storeName}</p>
                          <div className="flex items-center gap-1.5">
                            {(["open", "closed", "coming_soon"] as StoreOperatingStatus[]).map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => setStoreStatus(storeName, st)}
                                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                                  status === st
                                    ? st === "open"
                                      ? "bg-emerald-600 text-white"
                                      : st === "closed"
                                      ? "bg-rose-600 text-white"
                                      : "bg-amber-600 text-white"
                                    : "bg-[#0B1120] text-slate-400 hover:text-white border border-[#334155]"
                                }`}
                              >
                                {st.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#334155]">
                          <span className="text-slate-400 mr-1">Permits:</span>
                          {(["dti", "bir", "mayors", "sanitary"] as (keyof StorePermitChecklist)[]).map((pk) => (
                            <button
                              key={pk}
                              type="button"
                              disabled={!isAdmin}
                              onClick={() => setStorePermit(storeName, pk, !permits[pk])}
                              className={`px-2.5 py-1 rounded-md font-mono uppercase text-[11px] font-bold border ${
                                permits[pk]
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                  : "bg-[#0B1120] border-[#334155] text-slate-400"
                              }`}
                            >
                              {pk} {permits[pk] ? "✓" : "○"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Store Menu Dish Approval Queue & Admin Markup Pricing */}
              <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">Store Menu Dish Approval &amp; Markup Queue</h3>
                    <p className="text-xs text-slate-400">
                      Dishes or price updates posted by stores stay hidden from customers until Admin sets any markup price and approves them.
                    </p>
                  </div>
                  <span className="font-mono text-xs text-amber-300">
                    {pendingDishes.length} pending
                  </span>
                </div>

                <div className="divide-y divide-[#334155] border border-[#334155] rounded-xl overflow-hidden bg-[#1E293B]">
                  {[...allDishes]
                    .sort((a, b) => {
                      const rank = (s?: string) => (s === "pending" ? 0 : s === "rejected" ? 2 : 1);
                      return rank(a.approvalStatus) - rank(b.approvalStatus);
                    })
                    .map((d) => {
                      const approval = d.approvalStatus || "approved";
                      const storeBasePrice = d.storePrice ?? d.price;
                      const savedMarkup = d.adminMarkup ?? 0;
                      const draftVal =
                        dishMarkupDrafts[d.id] ?? (savedMarkup > 0 ? String(savedMarkup) : "");
                      const parsedMarkup = Math.max(0, Math.round((Number(draftVal) || 0) * 100) / 100);
                      const customerPrice = Math.round((storeBasePrice + parsedMarkup) * 100) / 100;
                      const markupChanged = parsedMarkup !== savedMarkup;
                      return (
                        <div key={d.id} className="p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white flex flex-wrap items-center gap-2">
                              <span>{d.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                                  approval === "approved"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : approval === "rejected"
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {approval}
                              </span>
                            </p>
                            <p className="text-slate-400">
                              {d.storeName} · {d.saleGroup} · Store Price:{" "}
                              <span className="font-mono text-slate-200">₱{storeBasePrice.toFixed(2)}</span>
                              {" · "}Customer Price:{" "}
                              <span className="font-mono font-bold text-amber-300">₱{customerPrice.toFixed(2)}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <label className="flex items-center gap-1.5 bg-[#0B1120] border border-[#334155] rounded-lg px-2.5 py-1 text-slate-300">
                              <span className="text-[11px] text-slate-400">+Markup ₱</span>
                              <input
                                type="number"
                                min={0}
                                max={10000}
                                step="1"
                                disabled={!isAdmin}
                                value={draftVal}
                                placeholder="0"
                                onChange={(e) =>
                                  setDishMarkupDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                                }
                                aria-label={`Admin markup for ${d.name}`}
                                className="w-16 bg-transparent text-white font-mono text-right focus:outline-none tabular-nums"
                              />
                            </label>
                            <button
                              type="button"
                              disabled={!isAdmin || (approval === "approved" && !markupChanged)}
                              onClick={() => approveDish(d.id, "approved", parsedMarkup)}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
                            >
                              {approval === "approved" ? "Update Markup" : "Approve & Post"}
                            </button>
                            <button
                              type="button"
                              disabled={!isAdmin || approval === "rejected"}
                              onClick={() => approveDish(d.id, "rejected", parsedMarkup)}
                              className="bg-slate-700 hover:bg-rose-600 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {adminTab === "riders" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Rider Fleet, Score Adjuster &amp; Clearances</h2>
                <p className="text-xs text-slate-400">
                  Adjust rider performance scores (+1 / -1) to determine Batch A / B / C shift priority and inspect submitted documents.
                </p>
              </div>
              <div className="divide-y divide-[#334155] border border-[#334155] rounded-xl overflow-hidden bg-[#1E293B]">
                {allUsers.filter((u) => u.role === "rider").length === 0 ? (
                  <p className="p-4 text-xs text-slate-400">No delivery riders registered yet.</p>
                ) : (
                  allUsers
                    .filter((u) => u.role === "rider")
                    .map((u) => {
                      const scorePts = Math.round((u.ratingScore ?? 4.7) * 20);
                      const batch = scorePts >= 85 ? "Batch A" : scorePts >= 75 ? "Batch B" : "Batch C";
                      const docs = riderDocsByUid[u.uid];
                      const riderCompleted = orders.filter(
                        (o) => o.status === "delivered" && (o.riderId === u.uid || o.riderCode === u.riderCode)
                      );
                      const payoutEarned = riderCompleted.reduce(
                        (sum, o) => sum + calculateHiddenRiderPayout(o),
                        0
                      );
                      return (
                        <div key={u.uid} className="p-4 space-y-3 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-white text-sm">
                                {u.displayName}{" "}
                                <span className="font-mono text-emerald-400">({u.riderCode || "JC389"})</span>
                              </p>
                              <p className="text-slate-400 font-mono">
                                Score: {scorePts}/100 ({batch}) · Payouts: ₱{payoutEarned.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => adjustRiderScore(u, -1)}
                                className="bg-[#0B1120] hover:bg-rose-700 border border-[#334155] text-white font-mono font-bold px-3 py-1.5 rounded-lg"
                              >
                                -1 Score
                              </button>
                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => adjustRiderScore(u, 1)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold px-3 py-1.5 rounded-lg"
                              >
                                +1 Score
                              </button>
                            </div>
                          </div>
                          {docs && (
                            <div className="p-3 rounded-lg bg-[#0B1120] border border-[#334155] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                              <span>Legal: <strong className="text-white">{docs.legalFullName}</strong></span>
                              <span>License: <strong className="font-mono text-amber-300">{docs.licenseNumber || "N/A"}</strong></span>
                              <span>Plate: <strong className="font-mono text-emerald-300">{docs.plateNumber || "N/A"}</strong></span>
                              <span>Brgy Clr: {docs.barangayClearanceRef || "Pending"}</span>
                              <span>Police Clr: {docs.policeClearanceRef || "Pending"}</span>
                              <span>OR/CR: {docs.orCrNumber || "Pending"}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {adminTab === "customers" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Customer Accounts &amp; KYC Anti-Scam Enforcement</h2>
                <p className="text-xs text-slate-400">Customers can browse freely, but must have verified KYC to place orders, preventing fake bookings and scams.</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                <p className="font-bold">Zero-Tolerance Scam Policy</p>
                <p>Unverified customer accounts are strictly blocked from placing food or delivery orders until Super Admin approves their government valid ID vault record.</p>
              </div>
              <div className="divide-y divide-[#1E293B] border border-[#334155] rounded-xl overflow-hidden bg-[#1E293B]">
                {kycRecords.map((k) => (
                  <div key={k.uid} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-white text-sm">{k.displayName} ({k.realLegalName})</p>
                      <p className="text-slate-400 font-mono">Phone: {k.phoneNumber} · ID: {k.idType} ({k.idReference})</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md font-bold uppercase ${k.status === "verified" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {k.status}
                      </span>
                      {k.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => reviewKyc(k, "verified")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Approve KYC
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "promos" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Setup &amp; Manage Promo Codes</h2>
                <p className="text-xs text-slate-400">Create new promo vouchers or pause/reactivate existing codes live.</p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await createPromoCode({
                    code: newPromoCode,
                    discount: Number(newPromoDiscount) || 25,
                    minSpend: Number(newPromoMinSpend) || 200,
                    description: newPromoDesc || `₱${newPromoDiscount} OFF on orders ₱${newPromoMinSpend}+`,
                  });
                  if (ok) {
                    setNewPromoCode("");
                    setNewPromoDesc("");
                  }
                }}
                className="p-4 rounded-xl bg-[#1E293B] border border-[#334155] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end"
              >
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Promo Code</label>
                  <input
                    type="text"
                    required
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    placeholder="CHOY30"
                    className="w-full bg-[#0B1120] border border-[#334155] text-white font-mono px-3 py-2 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discount (₱)</label>
                  <input
                    type="number"
                    min={5}
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#334155] text-white font-mono px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Spend (₱)</label>
                  <input
                    type="number"
                    min={0}
                    value={newPromoMinSpend}
                    onChange={(e) => setNewPromoMinSpend(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#334155] text-white font-mono px-3 py-2 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg h-[38px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Promo</span>
                </button>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={newPromoDesc}
                    onChange={(e) => setNewPromoDesc(e.target.value)}
                    placeholder="Description (e.g. Weekend Fiesta ₱30 Off)"
                    className="w-full bg-[#0B1120] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg"
                  />
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {allPromos.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-[#1E293B] border border-[#334155] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400 text-sm">{p.code}</span>
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => togglePromoActive(p)}
                        className={`px-2.5 py-0.5 rounded font-bold ${
                          p.active
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {p.active ? "Active" : "Paused"}
                      </button>
                    </div>
                    <p className="text-slate-300">{p.description}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      ₱{p.discount} OFF · Min. Spend ₱{p.minSpend}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "banners" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Platform CMS, Sliding Banners &amp; Fees Setup</h2>
                <p className="text-slate-400">
                  Configure moving marquee text, sliding campaign photos, Choy Pro monthly fee, and referral rewards.
                </p>
              </div>

              <div className="p-5 bg-[#1E293B] border border-[#334155] rounded-xl space-y-4">
                <div>
                  <label className="block font-semibold text-white mb-1">Moving Marquee Banner Text</label>
                  <input
                    type="text"
                    value={draftBannerText}
                    onChange={(e) => setDraftBannerText(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#334155] text-slate-200 px-3 py-2 rounded-lg font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Customer Referral Bonus (₱)</label>
                    <input
                      type="number"
                      value={draftRefCust}
                      onChange={(e) => setDraftRefCust(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Rider Referral Bonus (₱)</label>
                    <input
                      type="number"
                      value={draftRefRider}
                      onChange={(e) => setDraftRefRider(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Choy Pro Monthly Fee (₱)</label>
                    <input
                      type="number"
                      value={draftProFee}
                      onChange={(e) => setDraftProFee(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => {
                    updateCmsSettings({
                      bannerText: draftBannerText,
                      referralBonusCustomer: Math.max(0, Number(draftRefCust) || 50),
                      referralBonusRider: Math.max(0, Number(draftRefRider) || 150),
                      choyProMonthlyFee: Math.max(49, Number(draftProFee) || 149),
                    });
                    pushToast("CMS Saved", "Marquee banner & platform bonus rates updated.", "success");
                  }}
                  className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Save CMS Settings
                </button>
              </div>

              {/* Sliding Photo Carousel Editor */}
              <div className="p-5 bg-[#1E293B] border border-[#334155] rounded-xl space-y-4">
                <h3 className="font-display text-sm font-bold text-white">Sliding Photo Carousel ({cmsSettings.slides.length} slides)</h3>
                <div className="space-y-2.5">
                  {cmsSettings.slides.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 bg-[#0B1120] border border-[#334155] p-3 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={s.imageUrl} alt={s.caption} className="w-12 h-9 rounded object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{s.caption}</p>
                          <p className="text-amber-300 font-mono text-[11px]">{s.promoCode || "No code"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!isAdmin || cmsSettings.slides.length <= 1}
                        onClick={() =>
                          updateCmsSettings({
                            slides: cmsSettings.slides.filter((item) => item.id !== s.id),
                          })
                        }
                        className="text-slate-400 hover:text-rose-400 disabled:opacity-30 p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#334155]">
                  <input
                    type="text"
                    value={newSlideCaption}
                    onChange={(e) => setNewSlideCaption(e.target.value)}
                    placeholder="New slide caption..."
                    className="bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg"
                  />
                  <select
                    value={newSlideImg}
                    onChange={(e) => setNewSlideImg(e.target.value)}
                    className="bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg"
                  >
                    <option value={HERO_FEAST_IMAGE}>Fiesta Feast Banner</option>
                    <option value={DISH_IMAGES.lechonKawali}>Lechon Kawali</option>
                    <option value={DISH_IMAGES.sizzlingSisig}>Sizzling Sisig</option>
                    <option value={DISH_IMAGES.crispyPata}>Crispy Pata</option>
                    <option value={DISH_IMAGES.haloHalo}>Halo-Halo Supreme</option>
                    <option value={DISH_IMAGES.porkBbq}>Pork BBQ</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSlidePromo}
                      onChange={(e) => setNewSlidePromo(e.target.value.toUpperCase())}
                      placeholder="Code"
                      className="w-24 bg-[#0B1120] border border-[#334155] text-white font-mono px-2.5 py-2 rounded-lg uppercase"
                    />
                    <button
                      type="button"
                      disabled={!isAdmin || !newSlideCaption.trim()}
                      onClick={() => {
                        updateCmsSettings({
                          slides: [
                            ...cmsSettings.slides,
                            {
                              id: `slide-${Date.now()}`,
                              imageUrl: newSlideImg,
                              caption: newSlideCaption.trim(),
                              promoCode: newSlidePromo.trim() || undefined,
                            },
                          ],
                        });
                        setNewSlideCaption("");
                        setNewSlidePromo("");
                        pushToast("Slide Added", "Carousel slide published to Customer Hub.", "success");
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-lg"
                    >
                      Add Slide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminTab === "schedule" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Rider Shift Schedule Management (Batch A, B, C)</h2>
                <p className="text-slate-400">
                  Assign priority dispatch shifts to active riders based on their batch reliability score.
                </p>
              </div>
              <div className="divide-y divide-[#334155] border border-[#334155] rounded-xl overflow-hidden bg-[#1E293B]">
                {allUsers.filter((u) => u.role === "rider").length === 0 ? (
                  <p className="p-4 text-slate-400">No riders registered yet.</p>
                ) : (
                  allUsers
                    .filter((u) => u.role === "rider")
                    .map((r) => {
                      const scorePts = Math.round((r.ratingScore ?? 4.7) * 20);
                      const batch = scorePts >= 85 ? "Batch A" : scorePts >= 75 ? "Batch B" : "Batch C";
                      const assigned =
                        cmsSettings.riderShiftAssignments[r.uid] || "Morning Batch (6AM - 2PM)";
                      return (
                        <div key={r.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-white text-sm">
                              {r.displayName} · <span className="text-emerald-400 font-mono">{batch}</span>
                            </p>
                            <p className="text-slate-400 font-mono">Rider {r.riderCode || "UNASSIGNED"}</p>
                          </div>
                          <select
                            value={assigned}
                            disabled={!isAdmin}
                            onChange={(e) => {
                              updateCmsSettings({
                                riderShiftAssignments: {
                                  ...cmsSettings.riderShiftAssignments,
                                  [r.uid]: e.target.value,
                                },
                              });
                              pushToast("Shift Assigned", `${r.displayName} → ${e.target.value}`, "success");
                            }}
                            className="bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg"
                          >
                            <option value="Morning Batch (6AM - 2PM)">Morning Batch (6AM - 2PM)</option>
                            <option value="Afternoon Batch (2PM - 10PM)">Afternoon Batch (2PM - 10PM)</option>
                            <option value="Night Owl (10PM - 6AM)">Night Owl (10PM - 6AM)</option>
                            <option value="Full Day Double Shift">Full Day Double Shift</option>
                          </select>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {adminTab === "brain" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
              <div>
                <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-amber-400" />
                  <span>Ask Choy AI Knowledge Base &amp; Safe Math Tester</span>
                </h2>
                <p className="text-slate-400">
                  Update the custom instructions injected into Ask Choy AI and test safe math / menu lookups.
                </p>
              </div>

              <div className="p-5 bg-[#1E293B] border border-[#334155] rounded-xl space-y-3">
                <label className="block font-semibold text-white">Live AI Knowledge Base Instructions</label>
                <textarea
                  rows={4}
                  value={draftAiKnowledge}
                  onChange={(e) => setDraftAiKnowledge(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#334155] text-slate-200 p-3 rounded-lg font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => {
                    updateCmsSettings({ aiKnowledgeBase: draftAiKnowledge });
                    pushToast("AI Brain Updated", "Ask Choy AI system context saved.", "success");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Save AI Brain Context
                </button>
              </div>

              <div className="p-5 bg-[#1E293B] border border-[#334155] rounded-xl space-y-3">
                <p className="font-semibold text-white">Safe Math &amp; Catalog Price Tester</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={brainQuery}
                    onChange={(e) => setBrainQuery(e.target.value)}
                    placeholder="Try '(195 * 2) + 25' or search 'Sisig'"
                    className="flex-1 bg-[#0B1120] border border-[#334155] text-white px-3 py-2 rounded-lg font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const mathVal = evaluateMathExpression(brainQuery);
                      if (mathVal !== null) {
                        setBrainTestOutput(`Safe Math Result: ${mathVal}`);
                        return;
                      }
                      const q = brainQuery.trim().toLowerCase();
                      const found = dishes.filter(
                        (d) =>
                          d.name.toLowerCase().includes(q) || d.storeName.toLowerCase().includes(q)
                      );
                      if (found.length > 0) {
                        setBrainTestOutput(
                          found.map((d) => `${d.name} (${d.storeName}) — ₱${d.price}`).join(" | ")
                        );
                      } else {
                        setBrainTestOutput(
                          `Knowledge Match: ${cmsSettings.aiKnowledgeBase.slice(0, 180)}...`
                        );
                      }
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2 rounded-lg"
                  >
                    Test Query
                  </button>
                </div>
                {brainTestOutput && (
                  <p className="p-3 rounded-lg bg-[#0B1120] border border-[#334155] font-mono text-emerald-300">
                    {brainTestOutput}
                  </p>
                )}
              </div>
            </div>
          )}

          {adminTab === "insights" && (
            <div className="bg-[#111827] border border-[#334155] rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Delivery Insights &amp; Analytics (D3.js)</h2>
                <p className="text-xs text-slate-400">
                  Real-time visualization of daily delivery volume, peak order hours, and average delivery durations powered by D3.js.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <D3DeliveryVolumeChart orders={orders} />
                <D3PeakHoursChart orders={orders} />
              </div>
              <D3DurationChart orders={orders} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const D3DeliveryVolumeChart: React.FC<{ orders: any[] }> = ({ orders }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const countsByDay: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const d = o.createdAt ? new Date(o.createdAt) : null;
      const label = d && !Number.isNaN(d.getTime()) ? dayLabels[d.getDay()] : "Mon";
      countsByDay[label] = (countsByDay[label] || 0) + 1;
    }

    const data = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      count: countsByDay[day] || 0,
    }));

    const x = d3.scaleBand()
      .domain(data.map(d => d.day))
      .range([0, innerWidth])
      .padding(0.2);

    const maxCount = d3.max(data, d => d.count) || 0;
    const y = d3.scaleLinear()
      .domain([0, Math.max(5, maxCount)])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.day) || 0)
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.count))
      .attr("fill", "#10B981")
      .attr("rx", 4);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .style("font-size", "10px");

    svg.selectAll(".domain, .tick line").attr("stroke", "#334155");
  }, [orders]);

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 space-y-3">
      <h3 className="font-display text-sm font-bold text-white">Daily Delivery Volume (D3.js)</h3>
      <div className="overflow-x-auto">
        <svg ref={svgRef} viewBox="0 0 500 220" className="w-full h-auto" />
      </div>
    </div>
  );
};

const D3PeakHoursChart: React.FC<{ orders: any[] }> = ({ orders }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const buckets: Record<string, number> = {
      "10 AM": 0,
      "12 PM": 0,
      "2 PM": 0,
      "5 PM": 0,
      "7 PM": 0,
      "9 PM": 0,
    };

    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const d = o.createdAt ? new Date(o.createdAt) : null;
      const hr = d && !Number.isNaN(d.getTime()) ? d.getHours() : 12;
      if (hr < 11) buckets["10 AM"] += 1;
      else if (hr < 14) buckets["12 PM"] += 1;
      else if (hr < 17) buckets["2 PM"] += 1;
      else if (hr < 19) buckets["5 PM"] += 1;
      else if (hr < 21) buckets["7 PM"] += 1;
      else buckets["9 PM"] += 1;
    }

    const data = Object.entries(buckets).map(([hour, count]) => ({ hour, orders: count }));

    const x = d3.scaleBand()
      .domain(data.map(d => d.hour))
      .range([0, innerWidth])
      .padding(0.3);

    const maxPeak = d3.max(data, d => d.orders) || 0;
    const y = d3.scaleLinear()
      .domain([0, Math.max(5, maxPeak)])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d.hour) || 0)
      .attr("y", d => y(d.orders))
      .attr("width", x.bandwidth())
      .attr("height", d => innerHeight - y(d.orders))
      .attr("fill", "#F59E0B")
      .attr("rx", 4);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .style("font-size", "10px");

    svg.selectAll(".domain, .tick line").attr("stroke", "#334155");
  }, [orders]);

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 space-y-3">
      <h3 className="font-display text-sm font-bold text-white">Peak Order Times (D3.js)</h3>
      <div className="overflow-x-auto">
        <svg ref={svgRef} viewBox="0 0 500 220" className="w-full h-auto" />
      </div>
    </div>
  );
};

const D3DurationChart: React.FC<{ orders: any[] }> = ({ orders }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 220;
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const tierStats: Record<string, { sum: number; count: number }> = {
      "0-2km": { sum: 0, count: 0 },
      "2-5km": { sum: 0, count: 0 },
      "5-10km": { sum: 0, count: 0 },
    };

    for (const o of orders) {
      if (o.status !== "delivered") continue;
      const tierKey = tierStats[o.distanceTier] ? o.distanceTier : "0-2km";
      const startMs = o.createdAt ? new Date(o.createdAt).getTime() : NaN;
      const endMs = o.updatedAt ? new Date(o.updatedAt).getTime() : NaN;
      const mins =
        Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
          ? Math.max(1, Math.round((endMs - startMs) / 60000))
          : 0;
      if (mins > 0) {
        tierStats[tierKey].sum += mins;
        tierStats[tierKey].count += 1;
      }
    }

    const data = [
      {
        tier: "0-2 km",
        mins: tierStats["0-2km"].count > 0 ? Math.round(tierStats["0-2km"].sum / tierStats["0-2km"].count) : 0,
      },
      {
        tier: "2-5 km",
        mins: tierStats["2-5km"].count > 0 ? Math.round(tierStats["2-5km"].sum / tierStats["2-5km"].count) : 0,
      },
      {
        tier: "5-10 km",
        mins: tierStats["5-10km"].count > 0 ? Math.round(tierStats["5-10km"].sum / tierStats["5-10km"].count) : 0,
      },
    ];

    const y = d3.scaleBand()
      .domain(data.map(d => d.tier))
      .range([0, innerHeight])
      .padding(0.3);

    const maxMins = d3.max(data, d => d.mins) || 0;
    const x = d3.scaleLinear()
      .domain([0, Math.max(30, maxMins)])
      .nice()
      .range([0, innerWidth]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("y", d => y(d.tier) || 0)
      .attr("x", 0)
      .attr("height", y.bandwidth())
      .attr("width", d => x(d.mins))
      .attr("fill", "#3B82F6")
      .attr("rx", 4);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .style("font-size", "10px");

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "#94A3B8")
      .style("font-size", "10px");

    svg.selectAll(".domain, .tick line").attr("stroke", "#334155");
  }, [orders]);

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 space-y-3">
      <h3 className="font-display text-sm font-bold text-white">Average Delivery Duration by Distance Tier (Mins)</h3>
      <div className="overflow-x-auto">
        <svg ref={svgRef} viewBox="0 0 500 220" className="w-full h-auto" />
      </div>
    </div>
  );
};

