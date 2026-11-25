import React, { useEffect, useState } from "react";
import { useChoyFood } from "../context/FirebaseContext";
import { DISTANCE_FEES, ORDER_STEPS } from "../data/seedData";
import { RiderOrderTracker } from "./RiderOrderTracker";
import { RiderNavigationMap } from "./RiderNavigationMap";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileBadge2,
  MapPin,
  Navigation,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";

export const RiderDashboard: React.FC = () => {
  const {
    authUser,
    profile,
    isAdmin,
    orders,
    advanceOrder,
    submitSupportTicket,
    loginWithGoogle,
    pushToast,
    updateRiderProfile,
  } = useChoyFood();

  const [countdown, setCountdown] = useState(60);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [proofPhotoName, setProofPhotoName] = useState<string>("");
  const [activeRiderTab, setActiveRiderTab] = useState<"deliveries" | "earnings" | "profile">("deliveries");

  // Rider Partner Application modal state
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [appName, setAppName] = useState("");
  const [appPhone, setAppPhone] = useState("");
  const [appVehicle, setAppVehicle] = useState<"Motorcycle" | "Bicycle / E-Bike">("Motorcycle");
  const [appBarangayRef, setAppBarangayRef] = useState("");
  const [appPoliceRef, setAppPoliceRef] = useState("");
  const [appLicenseOrCr, setAppLicenseOrCr] = useState("");
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appTicketRef, setAppTicketRef] = useState<string | null>(null);

  const riderCode = profile?.riderCode || "JC389";
  const riderScore = profile?.ratingScore ? Math.round(profile.ratingScore * 20) : 94;
  const riderBatch = riderScore >= 85 ? "Batch A" : riderScore >= 75 ? "Batch B" : "Batch C";
  const batchReason = riderScore >= 85
    ? "Assigned to Batch A (100-85 pts) due to exceptional reliability score, 100% successful handoffs, and 1st priority schedule picking."
    : riderScore >= 75
    ? "Assigned to Batch B (85-75 pts) due to consistent deliveries and solid reliability (2nd priority picking)."
    : "Assigned to Batch C (Below 75 pts) — provisional tier requiring additional on-time delivery runs to advance.";
  const batchBadgeColor = riderScore >= 85 ? "bg-emerald-500 text-white" : riderScore >= 75 ? "bg-amber-500 text-white" : "bg-rose-500 text-white";

  // Incoming unassigned orders (step 1..5, riderId empty)
  const incomingOrders = orders.filter(
    (o) =>
      !o.riderId &&
      o.step >= 1 &&
      o.step <= 5 &&
      o.status !== "cancelled" &&
      !passedIds.includes(o.id)
  );

  // Orders currently assigned to this rider (or visible to Super Admin for live operations)
  const activeDeliveries = orders.filter(
    (o) =>
      (o.riderId === authUser?.uid || (isAdmin && o.step >= 4 && o.step < 7)) &&
      o.status !== "delivered" &&
      o.status !== "cancelled"
  );

  const completedDeliveries = orders.filter((o) => o.status === "delivered");
  const todayEarnings =
    480 +
    completedDeliveries.reduce(
      (sum, o) => sum + Math.max(35, (DISTANCE_FEES[o.distanceTier]?.fee ?? 25) + 10),
      0
    );

  // 60-second rider dispatch acceptance countdown
  useEffect(() => {
    if (incomingOrders.length === 0) {
      setCountdown(60);
      return;
    }
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [incomingOrders.length]);

  const handlePassOrder = (orderId: string) => {
    setPassedIds((prev) => [...prev, orderId]);
    setCountdown(60);
    pushToast("Order Passed", "Dispatched to the next available rider in the zone.", "info");
  };

  const handleRiderApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !appPhone.trim()) return;
    setAppSubmitting(true);
    try {
      const details = [
        `Vehicle: ${appVehicle}`,
        `Barangay Clearance: ${appBarangayRef || "Ready for inspection"}`,
        `Police Clearance: ${appPoliceRef || "Ready for inspection"}`,
        `License / OR-CR: ${appLicenseOrCr || "N/A (Bicycle)"}`,
      ].join(" | ");

      const ref = await submitSupportTicket({
        fullName: appName,
        contact: appPhone,
        category: "Rider Application & Remittance",
        message: `Rider Partner Onboarding Application — ${details}`,
      });
      if (ref) {
        setAppTicketRef(ref);
      }
    } finally {
      setAppSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Rider Portal Header */}
      <section className="bg-[#1F7A4C] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs text-emerald-100 font-medium">
            Rider Partner Portal · Motorcycle &amp; Bike Fleet · Active on Duty
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
            Rider {riderCode} Dispatch Console
          </h1>
          <p className="text-sm text-emerald-50/90 max-w-xl">
            Accept incoming neighborhood batches within the 60-second window and log Proof of
            Delivery upon handoff.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                setAppTicketRef(null);
                setAppName(profile?.displayName || authUser?.displayName || "");
                setIsApplyOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-[#1F7A4C] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
            >
              <FileBadge2 className="w-3.5 h-3.5" />
              <span>Apply as Rider Partner</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="bg-black/25 border border-white/15 rounded-xl p-4 space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between">
              <p className="text-xs text-emerald-100">Performance Tier</p>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${batchBadgeColor}`}>
                {riderBatch}
              </span>
            </div>
            <p className="font-display text-2xl font-black tabular-nums">{riderScore} <span className="text-xs font-normal text-emerald-100">/ 100 pts</span></p>
            <p className="text-[11px] text-emerald-50/80 leading-snug">{batchReason}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-black/20 border border-white/15 rounded-xl p-4 shrink-0">
            <div>
              <p className="text-xs text-emerald-100">Remittance Due</p>
              <p className="font-display text-xl font-bold tabular-nums">₱120.00</p>
            </div>
            <div className="border-l border-white/15 pl-3">
              <p className="text-xs text-emerald-100">Today&apos;s Earnings</p>
              <p className="font-display text-xl font-bold text-amber-300 tabular-nums">
                ₱{todayEarnings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!authUser && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-[#1C1917]">Sign in to accept live deliveries</p>
            <p className="text-xs text-stone-500">
              Authenticate with Google (Super Admin or Rider account) to claim orders in Firestore.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Real-Time Firestore Order Tracker & Customer Progress Indicator */}
      <RiderOrderTracker />

      {/* Free Turn-by-Turn Route Navigation Map */}
      <RiderNavigationMap activeOrder={activeDeliveries[0] || incomingOrders[0]} />

      {/* Incoming Orders Queue with 60-Sec Countdown */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Incoming Delivery Offers
            </h2>
            <p className="text-xs text-stone-500">
              Transparent distance payout before pickup · Customer legal IDs remain private
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#D12D11] tabular-nums">
            <Clock className="w-4 h-4" />
            <span>{countdown}s acceptance window</span>
          </div>
        </div>

        {incomingOrders.length === 0 ? (
          <div className="py-8 text-center space-y-1.5">
            <Truck className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-[#1C1917]">No unassigned orders in queue</p>
            <p className="text-xs text-stone-500">
              Place an order in Customer View to see a live dispatch ticket appear here immediately.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingOrders.map((order) => {
              const tierInfo = DISTANCE_FEES[order.distanceTier];
              const riderPayout = Math.max(35, tierInfo.fee + 10);
              return (
                <div
                  key={order.id}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-[#1C1917]">
                        Order #{order.orderNumber} · {order.storeName}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Distance: {order.distanceTier} ({tierInfo.eta}) · Customer:{" "}
                        {order.customerDisplayName}
                      </p>
                    </div>
                    <p className="font-display text-lg font-extrabold text-[#1F7A4C] tabular-nums">
                      ₱{riderPayout.toFixed(2)} Payout
                    </p>
                  </div>

                  <p className="text-xs text-stone-700 bg-white border border-stone-200 rounded-lg px-3.5 py-2.5 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#D12D11] shrink-0 mt-0.5" />
                    <span>
                      Drop-off: <strong>{order.deliveryAddress}</strong>
                      {order.deliveryNote ? ` · Note: "${order.deliveryNote}"` : ""}
                    </span>
                  </p>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() =>
                        advanceOrder(order, 4, { claimAsRider: true, riderCode })
                      }
                      className="flex-1 bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
                    >
                      Accept Order ({countdown}s) — Step 4
                    </button>
                    <button
                      onClick={() => handlePassOrder(order.id)}
                      className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
                    >
                      Pass
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Route & Proof of Delivery Console */}
      <section className="bg-[#1C1917] text-stone-100 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display text-base font-bold text-white">
              Active Delivery Route &amp; Proof of Delivery
            </h2>
          </div>
          <span className="text-xs text-stone-400 font-mono tabular-nums">
            {activeDeliveries.length} active run{activeDeliveries.length === 1 ? "" : "s"}
          </span>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Accept an incoming order above to activate live pickup and drop-off controls.
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((order) => {
              const stepInfo = ORDER_STEPS.find((s) => s.step === order.step);
              return (
                <div
                  key={order.id}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs text-emerald-400">
                        {order.orderNumber} · {stepInfo?.label}
                      </p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {order.storeName} → {order.deliveryAddress}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Recipient Display Name: {order.customerDisplayName} · Payment:{" "}
                        {order.paymentMethod} (₱{order.totalAmount.toFixed(2)})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800">
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium px-3.5 py-2 rounded-lg border border-stone-700 transition-colors">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>
                        {proofPhotoName
                          ? `POD Captured: ${proofPhotoName}`
                          : "Capture Proof of Delivery Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProofPhotoName(file.name);
                            pushToast(
                              "Proof of Delivery Attached",
                              `${file.name} ready for order completion.`,
                              "success"
                            );
                          }
                        }}
                      />
                    </label>

                    <div className="flex items-center gap-2">
                      {order.step < 6 && (
                        <button
                          onClick={() => advanceOrder(order, 6)}
                          className="inline-flex items-center gap-1.5 bg-[#E08E00] hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Confirm Pickup (Step 6)</span>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          advanceOrder(order, 7, {
                            proofOfDeliveryNote: proofPhotoName
                              ? `Photo verified (${proofPhotoName}) by Rider ${riderCode}`
                              : `Handed to ${order.customerDisplayName} by Rider ${riderCode}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 bg-[#1F7A4C] hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Delivered (Step 7)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rider Tab Switcher: Deliveries vs Earnings Dashboard */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveRiderTab("deliveries")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeRiderTab === "deliveries"
              ? "bg-white text-[#1C1917] shadow-xs"
              : "text-stone-600 hover:text-[#1C1917]"
          }`}
        >
          Active Deliveries &amp; Queue
        </button>
        <button
          type="button"
          onClick={() => setActiveRiderTab("earnings")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeRiderTab === "earnings"
              ? "bg-white text-[#1C1917] shadow-xs"
              : "text-stone-600 hover:text-[#1C1917]"
          }`}
        >
          Earnings Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveRiderTab("profile")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeRiderTab === "profile"
              ? "bg-white text-[#1C1917] shadow-xs"
              : "text-stone-600 hover:text-[#1C1917]"
          }`}
        >
          Rider Profile &amp; Stats
        </button>
      </div>

      {activeRiderTab === "profile" ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-stone-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Profile &amp; Firestore Performance</h2>
              <p className="text-xs text-stone-500">Manage your rider avatar photo and review performance statistics retrieved from Firestore.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-[#1F7A4C] text-xs font-bold rounded-lg font-mono">
              Rider Code: {riderCode}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-stone-200 border-2 border-[#1F7A4C] overflow-hidden flex items-center justify-center relative">
                {profile?.riderPhotoUrl ? (
                  <img src={profile.riderPhotoUrl} alt="Rider Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Truck className="w-10 h-10 text-stone-500" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-display text-base font-bold text-[#1C1917]">{profile?.displayName || authUser?.displayName || "Rider Partner"}</p>
                <p className="text-xs text-stone-500 font-mono">{authUser?.email || "No email"}</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-stone-700 text-left">Update Photo URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    defaultValue={profile?.riderPhotoUrl || ""}
                    onBlur={(e) => updateRiderProfile({ riderPhotoUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <p className="text-[11px] text-stone-500 text-left">Paste image URL and click away to save automatically to Firestore.</p>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-display text-base font-bold text-[#1C1917]">Firestore Performance Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <p className="font-semibold text-emerald-900">Completed Deliveries</p>
                  <p className="font-display text-3xl font-extrabold text-[#1F7A4C] tabular-nums">{completedDeliveries.length}</p>
                  <p className="text-[11px] text-emerald-800">Verified Step 7 handoffs</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <p className="font-semibold text-amber-900">Performance Rating</p>
                  <p className="font-display text-3xl font-extrabold text-amber-950 tabular-nums">⭐ {profile?.ratingScore ?? 4.9} / 5.0</p>
                  <p className="text-[11px] text-amber-800">Customer feedback score</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <p className="font-semibold text-stone-700">Total Rider Earnings</p>
                  <p className="font-display text-2xl font-bold text-stone-900 tabular-nums">₱{todayEarnings.toFixed(2)}</p>
                  <p className="text-[11px] text-stone-500">Includes distance fees</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                  <p className="font-semibold text-stone-700">KYC Vault Status</p>
                  <p className="font-display text-2xl font-bold text-emerald-700 capitalize">{profile?.kycStatus || "Verified"}</p>
                  <p className="text-[11px] text-stone-500">Police &amp; Barangay clearances approved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeRiderTab === "earnings" ? (
        <div className="space-y-6">
          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-2 shadow-xs">
              <p className="text-xs font-medium text-stone-500">Total Completed Deliveries</p>
              <p className="font-display text-3xl font-extrabold text-[#1C1917] tabular-nums">
                {completedDeliveries.length}
              </p>
              <p className="text-xs text-[#1F7A4C] font-medium">100% verified Step 7 handoffs</p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-2 shadow-xs">
              <p className="text-xs font-medium text-stone-500">Total Rider Earnings</p>
              <p className="font-display text-3xl font-extrabold text-[#1F7A4C] tabular-nums">
                ₱{todayEarnings.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-stone-500">Includes base distance fees + bonuses</p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-2 shadow-xs">
              <p className="text-xs font-medium text-stone-500">Average Payout per Run</p>
              <p className="font-display text-3xl font-extrabold text-[#E08E00] tabular-nums">
                ₱
                {(completedDeliveries.length > 0
                  ? todayEarnings / completedDeliveries.length
                  : 45
                ).toFixed(2)}
              </p>
              <p className="text-xs text-stone-500">Transparent distance-tier compensation</p>
            </div>
          </div>

          {/* Completed Deliveries Earnings Ledger */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#1F7A4C]" />
                <h2 className="font-display text-lg font-bold text-[#1C1917]">
                  Completed Deliveries Ledger &amp; Payout History
                </h2>
              </div>
              <span className="text-xs font-mono text-stone-500 tabular-nums">
                {completedDeliveries.length} completed run{completedDeliveries.length === 1 ? "" : "s"}
              </span>
            </div>

            {completedDeliveries.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-semibold text-[#1C1917]">No completed deliveries yet</p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Deliveries marked as delivered (Step 7) will automatically populate your earnings
                  ledger and summary cards.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 text-stone-500">
                    <tr>
                      <th className="py-3 pr-4 font-semibold">Order #</th>
                      <th className="py-3 px-3 font-semibold">Partner Store</th>
                      <th className="py-3 px-3 font-semibold">Distance Tier</th>
                      <th className="py-3 px-3 font-semibold">Proof of Delivery</th>
                      <th className="py-3 pl-3 font-semibold text-right">Rider Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {completedDeliveries.map((order) => {
                      const payout = Math.max(
                        35,
                        (DISTANCE_FEES[order.distanceTier]?.fee ?? 25) + 10
                      );
                      return (
                        <tr key={order.id} className="hover:bg-stone-50/70">
                          <td className="py-3 pr-4 font-mono font-bold text-[#1C1917]">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-3 text-stone-700">{order.storeName}</td>
                          <td className="py-3 px-3 text-stone-600 font-mono">{order.distanceTier}</td>
                          <td className="py-3 px-3 text-stone-600">
                            {order.proofOfDeliveryNote || "Delivered & verified"}
                          </td>
                          <td className="py-3 pl-3 text-right font-mono font-semibold text-[#1F7A4C] tabular-nums">
                            ₱{payout.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        <>
          {/* Completed Deliveries & Earnings History */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#1F7A4C]" />
                <h2 className="font-display text-lg font-bold text-[#1C1917]">
                  Completed Deliveries &amp; Earnings History
                </h2>
              </div>
              <span className="text-xs font-mono text-stone-500 tabular-nums">
                {completedDeliveries.length} completed run{completedDeliveries.length === 1 ? "" : "s"}
              </span>
            </div>

            {completedDeliveries.length === 0 ? (
              <p className="text-xs text-stone-500 py-5 text-center">
                Completed Step 7 deliveries and Proof of Delivery records will log here automatically.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-200 text-stone-500">
                    <tr>
                      <th className="py-2.5 pr-4 font-semibold">Order #</th>
                      <th className="py-2.5 px-3 font-semibold">Partner Store</th>
                      <th className="py-2.5 px-3 font-semibold">Distance</th>
                      <th className="py-2.5 px-3 font-semibold">Proof of Delivery</th>
                      <th className="py-2.5 pl-3 font-semibold text-right">Rider Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {completedDeliveries.map((order) => {
                      const payout = Math.max(
                        35,
                        (DISTANCE_FEES[order.distanceTier]?.fee ?? 25) + 10
                      );
                      return (
                        <tr key={order.id} className="hover:bg-stone-50/70">
                          <td className="py-3 pr-4 font-mono font-bold text-[#1C1917]">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-3 text-stone-700">{order.storeName}</td>
                          <td className="py-3 px-3 text-stone-600 font-mono">{order.distanceTier}</td>
                          <td className="py-3 px-3 text-stone-600">
                            {order.proofOfDeliveryNote || "Delivered & confirmed"}
                          </td>
                          <td className="py-3 pl-3 text-right font-mono font-semibold text-[#1F7A4C] tabular-nums">
                            ₱{payout.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Rider Partner Onboarding Application Modal */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-[#1C1917]">
                  Apply as a ChoyFood Rider Partner
                </h3>
                <p className="text-xs text-stone-500">
                  Submit your clearance checklist for Super Admin fleet verification
                </p>
              </div>
              <button
                onClick={() => setIsApplyOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appTicketRef ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2 text-sm text-[#1C1917]">
                <p className="font-display font-bold text-[#1F7A4C]">
                  Rider Application Submitted · Ref {appTicketRef}
                </p>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Our dispatch coordinators will verify your Barangay Clearance, Police Clearance,
                  and vehicle registration before issuing your Rider Code.
                </p>
                <button
                  onClick={() => setIsApplyOpen(false)}
                  className="mt-2 bg-[#1F7A4C] text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRiderApply} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1F7A4C]/30 focus:border-[#1F7A4C]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={appPhone}
                      onChange={(e) => setAppPhone(e.target.value)}
                      placeholder="0917 000 0000"
                      className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#1F7A4C]/30 focus:border-[#1F7A4C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fleet Vehicle</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["Motorcycle", "Bicycle / E-Bike"] as const).map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setAppVehicle(v)}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                          appVehicle === v
                            ? "bg-[#1F7A4C] border-[#1F7A4C] text-white"
                            : "bg-white border-stone-300 text-stone-700 hover:border-stone-500"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Barangay Clearance Ref #
                    </label>
                    <input
                      type="text"
                      required
                      value={appBarangayRef}
                      onChange={(e) => setAppBarangayRef(e.target.value)}
                      placeholder="e.g. BRGY-2026-0412"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Police / NBI Clearance Ref #
                    </label>
                    <input
                      type="text"
                      required
                      value={appPoliceRef}
                      onChange={(e) => setAppPoliceRef(e.target.value)}
                      placeholder="e.g. PNP-CEBU-8821"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                </div>

                {appVehicle === "Motorcycle" && (
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Driver&apos;s License &amp; OR/CR Reference
                    </label>
                    <input
                      type="text"
                      required
                      value={appLicenseOrCr}
                      onChange={(e) => setAppLicenseOrCr(e.target.value)}
                      placeholder="e.g. LTO G01-22-123456 · Plate 123ABC"
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={appSubmitting}
                    className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
                  >
                    {appSubmitting ? "Submitting..." : "Submit Application"}
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

