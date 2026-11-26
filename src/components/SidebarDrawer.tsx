import React, { useEffect } from "react";
import { AppView, UserRole } from "../types/choyfood";
import { useChoyFood } from "../context/SupabaseContext";
import { ChoyBrandBadge } from "./ChoyBrandBadge";
import { CustomerTab } from "./CustomerDashboard";
import { PWAInstallButton } from "./PWAInstallButton";
import {
  Award,
  Bot,
  CircleUserRound,
  Crown,
  Gamepad2,
  Gift,
  Handshake,
  Heart,
  HelpCircle,
  LayoutGrid,
  LogIn,
  LogOut,
  MessageCircle,
  Phone,
  ScrollText,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  activeCustomerTab: CustomerTab;
  onNavigateView: (view: AppView) => void;
  onNavigateCustomerTab: (tab: CustomerTab) => void;
  onOpenKyc: () => void;
}

const ROLE_DISPLAY: Record<UserRole, string> = {
  super_admin: "SUPER ADMIN",
  admin: "ADMIN",
  store: "STORE PARTNER",
  rider: "RIDER PARTNER",
  customer: "CUSTOMER",
};

const DASHBOARD_SHORTCUTS: { id: AppView; role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "super_admin", role: "super_admin", label: "1. Super Admin", icon: ShieldCheck },
  { id: "admin", role: "admin", label: "2. Admin Ops", icon: Shield },
  { id: "store", role: "store", label: "3. Store Board", icon: Store },
  { id: "rider", role: "rider", label: "4. Rider Fleet", icon: Truck },
  { id: "customer", role: "customer", label: "5. Customer Hub", icon: ShoppingBag },
];

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  activeCustomerTab,
  onNavigateView,
  onNavigateCustomerTab,
  onOpenKyc,
}) => {
  const { authUser, profile, myKycRecord, rewardsSummary, openAuthModal, openAskChoy, logout } = useChoyFood();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const displayName = profile?.displayName || authUser?.displayName || "Guest Customer";
  const initial = displayName.trim().charAt(0).toUpperCase() || "C";
  const roleLabel = profile?.role ? ROLE_DISPLAY[profile.role] : "CUSTOMER";
  const accountIdentifier =
    profile?.riderCode ||
    profile?.storeName ||
    authUser?.email ||
    (authUser ? authUser.uid.slice(0, 12) : "Not signed in");
  const contactNumber = myKycRecord?.phoneNumber || "No contact number";

  const activeDashboardRole: UserRole =
    currentView === "super_admin" ||
    currentView === "admin" ||
    currentView === "store" ||
    currentView === "rider" ||
    currentView === "customer"
      ? currentView
      : "customer";

  const menuItems: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    meta?: string;
    onClick: () => void;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard (Explore Menus)",
      icon: LayoutGrid,
      isActive: currentView === "customer" && activeCustomerTab === "explore",
      onClick: () => {
        onNavigateCustomerTab("explore");
        onClose();
      },
    },
    {
      id: "orders",
      label: "My orders",
      icon: ShoppingBag,
      isActive: currentView === "customer" && activeCustomerTab === "orders",
      onClick: () => {
        onNavigateCustomerTab("orders");
        onClose();
      },
    },
    {
      id: "rewards",
      label: "Choy Rewards",
      icon: Award,
      meta: `${rewardsSummary.availablePoints} pts`,
      isActive: currentView === "customer" && activeCustomerTab === "rewards",
      onClick: () => {
        onNavigateCustomerTab("rewards");
        onClose();
      },
    },
    {
      id: "wallet",
      label: "Choy Wallet",
      icon: Wallet,
      isActive: currentView === "customer" && activeCustomerTab === "wallet",
      onClick: () => {
        onNavigateCustomerTab("wallet");
        onClose();
      },
    },
    {
      id: "pro",
      label: "Choy Pro",
      icon: Crown,
      isActive: false,
      onClick: () => {
        onNavigateCustomerTab("wallet");
        onClose();
      },
    },
    {
      id: "promo",
      label: "Promo & Vouchers",
      icon: Tag,
      isActive: currentView === "customer" && activeCustomerTab === "promo",
      onClick: () => {
        onNavigateCustomerTab("promo");
        onClose();
      },
    },
    {
      id: "referral",
      label: "Referral",
      icon: Gift,
      isActive: currentView === "customer" && activeCustomerTab === "referrals",
      onClick: () => {
        onNavigateCustomerTab("referrals");
        onClose();
      },
    },
    {
      id: "created_name",
      label: "Created Name",
      icon: User,
      isActive: currentView === "customer" && activeCustomerTab === "created_name",
      onClick: () => {
        onNavigateCustomerTab("created_name");
        onClose();
      },
    },
    {
      id: "profile_pin",
      label: "Profile & PIN",
      icon: CircleUserRound,
      isActive: currentView === "customer" && activeCustomerTab === "profile",
      onClick: () => {
        if (!authUser) {
          onClose();
          openAuthModal(activeDashboardRole);
        } else {
          onNavigateCustomerTab("profile");
          onClose();
        }
      },
    },
    {
      id: "donation",
      label: "Donation (Choy Cares)",
      icon: Heart,
      isActive: currentView === "customer" && activeCustomerTab === "donation",
      onClick: () => {
        onNavigateCustomerTab("donation");
        onClose();
      },
    },
    {
      id: "games",
      label: "Games for Reward",
      icon: Gamepad2,
      isActive: currentView === "customer" && activeCustomerTab === "games",
      onClick: () => {
        onNavigateCustomerTab("games");
        onClose();
      },
    },
    {
      id: "ask_choy",
      label: "Ask Choy AI",
      icon: Bot,
      isActive: false,
      onClick: () => {
        onClose();
        openAskChoy();
      },
    },
    {
      id: "support",
      label: "Help & Support",
      icon: HelpCircle,
      isActive: currentView === "customer" && activeCustomerTab === "support",
      onClick: () => {
        onNavigateCustomerTab("support");
        onClose();
      },
    },
    {
      id: "contact",
      label: "Contact / call us",
      icon: MessageCircle,
      isActive: currentView === "contact",
      onClick: () => {
        onNavigateView("contact");
        onClose();
      },
    },
    {
      id: "acknowledgement",
      label: "Acknowledgement",
      icon: Handshake,
      isActive: currentView === "about",
      onClick: () => {
        onNavigateView("about");
        onClose();
      },
    },
    {
      id: "rules",
      label: "Rules and regulations",
      icon: ScrollText,
      isActive:
        currentView === "privacy" ||
        (currentView === "customer" && activeCustomerTab === "rules"),
      onClick: () => {
        onNavigateCustomerTab("rules");
        onClose();
      },
    },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-xs"
      />

      {/* Forest Green Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="CHOY DELIVERY Navigation Sidebar"
        className={`relative w-[300px] sm:w-[320px] max-w-[85vw] h-full bg-[#114B22] text-white shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Brand Row */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <ChoyBrandBadge size="sm" />
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold text-[#FF5A1F] leading-tight truncate">
                CHOY DELIVERY
              </p>
              <p className="text-xs italic text-emerald-100/75 truncate">All What You Want</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* User Identity Card */}
          <div className="bg-white/[0.08] border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3.5">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white text-[#114B22] font-display text-xl font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] font-semibold tracking-wider text-emerald-200/80 uppercase">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-emerald-100/85 pt-0.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <User className="w-3.5 h-3.5 text-emerald-200/70 shrink-0" />
                <span className="truncate font-mono text-[11px]">{accountIdentifier}</span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone className="w-3.5 h-3.5 text-emerald-200/70 shrink-0" />
                <span className="truncate">{contactNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal(activeDashboardRole);
                }}
                className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 bg-[#FF5A1F] hover:bg-[#E54B12] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authUser ? "Switch Account" : "Log In"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenKyc();
                }}
                className="min-h-[40px] inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>KYC</span>
              </button>
            </div>
          </div>

          <PWAInstallButton variant="sidebar" onActionComplete={onClose} />

          {/* Customer Hub Menu Buttons */}
          <div className="space-y-2">
            <p className="px-3 text-[11px] font-semibold text-emerald-200/75 tracking-wide">
              Customer Hub
            </p>
            <nav className="space-y-1" aria-label="Customer Hub drawer menu">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                      item.isActive
                        ? "bg-[#FF5A1F] text-white shadow-md shadow-black/15"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="inline-flex items-center gap-3.5 min-w-0">
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.meta && (
                      <span
                        className={`font-mono text-xs tabular-nums shrink-0 ${
                          item.isActive ? "text-amber-100" : "text-amber-300"
                        }`}
                      >
                        {item.meta}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 5-Dashboard Milestone Quick Switcher */}
          <div className="pt-4 border-t border-white/15 space-y-2">
            <p className="px-3 text-[11px] font-semibold text-emerald-200/75 tracking-wide">
              5-Dashboard Workspaces
            </p>
            <div className="space-y-1">
              {DASHBOARD_SHORTCUTS.map((dash) => {
                const Icon = dash.icon;
                const active = currentView === dash.id;
                return (
                  <button
                    key={dash.id}
                    type="button"
                    onClick={() => {
                      onNavigateView(dash.id);
                      onClose();
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "bg-white text-[#114B22] shadow-xs"
                        : "text-emerald-50/90 hover:bg-white/10"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{dash.label}</span>
                    </span>
                    {active && <span className="text-[10px] font-bold">Active</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Sign Out */}
        {authUser && (
          <div className="p-4 border-t border-white/10">
            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-rose-600/90 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
