import React, { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { Dish, Order, SaleGroup } from "../types/choyfood";
import { HERO_FEAST_IMAGE, ORDER_STEPS } from "../data/seedData";
import { useChoyFood } from "../context/SupabaseContext";
import { ensureSupabaseClient } from "../lib/supabase";
import { OrderStatusTracker } from "./OrderStatusTracker";
import { ChoyRewardsSection } from "./ChoyRewardsSection";
import {
  Bell,
  BookOpen,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Gamepad2,
  Heart,
  HelpCircle,
  KeyRound,
  MapPin,
  Megaphone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Trophy,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

export type CustomerTab =
  | "explore"
  | "profile"
  | "created_name"
  | "wallet"
  | "rewards"
  | "donation"
  | "games"
  | "referrals"
  | "promo"
  | "rules"
  | "orders"
  | "support";

interface CustomerDashboardProps {
  onAddToCart: (dish: Dish) => void;
  onReorderOrder: (order: Order) => void;
  onOpenKyc: () => void;
  onApplyRewardCode?: (code: string) => void;
  requestedTab?: CustomerTab;
  tabRequestSeq?: number;
  onTabChange?: (tab: CustomerTab) => void;
}

const SALE_GROUPS: ("All" | SaleGroup)[] = [
  "All",
  "Combo Meal",
  "Solo",
  "Extra",
  "Promo",
  "Good for Family",
];

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onAddToCart,
  onReorderOrder,
  onOpenKyc,
  onApplyRewardCode,
  requestedTab,
  tabRequestSeq,
  onTabChange,
}) => {
  const {
    authUser,
    profile,
    isAdmin,
    dishes,
    orders,
    likeDish,
    activateChoyPro,
    cancelOrder,
    rateOrder,
    fetchCustomerOrders,
    applyRealtimeOrderUpdate,
    promos,
    validatePromoCode,
    submitSupportTicket,
    loginWithGoogle,
    pushToast,
    cmsSettings,
    openAskChoy,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    updateCustomerProfile,
    changeUserPassword,
    donateToCampaign,
    awardGameBonusPoints,
  } = useChoyFood();

  const [inputPromoCode, setInputPromoCode] = useState("");
  const [promoCheckResult, setPromoCheckResult] = useState<{ valid: boolean; discount: number; message: string } | null>(null);
  const [verifyingPromo, setVerifyingPromo] = useState(false);

  const handleVerifyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingPromo(true);
    try {
      const result = await validatePromoCode(inputPromoCode, 300);
      setPromoCheckResult(result);
    } finally {
      setVerifyingPromo(false);
    }
  };

  const [selectedGroup, setSelectedGroup] = useState<"All" | SaleGroup>("All");
  const [selectedStore, setSelectedStore] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [activatingPro, setActivatingPro] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);

  // Sliding photo carousel & notifications panel
  const [slideIdx, setSlideIdx] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Profile customization & password update state
  const [draftDisplayName, setDraftDisplayName] = useState(profile?.displayName || "");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(profile?.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ ok: boolean; text: string } | null>(null);

  // Games for Rewards state
  const [spinning, setSpinning] = useState(false);
  const [lastSpinReward, setLastSpinReward] = useState<number | null>(null);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaAnswered, setTriviaAnswered] = useState<string | null>(null);

  // Choy Wallet Top-Up Request modal state
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [topUpGcashRef, setTopUpGcashRef] = useState("");
  const [topUpContact, setTopUpContact] = useState("");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpTicketRef, setTopUpTicketRef] = useState<string | null>(null);

  useEffect(() => {
    setDraftDisplayName(profile?.displayName || "");
    setDraftAvatarUrl(profile?.avatarUrl || "");
  }, [profile?.displayName, profile?.avatarUrl]);

  const slides = cmsSettings.slides.length > 0
    ? cmsSettings.slides
    : [
        {
          id: "fallback",
          imageUrl: HERO_FEAST_IMAGE,
          caption: "Fiesta Combo Platters, Hot From Partner Kitchens",
          promoCode: "CHOY25",
        },
      ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[slideIdx % slides.length] || slides[0];

  const customerNotifications = useMemo(
    () => notifications.filter((n) => n.audience === "customer" || n.audience === "all"),
    [notifications]
  );
  const unreadNotifCount = customerNotifications.filter((n) => !n.read).length;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      pushToast("Photo Too Large", "Please choose an image smaller than 1.5MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateCustomerProfile({
        displayName: draftDisplayName.trim() || undefined,
        avatarUrl: draftAvatarUrl.trim(),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ ok: false, text: "Passwords do not match." });
      return;
    }
    setChangingPassword(true);
    setPasswordStatus(null);
    try {
      const res = await changeUserPassword(newPassword);
      if (res.ok) {
        setPasswordStatus({ ok: true, text: "Password updated successfully." });
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordStatus({ ok: false, text: res.error || "Could not update password." });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    window.setTimeout(() => {
      const prizes = [5, 10, 15, 20, 25];
      const won = prizes[Math.floor(Math.random() * prizes.length)];
      setLastSpinReward(won);
      setSpinning(false);
      awardGameBonusPoints(won, "Choy Lucky Spin");
    }, 850);
  };

  const TRIVIA_BANK = [
    {
      q: "Which Visayas & Mindanao dish is slow-cooked pork belly fried until golden crackling?",
      options: ["Lechon Kawali", "Sinigang na Isda", "Bicol Express"],
      answer: "Lechon Kawali",
    },
    {
      q: "What is the minimum Choy Rewards point milestone for the ₱25 Off voucher?",
      options: ["50 pts", "100 pts", "250 pts"],
      answer: "100 pts",
    },
    {
      q: "Which membership unlocks ₱0 delivery fees across Choy Delivery distance tiers?",
      options: ["Choy Pro", "Batch A", "COD Express"],
      answer: "Choy Pro",
    },
  ];
  const currentTrivia = TRIVIA_BANK[triviaIndex % TRIVIA_BANK.length];

  const handleTriviaAnswer = (choice: string) => {
    if (triviaAnswered) return;
    setTriviaAnswered(choice);
    if (choice === currentTrivia.answer) {
      awardGameBonusPoints(15, "Choy Food Trivia");
    } else {
      pushToast("Nice Try!", `Correct answer: ${currentTrivia.answer}. Try the next question!`, "info");
    }
  };

  const storeOptions = useMemo(() => {
    const names = Array.from(new Set(dishes.map((d) => d.storeName).filter(Boolean)));
    names.sort((a, b) => a.localeCompare(b));
    return ["All", ...names];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    const tokens = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];

    return dishes.filter((dish) => {
      const matchesGroup = selectedGroup === "All" || dish.saleGroup === selectedGroup;
      const matchesStore = selectedStore === "All" || dish.storeName === selectedStore;
      if (!matchesGroup || !matchesStore) return false;
      if (tokens.length === 0) return true;

      const searchableText = [
        dish.name,
        dish.saleGroup,
        dish.storeName,
        dish.description,
      ]
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => searchableText.includes(token));
    });
  }, [dishes, selectedGroup, selectedStore, searchTerm]);

  const hasActiveFilters =
    selectedGroup !== "All" || selectedStore !== "All" || searchTerm.trim().length > 0;

  const resetAllFilters = () => {
    setSelectedGroup("All");
    setSelectedStore("All");
    setSearchTerm("");
  };

  // Orders belonging strictly to the signed-in customer (or all orders for Super Admin)
  const myOrders = useMemo(() => {
    if (!authUser) return [];
    if (isAdmin) return orders;
    return orders.filter((o) => o.customerId === authUser.uid);
  }, [authUser, isAdmin, orders]);

  const myActiveOrder = myOrders.find((o) => o.status !== "cancelled") || myOrders[0];

  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    "all" | "active" | "delivered" | "cancelled"
  >("all");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const filteredHistoryOrders = useMemo(() => {
    if (historyStatusFilter === "all") return myOrders;
    if (historyStatusFilter === "delivered") {
      return myOrders.filter((o) => o.status === "delivered");
    }
    if (historyStatusFilter === "cancelled") {
      return myOrders.filter((o) => o.status === "cancelled");
    }
    return myOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  }, [myOrders, historyStatusFilter]);

  const handleActivatePro = async () => {
    setActivatingPro(true);
    try {
      await activateChoyPro();
    } finally {
      setActivatingPro(false);
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(topUpAmount);
    if (!Number.isFinite(numericAmount) || numericAmount < 50) return;
    setTopUpSubmitting(true);
    try {
      const ref = await submitSupportTicket({
        fullName: profile?.displayName || authUser?.displayName || "ChoyFood Customer",
        contact: topUpContact || authUser?.email || "0917-000-0000",
        category: "Choy Wallet Top-Up Request",
        message: `Top-Up Request: ₱${numericAmount.toFixed(2)} non-withdrawable food credits · GCash Ref: ${topUpGcashRef.trim()} · Account UID: ${authUser?.uid || "guest"}`,
      });
      if (ref) {
        setTopUpTicketRef(ref);
      }
    } finally {
      setTopUpSubmitting(false);
    }
  };

  const [activeCustomerTab, setActiveCustomerTab] = useState<CustomerTab>(
    requestedTab || "explore"
  );

  useEffect(() => {
    if (requestedTab) {
      setActiveCustomerTab(requestedTab);
    }
  }, [requestedTab, tabRequestSeq]);

  const handleSelectCustomerTab = (nextTab: CustomerTab) => {
    setActiveCustomerTab(nextTab);
    onTabChange?.(nextTab);
  };

  const handleRefreshOrderHistory = async () => {
    if (!authUser) return;
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetchCustomerOrders();
      if (res.error) {
        setHistoryError(res.error);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeCustomerTab !== "orders" || !authUser) return;

    handleRefreshOrderHistory();

    let active = true;
    let activeClient: SupabaseClient | null = null;
    let activeChannel: RealtimeChannel | null = null;

    ensureSupabaseClient().then((client) => {
      if (!active || !client) return;
      activeClient = client;

      const channelConfig: {
        event: "*";
        schema: "public";
        table: "orders";
        filter?: string;
      } = {
        event: "*",
        schema: "public",
        table: "orders",
      };

      if (!isAdmin) {
        channelConfig.filter = `customer_id=eq.${authUser.uid}`;
      }

      activeChannel = client
        .channel(`customer-order-history-${authUser.uid}`)
        .on("postgres_changes", channelConfig, (payload) => {
          if (!active) return;
          if (payload.eventType === "DELETE" && payload.old) {
            applyRealtimeOrderUpdate(payload.old, "DELETE");
            return;
          }
          if (
            (payload.eventType === "INSERT" || payload.eventType === "UPDATE") &&
            payload.new
          ) {
            applyRealtimeOrderUpdate(payload.new, payload.eventType);
            if (payload.eventType === "UPDATE") {
              const nextStep = Number((payload.new as any).step || 1);
              const orderNo = String((payload.new as any).order_number || "Order");
              const label =
                nextStep >= 7
                  ? "Delivered"
                  : nextStep >= 6
                  ? "Out for Delivery"
                  : nextStep >= 5
                  ? "Ready for Pickup"
                  : nextStep >= 3
                  ? "Preparing"
                  : "Confirmed";
              pushToast(`${orderNo} Updated`, `Status is now: ${label}`, "info");
            }
          }
        })
        .subscribe();
    });

    return () => {
      active = false;
      if (activeClient && activeChannel) {
        activeClient.removeChannel(activeChannel);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCustomerTab, authUser?.uid, isAdmin]);

  return (
    <div className="space-y-8">
      {activeCustomerTab === "explore" && (
          <div className="space-y-8">
      {/* Moving Marquee Promo Banner */}
      {promoVisible && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-xl px-3.5 h-10 flex items-center justify-between gap-3 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <Megaphone className="w-4 h-4 text-[#D12D11] shrink-0" />
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap">
                {cmsSettings.bannerText}
              </div>
            </div>
          </div>
          <button
            onClick={() => setPromoVisible(false)}
            aria-label="Dismiss promo bar"
            className="text-amber-800 hover:text-amber-950 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sliding Photo Carousel Campaign Banner */}
      <section className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 h-56 sm:h-68 shadow-sm">
        <img
          src={activeSlide.imageUrl}
          alt={activeSlide.caption}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/85 via-black/50 to-black/15" />

        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev - 1 + slides.length) % slides.length)}
                aria-label="Previous campaign slide"
                className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev + 1) % slides.length)}
                aria-label="Next campaign slide"
                className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end sm:justify-center max-w-xl text-white space-y-2.5">
          {activeSlide.promoCode && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(activeSlide.promoCode || "").catch(() => {});
                pushToast("Promo Code Copied", `Code ${activeSlide.promoCode} ready for checkout!`, "success");
              }}
              className="w-fit inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-extrabold px-2.5 py-1 rounded-md transition-colors"
              title="Tap to copy promo code"
            >
              <Tag className="w-3 h-3" />
              <span>Code: {activeSlide.promoCode}</span>
            </button>
          )}
          <h1 className="font-display text-xl sm:text-3xl font-extrabold leading-tight">
            {activeSlide.caption}
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Subscribe to Choy Pro (₱{cmsSettings.choyProMonthlyFee}/mo) for unlimited ₱0 delivery fees across all neighborhood partner kitchens.
          </p>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                aria-label={`View slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === slideIdx % slides.length ? "w-6 bg-amber-400" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Account, Choy Wallet, Choy Pro & KYC Status Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs text-stone-500">Choy Wallet · Non-Withdrawable</p>
            <p className="font-display text-2xl font-bold text-[#1C1917] tabular-nums">
              ₱{(profile?.walletBalance ?? 150).toFixed(2)}
            </p>
            <p className="text-xs text-stone-500">
              {authUser
                ? `Signed in as ${profile?.displayName || authUser.displayName}`
                : "Sign in to sync wallet credit"}
            </p>
          </div>
          <button
            onClick={() => {
              if (!authUser) {
                loginWithGoogle();
                return;
              }
              setTopUpTicketRef(null);
              setTopUpGcashRef("");
              setIsTopUpOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Wallet className="w-3.5 h-3.5 text-[#E08E00]" />
            <span>Top Up</span>
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-stone-500">Choy Pro Membership</p>
            <p className="font-display text-base font-bold text-[#1C1917]">
              {profile?.choyProActive ? "Active · Free Delivery Unlocked" : "1-Month Free Delivery"}
            </p>
            <p className="text-xs text-stone-500">
              {profile?.choyProActive
                ? "₱0 fee on all distance tiers"
                : `₱${cmsSettings.choyProMonthlyFee}/month · Save on every run`}
            </p>
          </div>
          {profile?.choyProActive ? (
            <CheckCircle2 className="w-6 h-6 text-[#1F7A4C] shrink-0" />
          ) : (
            <button
              onClick={authUser ? handleActivatePro : loginWithGoogle}
              disabled={activatingPro}
              className="inline-flex items-center gap-1.5 bg-[#E08E00] hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{activatingPro ? "Activating..." : "Activate Pro"}</span>
            </button>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-stone-500">Private KYC Vault Status</p>
            <p className="font-display text-base font-bold text-[#1C1917] capitalize">
              {profile?.kycStatus || "Unverified"}
            </p>
            <p className="text-xs text-stone-500">Encrypted Admin-only ID protection</p>
          </div>
          <button
            onClick={onOpenKyc}
            className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D12D11]" />
            <span>{profile?.kycStatus === "verified" ? "View Status" : "Verify KYC"}</span>
          </button>
        </div>
      </section>

      {/* Live 7-Step Order Tracker */}
      <section className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs text-stone-500">
              {myActiveOrder
                ? `Live 7-Step Order Tracking · ${myActiveOrder.orderNumber} · ${myActiveOrder.storeName}`
                : "Live 7-Step Order Tracking · Ready for your next meal"}
            </p>
            <h2 className="font-display text-lg font-bold text-[#1C1917] mt-0.5">
              {myActiveOrder
                ? myActiveOrder.status === "cancelled"
                  ? "Order Cancelled"
                  : ORDER_STEPS.find((s) => s.step === myActiveOrder.step)?.label ||
                    "Step 1: Customer Picked"
                : "Place an order from the menu to track all 7 stages live"}
            </h2>
          </div>

          {myActiveOrder && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono font-semibold text-[#1C1917] tabular-nums">
                ₱{myActiveOrder.totalAmount.toFixed(2)} · {myActiveOrder.paymentMethod}
              </span>
              {myActiveOrder.step <= 2 && myActiveOrder.status !== "cancelled" && (
                <button
                  onClick={() => cancelOrder(myActiveOrder)}
                  className="inline-flex items-center gap-1 text-stone-500 hover:text-[#D12D11] font-medium"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {ORDER_STEPS.map((s) => {
            const currentStep =
              myActiveOrder && myActiveOrder.status !== "cancelled" ? myActiveOrder.step : 0;
            const reached = currentStep >= s.step;
            return (
              <div
                key={s.step}
                className={`rounded-lg py-2 px-1.5 text-center border text-xs transition-colors ${
                  reached
                    ? "bg-[#D12D11] border-[#D12D11] text-white font-semibold"
                    : "bg-stone-50 border-stone-200 text-stone-500"
                }`}
                title={s.label}
              >
                <span className="font-mono tabular-nums">{s.step}.</span>{" "}
                <span className="hidden sm:inline">{s.shortLabel}</span>
              </div>
            );
          })}
        </div>

        {myActiveOrder?.proofOfDeliveryNote && (
          <p className="text-xs text-[#1F7A4C] font-medium">
            Proof of Delivery verified: {myActiveOrder.proofOfDeliveryNote}
          </p>
        )}
      </section>

      {/* Real-Time Search, Category & Store Filter Toolbar */}
      <section className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search dishes by name, category, or store"
                placeholder="Search by dish name, category (e.g. Combo Meal), or store..."
                className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
              <div className="relative flex-1 lg:w-56">
                <Store className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  aria-label="Filter by partner store"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                >
                  {storeOptions.map((store) => (
                    <option key={store} value={store}>
                      {store === "All" ? "All Partner Stores" : store}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={openAskChoy}
                className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#D12D11] text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors whitespace-nowrap shrink-0"
                title="Open Ask Choy AI Assistant"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Ask Choy AI</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                aria-label="Customer notifications"
                className="relative inline-flex items-center justify-center w-10 h-10 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl transition-colors shrink-0"
                title="Order Alerts & Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D12D11] text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {isNotifOpen && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <p className="font-display text-sm font-bold text-[#1C1917]">
                  Customer Alerts &amp; Updates ({customerNotifications.length})
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead("customer")}
                      className="text-[#1F7A4C] hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {customerNotifications.length === 0 ? (
                <p className="text-xs text-stone-500 py-3 text-center">
                  No alerts yet. Order status updates and promo notices appear here.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
                  {customerNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2.5 flex items-start justify-between gap-3 text-xs ${
                        n.read ? "opacity-70" : ""
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#1C1917]">
                          {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-[#D12D11] mr-1.5" />}
                          {n.title}
                        </p>
                        <p className="text-stone-600">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => markNotificationRead(n.id)}
                            className="p-1 text-[#1F7A4C] hover:bg-emerald-50 rounded"
                            title="Mark read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
              {SALE_GROUPS.map((group) => {
                const active = selectedGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? "bg-[#D12D11] text-white shadow-xs"
                        : "text-stone-600 hover:text-[#1C1917]"
                    }`}
                  >
                    {group === "All" ? "All Categories" : group}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-stone-500 shrink-0">
                <span className="tabular-nums">
                  {filteredDishes.length} of {dishes.length} dish
                  {dishes.length === 1 ? "" : "es"}
                </span>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[#D12D11] hover:underline font-semibold"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Uniform 3-Column Storefront Product Grid */}
        {filteredDishes.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-white border border-stone-200 rounded-2xl p-10 sm:p-12 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <p className="font-display text-lg font-bold text-[#1C1917]">No results found</p>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              {searchTerm.trim()
                ? `We couldn't find any dishes matching "${searchTerm.trim()}"`
                : "No dishes match the selected category or store filter"}
              {selectedGroup !== "All" ? ` in ${selectedGroup}` : ""}
              {selectedStore !== "All" ? ` from ${selectedStore}` : ""}. Try a different keyword or
              reset your filters.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={resetAllFilters}
                className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                Show All Dishes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <article
                key={dish.id}
                className="group bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
              >
                <div>
                  <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <button
                      onClick={() => likeDish(dish)}
                      aria-label={`Favorite ${dish.name}`}
                      className="absolute top-3 right-3 bg-white/95 hover:bg-white text-stone-600 hover:text-[#D12D11] p-2 rounded-lg border border-stone-200 transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-2">
                    <p className="text-xs text-stone-500">
                      {dish.storeName} · {dish.saleGroup}
                    </p>
                    <h3 className="font-display text-base font-bold text-[#1C1917] leading-snug">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                      {dish.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-extrabold text-[#D12D11] tabular-nums">
                      ₱{dish.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-stone-500 tabular-nums">{dish.likes} favorites</p>
                  </div>
                  <button
                    onClick={() => onAddToCart(dish)}
                    className="inline-flex items-center gap-1.5 bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Recent Orders & 1-Click Reorder */}
      {myOrders.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Recent Orders &amp; Quick Reorder
              </h2>
              <p className="text-xs text-stone-500">
                Reload any previous neighborhood order into your Food Saver Bag in one click
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500 tabular-nums">
              {myOrders.length} order{myOrders.length === 1 ? "" : "s"}
            </span>
          </div>

           <div className="divide-y divide-stone-100">
            {myOrders.slice(0, 6).map((order) => {
              const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
              return (
                <div key={order.id} className="py-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-mono text-xs font-bold text-[#1C1917]">
                        {order.orderNumber} · {order.storeName} ·{" "}
                        <span
                          className={
                            order.status === "cancelled"
                              ? "text-stone-500"
                              : order.status === "delivered"
                              ? "text-[#1F7A4C]"
                              : "text-[#D12D11]"
                          }
                        >
                          {order.status === "cancelled" ? "Cancelled" : stepMeta?.shortLabel}
                        </span>
                      </p>
                      <p className="text-xs text-stone-600">
                        {order.items.map((item) => `${item.qty}x ${item.name}`).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-sm font-bold text-[#1C1917] tabular-nums">
                        ₱{order.totalAmount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onReorderOrder(order)}
                        className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-[#D12D11] text-[#1C1917] hover:text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>

                  {order.status === "delivered" && (
                    <OrderRatingWidget order={order} rateOrder={rateOrder} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
        </div>
      )}

      {activeCustomerTab === "profile" && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="border-b border-stone-200 pb-4">
              <p className="text-xs text-[#D12D11] font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Super Admin Private Vault Record (Encrypted &amp; Non-Public)
              </p>
              <h2 className="font-display text-xl font-bold text-[#1C1917] mt-1">
                Profile, Avatar &amp; Government ID Vault
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Your legal name and government ID documents are stored strictly in the Super Admin encrypted Vault and are never displayed publicly.
              </p>
            </div>

            <form onSubmit={handleSaveCustomerProfile} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-24 rounded-full bg-white border-2 border-[#D12D11] overflow-hidden flex items-center justify-center shadow-xs">
                  {draftAvatarUrl ? (
                    <img src={draftAvatarUrl} alt="Customer avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-stone-400" />
                  )}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-[#1C1917] text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Camera className="w-3.5 h-3.5 text-[#D12D11]" />
                  <span>Upload Profile Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                <input
                  type="url"
                  value={draftAvatarUrl.startsWith("data:") ? "" : draftAvatarUrl}
                  onChange={(e) => setDraftAvatarUrl(e.target.value)}
                  placeholder="Or paste avatar image URL..."
                  className="w-full text-[11px] bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="md:col-span-2 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Public Display Name</label>
                    <input
                      type="text"
                      value={draftDisplayName}
                      onChange={(e) => setDraftDisplayName(e.target.value)}
                      placeholder="Your customer display name"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-700">KYC Verification Status</p>
                    <p className="font-mono text-sm text-emerald-700 capitalize font-bold">{profile?.kycStatus || "Unverified"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-700">Email Address</p>
                    <p className="font-mono text-stone-900 truncate">{authUser?.email || "Not signed in"}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <p className="font-bold text-stone-700">Account UID</p>
                    <p className="font-mono text-stone-900 truncate">{authUser?.uid || "Guest"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onOpenKyc}
                    className="bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Open KYC / ID Vault Submission
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-60 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
                  >
                    {savingProfile ? "Saving..." : "Save Profile & Avatar"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs text-xs"
          >
            <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
              <KeyRound className="w-4 h-4 text-[#D12D11]" />
              <h3 className="font-display text-base font-bold text-[#1C1917]">Change Account Password</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>
            {passwordStatus && (
              <p className={`font-semibold ${passwordStatus.ok ? "text-[#1F7A4C]" : "text-rose-700"}`}>
                {passwordStatus.text}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeCustomerTab === "created_name" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Created Name &amp; Identity</h2>
            <p className="text-xs text-stone-500">Your primary account name on ChoyFood.</p>
          </div>
          <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs">
            <p className="font-semibold text-stone-700">Display Name: <strong className="font-mono text-[#1C1917] text-sm">{profile?.displayName || authUser?.displayName || "ChoyFood Member"}</strong></p>
            <p className="text-stone-500">This name appears on your customer orders and reviews across Surigao City &amp; Cebu City.</p>
          </div>
        </div>
      )}

      {activeCustomerTab === "wallet" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Choy Wallet Credits</h2>
            <p className="text-xs text-stone-500">Non-withdrawable food credits for instant checkout synced with Supabase.</p>
          </div>
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-amber-900 font-semibold">Live Supabase Balance</p>
              <p className="font-display text-3xl font-extrabold text-amber-950 tabular-nums">₱{(profile?.walletBalance ?? 150).toFixed(2)}</p>
              <p className="text-[11px] text-amber-800 mt-0.5">Synced securely with users/{authUser?.uid || "guest"}</p>
            </div>
            <button
              onClick={() => {
                if (!authUser) { loginWithGoogle(); return; }
                setIsTopUpOpen(true);
              }}
              className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-5 py-2.5 rounded-lg shrink-0"
            >
              Request Top-Up
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-display text-sm font-bold text-[#1C1917]">Recent Wallet Transactions</h3>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
              {myOrders.length === 0 ? (
                <div className="p-4 text-xs text-stone-500 text-center">No wallet transactions recorded yet.</div>
              ) : (
                myOrders.map((order) => (
                  <div key={order.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-[#1C1917]">
                        {order.orderNumber} · {order.storeName}
                      </p>
                      <p className="text-stone-500">
                        Paid via {order.paymentMethod} · Status: <span className="capitalize">{order.status}</span>
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#D12D11] tabular-nums">
                      -₱{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeCustomerTab === "referrals" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Referrals Program</h2>
            <p className="text-xs text-stone-500">
              Invite friends to CHOY DELIVERY and earn ₱{cmsSettings.referralBonusCustomer} per successful neighborhood order.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <p className="font-semibold text-amber-900">Total Referral Earnings</p>
              <p className="font-display text-2xl font-extrabold text-amber-950 tabular-nums">
                ₱{(profile?.referralEarnings ?? 0).toFixed(2)}
              </p>
              <p className="text-[11px] text-amber-800">Stored live in Supabase</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="font-semibold text-emerald-900">Successful Invites</p>
              <p className="font-display text-2xl font-extrabold text-emerald-950 tabular-nums">
                {profile?.referredCount ?? 0} friends
              </p>
              <p className="text-[11px] text-emerald-800">Active community members</p>
            </div>
          </div>

          <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs">
            <p className="font-semibold text-stone-700">Your Unique Referral Code &amp; Link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://choyfood.ph/ref/${profile?.referralCode || (authUser?.uid ? authUser.uid.slice(0, 8).toUpperCase() : "CHOY-99")}`}
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 font-mono text-xs text-stone-800"
              />
              <button
                type="button"
                onClick={() => {
                  const referralUrl = `https://choyfood.ph/ref/${profile?.referralCode || (authUser?.uid ? authUser.uid.slice(0, 8).toUpperCase() : "CHOY-99")}`;
                  navigator.clipboard?.writeText(referralUrl).catch(() => {});
                  pushToast("Referral Link Copied", referralUrl, "success");
                }}
                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-stone-500">
                Code: <strong className="font-mono text-stone-900">{profile?.referralCode || "CHOY-99"}</strong>
              </p>
              <p className="text-[11px] text-stone-500">
                Credits post automatically after a friend completes their first verified order.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCustomerTab === "promo" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Promos &amp; Vouchers</h2>
            <p className="text-xs text-stone-500">Active discount codes fetched directly from Supabase.</p>
          </div>

          <form onSubmit={handleVerifyPromo} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 text-xs">
            <p className="font-semibold text-amber-900">Verify &amp; Validate Promo Code against Supabase:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter code (e.g. CHOY25)"
                value={inputPromoCode}
                onChange={(e) => setInputPromoCode(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 font-mono text-xs uppercase"
              />
              <button
                type="submit"
                disabled={verifyingPromo}
                className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
              >
                {verifyingPromo ? "Checking..." : "Verify Code"}
              </button>
            </div>
            {promoCheckResult && (
              <div className={`p-3 rounded-lg text-xs ${promoCheckResult.valid ? "bg-emerald-50 border border-emerald-200 text-emerald-900" : "bg-rose-50 border border-rose-200 text-rose-900"}`}>
                <p className="font-bold">{promoCheckResult.valid ? "Valid Promo Code" : "Invalid Promo Code"}</p>
                <p>{promoCheckResult.message}</p>
              </div>
            )}
          </form>

          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold text-[#1C1917]">Active Supabase Promos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {promos.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#D12D11] text-sm">{p.code}</span>
                    <span className="bg-emerald-100 text-[#1F7A4C] px-2 py-0.5 rounded font-bold">₱{p.discount} OFF</span>
                  </div>
                  <p className="text-stone-700">{p.description}</p>
                  <p className="text-[11px] text-stone-500 font-mono">Min. Spend: ₱{p.minSpend}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeCustomerTab === "rules" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Community Rules &amp; Guidelines</h2>
            <p className="text-xs text-stone-500">Fair usage policies for customers, riders, and stores.</p>
          </div>
          <div className="space-y-3 text-xs text-stone-700 leading-relaxed">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <p className="font-bold text-[#1C1917]">1. Respectful Communication</p>
              <p>Always maintain polite communication with delivery riders and partner store staff.</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <p className="font-bold text-[#1C1917]">2. Accurate Delivery Address &amp; Contact</p>
              <p>Ensure your active phone number and delivery pin in Surigao City or Cebu City are correct so riders can deliver hot food promptly.</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <p className="font-bold text-[#1C1917]">3. Fair Cancellation Policy</p>
              <p>Orders cannot be cancelled once accepted and prepared by the partner store kitchen.</p>
            </div>
          </div>
        </div>
      )}

      {activeCustomerTab === "orders" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917]">Order History</h2>
              <p className="text-xs text-stone-500">
                View your live &amp; past Supabase orders, track delivery status, or repeat any order in one click.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {authUser && (
                <button
                  type="button"
                  onClick={handleRefreshOrderHistory}
                  disabled={loadingHistory}
                  className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-60 text-stone-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                  <span>{loadingHistory ? "Syncing..." : "Refresh"}</span>
                </button>
              )}
              <span className="bg-stone-100 font-mono text-xs font-bold text-stone-700 px-3 py-1.5 rounded-lg tabular-nums">
                {myOrders.length} Order{myOrders.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {!authUser ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <RotateCcw className="w-5 h-5" />
              </div>
              <p className="font-display text-base font-bold text-[#1C1917]">
                Sign in to view your Order History
              </p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Your previous ChoyFood orders are stored securely in Supabase. Sign in to inspect delivery statuses and repeat past meals.
              </p>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Live Active Order Realtime Status Tracker */}
              {myActiveOrder &&
                myActiveOrder.status !== "delivered" &&
                myActiveOrder.status !== "cancelled" && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-[#1C1917]">
                        Live Delivery Tracker · {myActiveOrder.orderNumber} ({myActiveOrder.storeName})
                      </h3>
                      <span className="text-[11px] font-mono text-[#1F7A4C] font-semibold">
                        Updating automatically via Supabase Realtime
                      </span>
                    </div>
                    <OrderStatusTracker order={myActiveOrder} />
                  </div>
                )}

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                  {(
                    [
                      { id: "all", label: "All Orders" },
                      { id: "active", label: "In Progress" },
                      { id: "delivered", label: "Delivered" },
                      { id: "cancelled", label: "Cancelled" },
                    ] as const
                  ).map((filterTab) => {
                    const active = historyStatusFilter === filterTab.id;
                    return (
                      <button
                        key={filterTab.id}
                        type="button"
                        onClick={() => setHistoryStatusFilter(filterTab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          active
                            ? "bg-white text-[#1C1917] shadow-xs"
                            : "text-stone-600 hover:text-[#1C1917]"
                        }`}
                      >
                        {filterTab.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-stone-500 tabular-nums">
                  Showing {filteredHistoryOrders.length} of {myOrders.length} order
                  {myOrders.length === 1 ? "" : "s"}
                </span>
              </div>

              {historyError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 font-medium">
                  Could not refresh orders from Supabase: {historyError}
                </div>
              )}

              <div className="space-y-4">
                {loadingHistory && myOrders.length === 0 ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-32 rounded-xl bg-stone-100 border border-stone-200"
                      />
                    ))}
                  </div>
                ) : filteredHistoryOrders.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <p className="font-display text-base font-bold text-[#1C1917]">
                      {myOrders.length === 0
                        ? "No previous orders yet"
                        : `No ${historyStatusFilter} orders found`}
                    </p>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      {myOrders.length === 0
                        ? "Place your first meal from Explore Menus and it will appear here with live status tracking."
                        : "Switch the status filter above to see your other orders."}
                    </p>
                    {myOrders.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setActiveCustomerTab("explore")}
                        className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Browse Menus
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHistoryStatusFilter("all")}
                        className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Show All Orders
                      </button>
                    )}
                  </div>
                ) : (
                  filteredHistoryOrders.map((order) => {
                    const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
                    const orderDate = order.createdAt
                      ? new Date(order.createdAt as any).toLocaleString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent Order";

                    return (
                      <div
                        key={order.id}
                        className="p-4 sm:p-5 rounded-xl bg-stone-50/80 border border-stone-200 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-extrabold text-[#1C1917] bg-white px-2 py-0.5 rounded border border-stone-200">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs font-semibold text-stone-800">
                                {order.storeName}
                              </span>
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  order.status === "delivered"
                                    ? "bg-emerald-100 text-[#1F7A4C]"
                                    : order.status === "cancelled"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {order.status === "cancelled"
                                  ? "Cancelled"
                                  : stepMeta?.label || order.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <strong className="text-stone-700 font-medium">{orderDate}</strong>
                              </span>
                              <span>·</span>
                              <span>
                                Payment: <span className="font-mono">{order.paymentMethod}</span>
                              </span>
                              {order.riderCode && (
                                <>
                                  <span>·</span>
                                  <span>
                                    Rider: <span className="font-mono">{order.riderCode}</span>
                                  </span>
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 self-end sm:self-center">
                            <div className="text-right">
                              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                                Total
                              </p>
                              <p className="font-mono text-sm font-bold text-[#1C1917] tabular-nums">
                                ₱{order.totalAmount.toFixed(2)}
                              </p>
                            </div>
                            {order.step <= 2 && order.status !== "cancelled" && (
                              <button
                                type="button"
                                onClick={() => cancelOrder(order)}
                                className="inline-flex items-center gap-1 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onReorderOrder(order)}
                              className="inline-flex items-center gap-1.5 bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs whitespace-nowrap"
                              title="Add all items from this order back to your cart"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Repeat Order</span>
                            </button>
                          </div>
                        </div>

                        {/* Real-Time Visual Order Status Tracker (Preparing -> Out for Delivery) */}
                        <OrderStatusTracker order={order} compact />

                        {/* Ordered Items & Delivery Address */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            Ordered Items
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {order.items.map((item, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-stone-200"
                              >
                                <span className="text-stone-800 font-medium">
                                  {item.qty}x {item.name}
                                </span>
                                <span className="font-mono text-stone-600 tabular-nums">
                                  ₱{(item.price * item.qty).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-stone-500">
                            <span className="inline-flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                              <span>{order.deliveryAddress}</span>
                            </span>
                            <span className="font-mono tabular-nums shrink-0">
                              Subtotal ₱{order.subtotal.toFixed(2)} · Delivery ₱
                              {order.deliveryFee.toFixed(2)}
                              {order.discount > 0 ? ` · Promo -₱${order.discount.toFixed(2)}` : ""}
                            </span>
                          </div>

                          {order.proofOfDeliveryNote && (
                            <p className="text-xs text-[#1F7A4C] font-medium">
                              Proof of Delivery: {order.proofOfDeliveryNote}
                            </p>
                          )}
                        </div>

                        {order.status === "delivered" && (
                          <div className="pt-2 border-t border-stone-200">
                            <OrderRatingWidget order={order} rateOrder={rateOrder} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeCustomerTab === "support" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Help &amp; Support Center</h2>
            <p className="text-xs text-stone-500">Contact ChoyFood support or submit inquiries.</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-3">
            <p className="font-semibold text-stone-800">Need immediate assistance with an active delivery?</p>
            <p className="text-stone-600">Our support team operates 24/7 across Surigao City &amp; Cebu City.</p>
            <button
              type="button"
              onClick={() =>
                pushToast(
                  "24/7 Support Hotline",
                  "Call 0936-122-3978 or email support@choyfood.ph",
                  "info"
                )
              }
              className="bg-stone-900 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Contact Support Hotline
            </button>
          </div>
        </div>
      )}

      {activeCustomerTab === "rewards" && (
        <ChoyRewardsSection
          onApplyRewardCode={onApplyRewardCode}
          onExploreMenu={() => handleSelectCustomerTab("explore")}
        />
      )}

      {activeCustomerTab === "donation" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#D12D11]" />
                <span>Choy Cares · Community Donation Drives</span>
              </h2>
              <p className="text-xs text-stone-500">
                Share a portion of your Choy Wallet food credits to support Surigao &amp; VisMin community kitchens.
              </p>
            </div>
            <span className="font-mono text-xs font-bold bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg tabular-nums">
              Wallet: ₱{(profile?.walletBalance ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cmsSettings.donationCampaigns.map((camp) => {
              const pct = Math.min(100, Math.round((camp.raisedAmount / Math.max(1, camp.goalAmount)) * 100));
              return (
                <div key={camp.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-[#1C1917]">{camp.title}</h3>
                    <p className="text-xs text-stone-600 leading-relaxed">{camp.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="font-bold text-[#1F7A4C]">
                        ₱{camp.raisedAmount.toLocaleString()} raised
                      </span>
                      <span className="text-stone-500">
                        Goal: ₱{camp.goalAmount.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1F7A4C] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-semibold text-stone-600">Donate via Choy Wallet:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 25, 50, 100].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => donateToCampaign(camp.id, amt)}
                          className="py-2 rounded-lg bg-white hover:bg-[#D12D11] text-[#1C1917] hover:text-white border border-stone-300 hover:border-[#D12D11] font-mono text-xs font-bold transition-colors tabular-nums"
                        >
                          ₱{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeCustomerTab === "games" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#D12D11]" />
                <span>Games for Rewards</span>
              </h2>
              <p className="text-xs text-stone-500">
                Play mini-games to earn bonus Choy Rewards points redeemable for ₱25–₱100 meal vouchers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectCustomerTab("rewards")}
              className="inline-flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors"
            >
              <Trophy className="w-4 h-4 text-[#E08E00]" />
              <span>View Choy Rewards Vault</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Choy Lucky Spin */}
            <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4 text-center flex flex-col justify-between">
              <div className="space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-[#D12D11] text-white flex items-center justify-center shadow-md ${spinning ? "animate-spin" : ""}`}>
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1C1917]">Choy Lucky Spin</h3>
                <p className="text-xs text-stone-600">
                  Spin the Choy wheel to win +5, +10, +15, +20, or +25 bonus Choy Rewards points!
                </p>
              </div>
              {lastSpinReward !== null && (
                <p className="font-mono text-sm font-extrabold text-[#1F7A4C]">
                  Last Spin: +{lastSpinReward} Choy Rewards pts!
                </p>
              )}
              <button
                type="button"
                onClick={handleSpinWheel}
                disabled={spinning}
                className="w-full bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-60 text-white font-bold text-xs py-3 rounded-xl transition-colors"
              >
                {spinning ? "Spinning Wheel..." : "Spin for Bonus Points"}
              </button>
            </div>

            {/* Filipino Food Trivia */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F7A4C]">Kitchen Trivia Challenge</span>
                  <span className="font-mono text-stone-500">+15 pts / correct</span>
                </div>
                <p className="font-display text-base font-bold text-[#1C1917] leading-snug">
                  {currentTrivia.q}
                </p>
                <div className="space-y-2">
                  {currentTrivia.options.map((opt) => {
                    const isPicked = triviaAnswered === opt;
                    const isCorrect = opt === currentTrivia.answer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleTriviaAnswer(opt)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                          !triviaAnswered
                            ? "bg-white hover:bg-stone-100 border-stone-300 text-stone-800"
                            : isCorrect
                            ? "bg-emerald-100 border-emerald-400 text-emerald-950"
                            : isPicked
                            ? "bg-rose-100 border-rose-300 text-rose-900"
                            : "bg-white border-stone-200 text-stone-400"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              {triviaAnswered && (
                <button
                  type="button"
                  onClick={() => {
                    setTriviaAnswered(null);
                    setTriviaIndex((prev) => prev + 1);
                  }}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 rounded-xl"
                >
                  Next Trivia Question
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Choy Wallet Top-Up Request Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1C1917]">
                  Request Choy Wallet Top-Up
                </h3>
                <p className="text-xs text-stone-500">
                  Non-withdrawable food credits · Verified by Super Admin
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topUpTicketRef ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-stone-700">
                <p className="font-display text-sm font-bold text-[#1F7A4C]">
                  Top-Up Request Logged · Ref {topUpTicketRef}
                </p>
                <p>
                  Super Admin will verify your GCash reference and credit your Choy Wallet balance
                  directly in Supabase.
                </p>
                <button
                  onClick={() => setIsTopUpOpen(false)}
                  className="mt-2 bg-[#1F7A4C] text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1.5">
                    Select Top-Up Amount (PHP)
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {["200", "500", "1000"].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setTopUpAmount(preset)}
                        className={`py-2 rounded-lg border font-mono font-semibold tabular-nums transition-colors ${
                          topUpAmount === preset
                            ? "bg-[#D12D11] border-[#D12D11] text-white"
                            : "bg-white border-stone-300 text-stone-700 hover:border-stone-500"
                        }`}
                      >
                        ₱{preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    required
                    min={50}
                    max={50000}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    GCash / Payment Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    value={topUpGcashRef}
                    onChange={(e) => setTopUpGcashRef(e.target.value)}
                    placeholder="e.g. GCASH-902184712"
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Contact Mobile / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={topUpContact}
                    onChange={(e) => setTopUpContact(e.target.value)}
                    placeholder={authUser?.email || "0917 000 0000"}
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTopUpOpen(false)}
                    className="px-4 py-2 font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={topUpSubmitting}
                    className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg"
                  >
                    {topUpSubmitting ? "Submitting..." : "Submit Top-Up Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface OrderRatingWidgetProps {
  order: Order;
  rateOrder: (order: Order, rating: number, reviewComment?: string) => Promise<void>;
}

const OrderRatingWidget: React.FC<OrderRatingWidgetProps> = ({ order, rateOrder }) => {
  const [stars, setStars] = useState(order.rating || 5);
  const [comment, setComment] = useState(order.reviewComment || "");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleRate = async () => {
    setSubmitting(true);
    try {
      await rateOrder(order, stars, comment);
      setIsEditing(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (order.rating && !isEditing) {
    return (
      <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${s <= (order.rating || 0) ? "fill-amber-400 text-amber-500" : "text-stone-300"}`}
              />
            ))}
            <span className="font-bold text-stone-800 ml-1.5">{order.rating}/5 Stars</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-[#D12D11] hover:underline font-semibold"
          >
            Edit Review
          </button>
        </div>
        {order.reviewComment && (
          <p className="text-stone-600 italic">"{order.reviewComment}"</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-amber-900">Rate your completed order:</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setStars(s)}
              className="p-0.5 text-amber-400 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-4 h-4 ${s <= stars ? "fill-amber-400 text-amber-500" : "text-stone-300"}`}
              />
            </button>
          ))}
        </div>
      </div>
      <input
        type="text"
        placeholder="Write a quick review (e.g. Delivered hot & delicious!)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#D12D11]"
        maxLength={300}
      />
      <div className="flex items-center justify-end gap-2">
        {order.rating && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-stone-500 hover:text-stone-800 px-2.5 py-1"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleRate}
          disabled={submitting}
          className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
};

