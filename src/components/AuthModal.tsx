import React, { useEffect, useState } from "react";
import { useChoyFood } from "../context/SupabaseContext";
import { SUPER_ADMIN_EMAIL } from "../lib/supabase";
import { UserRole } from "../types/choyfood";
import { ChoyBrandBadge } from "./ChoyBrandBadge";
import {
  BadgeCheck,
  Bike,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";

interface AuthModalProps {
  onAuthenticated?: (role: UserRole) => void;
}

type PrivilegedMethod = "pin" | "email";
type StandardMethod = "signin" | "signup";
type StoreMethod = "jollibee" | "signin" | "signup";

interface MobilePinStatus {
  mode: "env" | "claimed" | "unclaimed";
  needsSetup: boolean;
  mobileHint: string | null;
}

const PARTNER_BRANCH_PRESETS = [
  "Jollibee / Centro",
  "Nanay's Sizzling & BBQ",
  "Cebu Grill Hub",
  "Sweet Corner",
];

const ROLE_OPTIONS: {
  id: UserRole;
  label: string;
  heading: string;
}[] = [
  { id: "customer", label: "Customer", heading: "CUSTOMER SIGN IN" },
  { id: "rider", label: "Rider", heading: "RIDER SIGN IN" },
  { id: "store", label: "Store", heading: "STORE SIGN IN" },
  { id: "admin", label: "Admin", heading: "ADMIN SIGN IN" },
  { id: "super_admin", label: "Super", heading: "SUPER ADMIN SIGN IN" },
];

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated }) => {
  const {
    isAuthModalOpen,
    authModalTargetRole,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    getSuperAdminStatus,
    setupSuperAdmin,
    signInSuperAdmin,
    getOpsAdminStatus,
    setupOpsAdmin,
    signInOpsAdmin,
    getJollibeeStoreStatus,
    setupJollibeeStore,
    signInJollibeeStore,
    supabaseConfigured,
  } = useChoyFood();

  const [selectedRole, setSelectedRole] = useState<UserRole>(authModalTargetRole || "customer");
  const [privilegedMethod, setPrivilegedMethod] = useState<PrivilegedMethod>("pin");
  const [standardMethod, setStandardMethod] = useState<StandardMethod>("signin");
  const [storeMethod, setStoreMethod] = useState<StoreMethod>("jollibee");

  // Mobile + PIN state (Super Admin & Admin)
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinStatus, setPinStatus] = useState<MobilePinStatus>({
    mode: "unclaimed",
    needsSetup: false,
    mobileHint: null,
  });
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Jollibee / Centro Store Branch Login state
  const [storeLoginId, setStoreLoginId] = useState("Jollibee / Centro");
  const [storePin, setStorePin] = useState("");
  const [showStorePin, setShowStorePin] = useState(false);
  const [storePinStatus, setStorePinStatus] = useState<MobilePinStatus>({
    mode: "unclaimed",
    needsSetup: false,
    mobileHint: null,
  });
  const [loadingStoreStatus, setLoadingStoreStatus] = useState(false);

  // Supabase Email + Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [riderCode, setRiderCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    setSelectedRole(authModalTargetRole || "customer");
    setPrivilegedMethod("pin");
    setStandardMethod("signin");
    setStoreMethod("jollibee");
    setErrorMsg(null);
    setInfoMsg(null);
    setPin("");
    setStorePin("");
    setPassword("");
  }, [isAuthModalOpen, authModalTargetRole]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    if (selectedRole !== "super_admin" && selectedRole !== "admin") return;

    let active = true;
    setLoadingStatus(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const statusPromise =
      selectedRole === "super_admin" ? getSuperAdminStatus() : getOpsAdminStatus();

    statusPromise
      .then((status) => {
        if (active) setPinStatus(status);
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthModalOpen, selectedRole, getSuperAdminStatus, getOpsAdminStatus]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    if (selectedRole !== "store") return;

    let active = true;
    setLoadingStoreStatus(true);
    setErrorMsg(null);
    setInfoMsg(null);

    getJollibeeStoreStatus()
      .then((status) => {
        if (active) setStorePinStatus(status);
      })
      .finally(() => {
        if (active) setLoadingStoreStatus(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthModalOpen, selectedRole, getJollibeeStoreStatus]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const isPrivilegedRole = selectedRole === "super_admin" || selectedRole === "admin";
  const isStoreJollibeeMode = selectedRole === "store" && storeMethod === "jollibee";
  const activeStandardMethod: StandardMethod =
    selectedRole === "store"
      ? storeMethod === "signup"
        ? "signup"
        : "signin"
      : standardMethod;
  const activeRoleMeta =
    ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0];

  const renderRoleIcon = (role: UserRole, className = "w-5 h-5") => {
    switch (role) {
      case "super_admin":
        return <ShieldCheck className={className} />;
      case "admin":
        return <Shield className={className} />;
      case "store":
        return <Store className={className} />;
      case "rider":
        return <Bike className={className} />;
      default:
        return <ShoppingBag className={className} />;
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setInfoMsg(null);
    setPin("");
    setStorePin("");
    setPassword("");
    if (role === "store") {
      setStoreMethod("jollibee");
    }
    if (role === "super_admin") {
      setEmail(SUPER_ADMIN_EMAIL);
    } else if (email === SUPER_ADMIN_EMAIL) {
      setEmail("");
    }
  };

  const handleMobilePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const digits = mobile.replace(/[^0-9]/g, "");
    if (digits.length < 10 || digits.length > 15) {
      setErrorMsg("Please enter a valid mobile number (10–15 digits).");
      return;
    }
    if (pin.trim().length < 6) {
      setErrorMsg("PIN must be at least 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const isSuper = selectedRole === "super_admin";
      const res = pinStatus.needsSetup
        ? isSuper
          ? await setupSuperAdmin(mobile, pin)
          : await setupOpsAdmin(mobile, pin)
        : isSuper
        ? await signInSuperAdmin(mobile, pin)
        : await signInOpsAdmin(mobile, pin);

      if (!res.ok) {
        setErrorMsg(res.error || "Authentication failed. Please check your credentials.");
        if ("needsSetup" in res && res.needsSetup) {
          setPinStatus({ mode: "unclaimed", needsSetup: true, mobileHint: null });
        }
      } else {
        setPin("");
        onAuthenticated?.(selectedRole);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJollibeeStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedId = storeLoginId.trim();
    if (trimmedId.length < 3) {
      setErrorMsg("Enter Jollibee / Centro or your registered store mobile number.");
      return;
    }
    if (storePin.trim().length < 6) {
      setErrorMsg("Store PIN / password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = storePinStatus.needsSetup
        ? await setupJollibeeStore(trimmedId, storePin)
        : await signInJollibeeStore(trimmedId, storePin);

      if (!res.ok) {
        setErrorMsg(res.error || "Unable to sign in to Jollibee / Centro.");
        if ("needsSetup" in res && res.needsSetup) {
          setStorePinStatus({ mode: "unclaimed", needsSetup: true, mobileHint: null });
        }
      } else {
        setStorePin("");
        onAuthenticated?.("store");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const isSigningIn = isPrivilegedRole || activeStandardMethod === "signin";
      if (isSigningIn) {
        const res = await signInWithEmail(email, password);
        if (!res.ok) {
          setErrorMsg(res.error || "No account found for this role or invalid password.");
        } else {
          setPassword("");
          onAuthenticated?.(selectedRole);
        }
      } else {
        if (displayName.trim().length < 2) {
          setErrorMsg("Please enter your display name (at least 2 characters).");
          return;
        }
        if (selectedRole === "store" && storeName.trim().length < 2) {
          setErrorMsg("Please enter your partner store or kitchen name.");
          return;
        }
        const safeRole: "customer" | "rider" | "store" =
          selectedRole === "store" || selectedRole === "rider" ? selectedRole : "customer";
        const res = await signUpWithEmail(email, password, displayName, safeRole, {
          storeName: safeRole === "store" ? storeName.trim() : undefined,
          riderCode: safeRole === "rider" ? riderCode.trim() || undefined : undefined,
        });
        if (!res.ok) {
          setErrorMsg(res.error || "Registration failed. Please try again.");
        } else if (res.needsVerification) {
          setInfoMsg(
            `Your ${activeRoleMeta.label} account was created! Check your email inbox to confirm your Supabase account, then sign in.`
          );
          if (selectedRole === "store") setStoreMethod("signin");
          else setStandardMethod("signin");
          setPassword("");
        } else {
          setPassword("");
          onAuthenticated?.(safeRole);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const roleTitle =
    selectedRole === "super_admin"
      ? "Super Admin"
      : selectedRole === "admin"
      ? "Admin"
      : activeRoleMeta.label;

  const envMobileVar = selectedRole === "super_admin" ? "SUPER_ADMIN_MOBILE" : "ADMIN_MOBILE";
  const envPinVar = selectedRole === "super_admin" ? "SUPER_ADMIN_PIN" : "ADMIN_PIN";

  return (
    <div className="fixed inset-0 z-50 bg-[#F3FBF6]/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Close Button */}
      <button
        type="button"
        onClick={closeAuthModal}
        aria-label="Close login screen"
        className="fixed top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-600 hover:text-stone-900 shadow-xs transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-md mx-auto py-4 space-y-5">
        {/* Centered CHOY DELIVERY Brand Lockup */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <ChoyBrandBadge size="lg" />
          <div className="space-y-0.5">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
              <span className="text-[#FF5A1F]">CHOY</span>{" "}
              <span className="text-[#114B22]">DELIVERY</span>
            </h2>
            <p className="text-sm italic text-slate-500">All What You Want</p>
          </div>
        </div>

        {/* 5-Role Segmented Bar (White Card + Vibrant Orange Active Tile) */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-stone-200/80 grid grid-cols-5 gap-1">
          {ROLE_OPTIONS.map((role) => {
            const active = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleSwitch(role.id)}
                className={`min-h-[60px] flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-[#FF5A1F] text-white shadow-sm"
                    : "text-slate-700 hover:bg-stone-50"
                }`}
              >
                {renderRoleIcon(role.id, `w-5 h-5 ${active ? "text-white" : "text-slate-600"}`)}
                <span className="truncate max-w-full leading-tight">{role.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main White Rounded Sign-In Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 space-y-5">
          {/* Card Header Row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-extrabold tracking-wide text-[#FF5A1F]">
              {isStoreJollibeeMode
                ? "JOLLIBEE / CENTRO LOGIN"
                : !isPrivilegedRole && activeStandardMethod === "signup"
                ? `CREATE ${activeRoleMeta.label.toUpperCase()} ACCOUNT`
                : activeRoleMeta.heading}
            </h3>
            <span className="text-xs font-semibold text-[#114B22] bg-[#EAF8EE] px-2.5 py-1 rounded-lg whitespace-nowrap">
              {(isPrivilegedRole && privilegedMethod === "pin") || isStoreJollibeeMode
                ? "PIN protected"
                : "Supabase Auth"}
            </span>
          </div>

          {selectedRole === "store" ? (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setStoreMethod("jollibee");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all truncate ${
                  storeMethod === "jollibee"
                    ? "bg-[#A61F09] text-white shadow-xs"
                    : "text-stone-700 hover:text-[#1C1917]"
                }`}
              >
                Jollibee / Centro
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoreMethod("signin");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  storeMethod === "signin"
                    ? "bg-white text-[#1C1917] shadow-xs"
                    : "text-stone-600 hover:text-[#1C1917]"
                }`}
              >
                Email Log in
              </button>
              <button
                type="button"
                onClick={() => {
                  setStoreMethod("signup");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  storeMethod === "signup"
                    ? "bg-[#114B22] text-white shadow-xs"
                    : "text-stone-600 hover:text-[#1C1917]"
                }`}
              >
                Register
              </button>
            </div>
          ) : (
            !isPrivilegedRole && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setStandardMethod("signin");
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    standardMethod === "signin"
                      ? "bg-white text-[#1C1917] shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStandardMethod("signup");
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    standardMethod === "signup"
                      ? "bg-[#114B22] text-white shadow-xs"
                      : "text-stone-600 hover:text-[#1C1917]"
                  }`}
                >
                  Register Directly
                </button>
              </div>
            )
          )}

          {!isPrivilegedRole && activeStandardMethod === "signup" && selectedRole === "customer" && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-xl px-3.5 py-2.5 text-[11px] text-amber-950 leading-relaxed">
              <strong>Direct Customer Registration:</strong> Register anytime to browse menus and save favorites. You must complete <strong>Verification (KYC)</strong> before placing any food order.
            </div>
          )}

          {infoMsg && (
            <div className="bg-[#EAF8EE] text-[#114B22] rounded-xl px-4 py-3 text-xs font-medium leading-relaxed">
              {infoMsg}
            </div>
          )}

          {/* Jollibee / Centro Official Store Branch Login */}
          {isStoreJollibeeMode ? (
            <form onSubmit={handleJollibeeStoreSubmit} className="space-y-4">
              <div className="bg-[#A61F09]/10 border border-[#A61F09]/25 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-[#A61F09]">
                    Jollibee / Centro · Surigao City
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Manage Jollibee menu prices, stock &amp; live kitchen orders
                  </p>
                </div>
                <Store className="w-5 h-5 text-[#A61F09] shrink-0" />
              </div>

              {storePinStatus.needsSetup ? (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
                  <p className="font-bold">First-Run Jollibee / Centro Store Setup</p>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Confirm your store login ID (e.g.{" "}
                    <span className="font-mono font-semibold">Jollibee / Centro</span> or mobile) and
                    choose a 6-character PIN to claim branch access. For Render, also set{" "}
                    <span className="font-mono font-semibold">STORE_JOLLIBEE_MOBILE</span> and{" "}
                    <span className="font-mono font-semibold">STORE_JOLLIBEE_PIN</span>.
                  </p>
                </div>
              ) : storePinStatus.mobileHint ? (
                <p className="text-xs text-slate-500">
                  Registered branch ID:{" "}
                  <span className="font-mono font-semibold text-slate-800">
                    {storePinStatus.mobileHint}
                  </span>
                </p>
              ) : null}

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  Store Login ID / Mobile Number
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={60}
                  value={storeLoginId}
                  onChange={(e) => setStoreLoginId(e.target.value)}
                  placeholder="Jollibee / Centro or 09XX XXX XXXX"
                  className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-base text-slate-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A61F09]/25 focus:border-[#A61F09]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  Branch PIN (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showStorePin ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={32}
                    autoComplete={storePinStatus.needsSetup ? "new-password" : "current-password"}
                    value={storePin}
                    onChange={(e) => setStorePin(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-stone-200 bg-white text-base text-slate-900 font-mono tracking-widest placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#A61F09]/25 focus:border-[#A61F09]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStorePin((prev) => !prev)}
                    aria-label={showStorePin ? "Hide store PIN" : "Show store PIN"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700"
                  >
                    {showStorePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-[#FEF2F2] text-[#991B1B] rounded-xl px-4 py-3 text-sm font-medium leading-snug">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || loadingStoreStatus}
                className="w-full h-12 bg-[#A61F09] hover:bg-[#8A1807] disabled:opacity-60 text-white font-bold text-base rounded-xl shadow-md shadow-red-900/20 transition-colors"
              >
                {submitting
                  ? "Verifying..."
                  : storePinStatus.needsSetup
                  ? "Save & Log in as Jollibee / Centro"
                  : "Log in as Jollibee / Centro"}
              </button>
            </form>
          ) : /* Privileged Mobile + PIN Form */
          isPrivilegedRole && privilegedMethod === "pin" ? (
            <form onSubmit={handleMobilePinSubmit} className="space-y-4">
              {pinStatus.needsSetup ? (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
                  <p className="font-bold">First-Run {roleTitle} Setup</p>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    Enter your official {roleTitle} mobile number and 6-digit PIN to claim access.
                    For Render, also set{" "}
                    <span className="font-mono font-semibold">{envMobileVar}</span> and{" "}
                    <span className="font-mono font-semibold">{envPinVar}</span>.
                  </p>
                </div>
              ) : pinStatus.mobileHint ? (
                <p className="text-xs text-slate-500">
                  Registered mobile:{" "}
                  <span className="font-mono font-semibold text-slate-800">
                    {pinStatus.mobileHint}
                  </span>
                </p>
              ) : null}

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  Username / Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-base text-slate-900 font-mono placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  PIN (6 digits)
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={32}
                    inputMode="numeric"
                    autoComplete={pinStatus.needsSetup ? "new-password" : "current-password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-stone-200 bg-white text-base text-slate-900 font-mono tracking-widest placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((prev) => !prev)}
                    aria-label={showPin ? "Hide PIN" : "Show PIN"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-[#FEF2F2] text-[#991B1B] rounded-xl px-4 py-3 text-sm font-medium leading-snug">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || loadingStatus}
                className="w-full h-12 bg-[#FF5A1F] hover:bg-[#E54B12] disabled:opacity-60 text-white font-bold text-base rounded-xl shadow-md shadow-orange-500/20 transition-colors"
              >
                {submitting
                  ? "Verifying..."
                  : pinStatus.needsSetup
                  ? `Save & Log in`
                  : "Log in"}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPrivilegedMethod("email");
                    setErrorMsg(null);
                    setInfoMsg(null);
                    if (selectedRole === "super_admin" && !email) {
                      setEmail(SUPER_ADMIN_EMAIL);
                    }
                  }}
                  className="text-xs font-semibold text-[#114B22] hover:underline"
                >
                  Use {roleTitle} Supabase Email instead
                </button>
              </div>
            </form>
          ) : (
            /* Email Sign-In / Registration Form */
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {!supabaseConfigured && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
                  Configure <strong className="font-mono">VITE_SUPABASE_URL</strong> and{" "}
                  <strong className="font-mono">VITE_SUPABASE_ANON_KEY</strong> to enable live
                  Supabase email authentication.
                </div>
              )}

              {!isPrivilegedRole && activeStandardMethod === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">Display Name</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={60}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={
                        selectedRole === "store"
                          ? "e.g. Jollibee Centro Manager"
                          : selectedRole === "rider"
                          ? "e.g. Marco Rider"
                          : "e.g. Juan Dela Cruz"
                      }
                      className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-base text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                    />
                  </div>

                  {selectedRole === "store" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700">
                        Partner Store / Kitchen Name
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {PARTNER_BRANCH_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setStoreName(preset)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              storeName === preset
                                ? "bg-[#A61F09] text-white border-[#A61F09]"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Jollibee / Centro"
                        className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-base text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                      />
                    </div>
                  )}

                  {selectedRole === "rider" && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700">
                        Rider Code (Optional)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={16}
                          value={riderCode}
                          onChange={(e) => setRiderCode(e.target.value.toUpperCase())}
                          placeholder="e.g. JC389"
                          className="w-full h-12 pl-4 pr-10 rounded-xl border border-stone-200 bg-white text-base text-slate-900 font-mono uppercase placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                        />
                        <BadgeCheck className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === "super_admin"
                      ? SUPER_ADMIN_EMAIL
                      : selectedRole === "store"
                      ? "jollibee.centro@choyfood.ph"
                      : `${selectedRole}@choyfood.ph`
                  }
                  className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-base text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={
                      isPrivilegedRole || activeStandardMethod === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-12 pl-4 pr-12 rounded-xl border border-stone-200 bg-white text-base text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-[#FEF2F2] text-[#991B1B] rounded-xl px-4 py-3 text-sm font-medium leading-snug">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-[#FF5A1F] hover:bg-[#E54B12] disabled:opacity-60 text-white font-bold text-base rounded-xl shadow-md shadow-orange-500/20 transition-colors"
              >
                {submitting
                  ? isPrivilegedRole || activeStandardMethod === "signin"
                    ? "Signing in..."
                    : "Creating account..."
                  : isPrivilegedRole || activeStandardMethod === "signin"
                  ? "Log in"
                  : `Register ${activeRoleMeta.label}`}
              </button>

              <div className="pt-1 text-center">
                {isPrivilegedRole ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPrivilegedMethod("pin");
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs font-semibold text-[#114B22] hover:underline"
                  >
                    Back to {roleTitle} Mobile + PIN
                  </button>
                ) : selectedRole === "store" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStoreMethod("jollibee");
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs font-semibold text-[#A61F09] hover:underline"
                  >
                    Log in as Jollibee / Centro Branch instead
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStandardMethod((prev) => (prev === "signin" ? "signup" : "signin"));
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className="text-xs font-semibold text-[#114B22] hover:underline"
                  >
                    {standardMethod === "signin"
                      ? `New ${activeRoleMeta.label}? Create an account`
                      : `Already have a ${activeRoleMeta.label} account? Log in`}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
