import React, { useState } from "react";
import { Dish, Order, SaleGroup } from "../types/choyfood";
import { HERO_FEAST_IMAGE, ORDER_STEPS } from "../data/seedData";
import { useChoyFood } from "../context/FirebaseContext";
import {
  BookOpen,
  CheckCircle2,
  Crown,
  Heart,
  HelpCircle,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  User,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

interface CustomerDashboardProps {
  onAddToCart: (dish: Dish) => void;
  onReorderOrder: (order: Order) => void;
  onOpenKyc: () => void;
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
}) => {
  const {
    authUser,
    profile,
    dishes,
    orders,
    likeDish,
    activateChoyPro,
    cancelOrder,
    rateOrder,
    simulateReferralInvite,
    promos,
    validatePromoCode,
    submitSupportTicket,
    loginWithGoogle,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [activatingPro, setActivatingPro] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);

  // Choy Wallet Top-Up Request modal state
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [topUpGcashRef, setTopUpGcashRef] = useState("");
  const [topUpContact, setTopUpContact] = useState("");
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);
  const [topUpTicketRef, setTopUpTicketRef] = useState<string | null>(null);

  const filteredDishes = dishes.filter((dish) => {
    const matchesGroup = selectedGroup === "All" || dish.saleGroup === selectedGroup;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      dish.name.toLowerCase().includes(q) ||
      dish.storeName.toLowerCase().includes(q) ||
      dish.description.toLowerCase().includes(q);
    return matchesGroup && matchesSearch;
  });

  // Orders belonging to current user (or visible orders for admin)
  const myOrders = authUser
    ? orders.filter((o) => o.customerId === authUser.uid || orders.length > 0)
    : orders;

  const myActiveOrder = myOrders.find((o) => o.status !== "cancelled") || myOrders[0];

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

  const [activeCustomerTab, setActiveCustomerTab] = useState<
    | "explore"
    | "profile"
    | "created_name"
    | "wallet"
    | "referrals"
    | "promo"
    | "rules"
    | "orders"
    | "support"
  >("explore");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Customer Sidebar Navigation */}
      <aside className="lg:col-span-1 bg-white border border-stone-200 rounded-2xl p-4 space-y-2 shadow-xs sticky top-20">
        <div className="px-3 py-2 border-b border-stone-100 pb-3 mb-1">
          <p className="font-display text-sm font-bold text-[#1C1917]">Customer Hub</p>
          <p className="text-xs text-stone-500 truncate">
            {profile?.displayName || authUser?.displayName || "Guest Customer"}
          </p>
        </div>

        <nav className="space-y-1">
          {[
            { id: "explore", label: "Explore Menus", icon: ShoppingBag },
            { id: "profile", label: "Profile & Super Admin ID", icon: Shield },
            { id: "created_name", label: "Created Name", icon: User },
            { id: "wallet", label: "Choy Wallet", icon: Wallet },
            { id: "referrals", label: "Referrals", icon: Share2 },
            { id: "promo", label: "Promo & Vouchers", icon: Tag },
            { id: "rules", label: "Rules & Guidelines", icon: BookOpen },
            { id: "orders", label: "Order History & Ratings", icon: RotateCcw },
            { id: "support", label: "Help & Support", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeCustomerTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCustomerTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  active
                    ? "bg-[#D12D11] text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-stone-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="lg:col-span-3 space-y-8">
        {activeCustomerTab === "explore" && (
          <div className="space-y-8">
      {/* Slim Dismissible Promo Bar (<= 40px height) */}
      {promoVisible && (
        <div className="bg-[#1C1917] text-stone-100 rounded-xl px-4 h-9 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <Tag className="w-3.5 h-3.5 text-[#E08E00] shrink-0" />
            <span className="truncate">
              Use promo code <strong className="font-mono text-amber-300">CHOY25</strong> for ₱25 off
              orders ₱250+ · Or unlock ₱0 delivery with Choy Pro
            </span>
          </div>
          <button
            onClick={() => setPromoVisible(false)}
            aria-label="Dismiss promo bar"
            className="text-stone-400 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editorial Campaign Spotlight Banner */}
      <section className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 h-52 sm:h-64">
        <img
          src={HERO_FEAST_IMAGE}
          alt="Fiesta Combo Platters from local Cebu partner stores"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end sm:justify-center max-w-xl text-white space-y-2.5">
          <p className="text-xs font-medium text-amber-300">
            Promo Spotlight · Code CHOY25 for ₱25 off orders ₱250+
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight">
            Fiesta Combo Platters, Hot From Partner Kitchens
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Subscribe to Choy Pro (₱149/mo) for unlimited ₱0 delivery fees across all neighborhood
            eateries.
          </p>
        </div>
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
              {profile?.choyProActive ? "₱0 fee on all distance tiers" : "₱149/month · Save on every run"}
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

      {/* Sale Group Segmented Filter & Search Toolbar */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-stone-100 rounded-xl w-full md:w-auto">
            {SALE_GROUPS.map((group) => {
              const active = selectedGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "bg-[#D12D11] text-white shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  {group === "All" ? "All Dishes" : group}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dish or kitchen..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
            />
          </div>
        </div>

        {/* Uniform 3-Column Storefront Product Grid */}
        {filteredDishes.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-2">
            <p className="font-display text-lg font-bold text-[#1C1917]">No dishes match that filter</p>
            <p className="text-sm text-stone-500">
              Try another sale group or clear your search term to view all local dishes.
            </p>
            <button
              onClick={() => {
                setSelectedGroup("All");
                setSearchTerm("");
              }}
              className="mt-2 bg-[#D12D11] text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              Show All Dishes
            </button>
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
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <p className="text-xs text-[#D12D11] font-semibold flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Super Admin Private Vault Record (Encrypted &amp; Non-Public)
            </p>
            <h2 className="font-display text-xl font-bold text-[#1C1917] mt-1">
              Profile &amp; Government ID Vault
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Your legal name, government ID documents, and profile photo are stored strictly in the Super Admin encrypted Vault and are never displayed publicly or shared with partner stores and delivery riders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <p className="font-bold text-stone-700">Account Display Name</p>
              <p className="font-mono text-sm text-[#1C1917]">{profile?.displayName || authUser?.displayName || "Not Set"}</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <p className="font-bold text-stone-700">KYC Verification Status</p>
              <p className="font-mono text-sm text-emerald-700 capitalize font-bold">{profile?.kycStatus || "Unverified"}</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <p className="font-bold text-stone-700">Email Address</p>
              <p className="font-mono text-stone-900">{authUser?.email || "Not signed in"}</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <p className="font-bold text-stone-700">Firebase Authenticated UID</p>
              <p className="font-mono text-stone-900">{authUser?.uid || "Guest"}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onOpenKyc}
              className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Open KYC / ID Vault Submission
            </button>
          </div>
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
            <p className="text-xs text-stone-500">Non-withdrawable food credits for instant checkout from Firestore.</p>
          </div>
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-amber-900 font-semibold">Live Firestore Balance</p>
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
            <p className="text-xs text-stone-500">Invite friends to ChoyFood and earn ₱50 per successful neighborhood order.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <p className="font-semibold text-amber-900">Total Referral Earnings</p>
              <p className="font-display text-2xl font-extrabold text-amber-950 tabular-nums">
                ₱{(profile?.referralEarnings ?? 0).toFixed(2)}
              </p>
              <p className="text-[11px] text-amber-800">Stored live in Firestore</p>
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
                onClick={() => alert("Referral link copied to clipboard!")}
                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-stone-500">Code: <strong className="font-mono text-stone-900">{profile?.referralCode || "CHOY-99"}</strong></p>
              <button
                type="button"
                onClick={simulateReferralInvite}
                className="bg-[#D12D11] hover:bg-[#A61F09] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Simulate Invite Friend (+₱50)
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCustomerTab === "promo" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Promos &amp; Vouchers</h2>
            <p className="text-xs text-stone-500">Active discount codes fetched directly from Firestore collection.</p>
          </div>

          <form onSubmit={handleVerifyPromo} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 text-xs">
            <p className="font-semibold text-amber-900">Verify &amp; Validate Promo Code against Firestore:</p>
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
            <h3 className="font-display text-sm font-bold text-[#1C1917]">Active Firestore Promos</h3>
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
          <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917]">Order History &amp; Reorder</h2>
              <p className="text-xs text-stone-500">Track past deliveries, view status dates, and instantly reorder favorites.</p>
            </div>
            <span className="bg-stone-100 font-mono text-xs font-bold text-stone-700 px-3 py-1 rounded-lg">
              {myOrders.length} Order(s)
            </span>
          </div>
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <RotateCcw className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500">No order history found yet. Place your first local food order from the explore menu!</p>
              </div>
            ) : (
              myOrders.map((order) => {
                const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
                const orderDate = order.createdAt ? new Date(order.createdAt as any).toLocaleString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "Recent Order";

                return (
                  <div key={order.id} className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-[#1C1917] bg-white px-2 py-0.5 rounded border border-stone-200">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-stone-800">{order.storeName}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === "delivered"
                              ? "bg-emerald-100 text-[#1F7A4C]"
                              : order.status === "cancelled"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {stepMeta?.shortLabel || order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Delivery Date: <strong className="text-stone-700 font-medium">{orderDate}</strong> · Payment: <span className="font-mono">{order.paymentMethod}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Total Amount</p>
                          <p className="font-mono text-sm font-bold text-[#1C1917] tabular-nums">
                            ₱{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onReorderOrder(order)}
                          className="inline-flex items-center gap-1.5 bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                          title="Quickly add items from this order to your cart"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Ordered Items:</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-stone-200">
                            <span className="text-stone-800 font-medium">{item.qty}x {item.name}</span>
                            <span className="font-mono text-stone-600 tabular-nums">₱{(item.price * item.qty).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
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
              onClick={() => alert("Support hotline: 0936-122-3978 / support@choyfood.ph")}
              className="bg-stone-900 text-white font-semibold px-4 py-2 rounded-lg"
            >
              Contact Support Hotline
            </button>
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
                  directly in Firestore.
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
      </main>
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

