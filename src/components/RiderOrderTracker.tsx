import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, SUPER_ADMIN_EMAIL } from "../lib/firebase";
import { useChoyFood } from "../context/FirebaseContext";
import { DISTANCE_FEES, ORDER_STEPS } from "../data/seedData";
import { BLUEPRINT_LIMITS, Order, OrderStatus } from "../types/choyfood";
import {
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Navigation,
  PackageCheck,
  Radio,
  Store,
  Truck,
  User,
  XCircle,
} from "lucide-react";

const CUSTOMER_STATUS_COPY: Record<
  OrderStatus,
  { headline: string; customerMessage: string }
> = {
  picked: {
    headline: "Order Received",
    customerMessage: "We received your order and queued it for dispatch verification.",
  },
  admin_checked: {
    headline: "Order Verified",
    customerMessage: "Dispatch verified your order details and notified the partner kitchen.",
  },
  store_accepted: {
    headline: "Kitchen Preparing Your Meal",
    customerMessage: "The partner kitchen accepted your ticket and is cooking your food fresh.",
  },
  rider_accepted: {
    headline: "Rider Assigned & Heading to Store",
    customerMessage: "Your ChoyFood rider accepted the delivery and is on the way to the kitchen.",
  },
  food_ready: {
    headline: "Food Packed & Ready for Pickup",
    customerMessage: "Your meal is sealed and ready at the counter for rider pickup.",
  },
  picked_up: {
    headline: "Out for Delivery",
    customerMessage: "Your rider has picked up your order and is heading to your doorstep.",
  },
  delivered: {
    headline: "Order Delivered",
    customerMessage: "Your meal has arrived safely. Enjoy your ChoyFood delivery!",
  },
  cancelled: {
    headline: "Order Cancelled",
    customerMessage: "This order was cancelled before kitchen completion.",
  },
};

function formatSyncTime(date: Date | null): string {
  if (!date) return "Waiting for snapshot";
  return date.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export const RiderOrderTracker: React.FC = () => {
  const { authUser, authReady, profile, isAdmin, advanceOrder, loginWithGoogle } = useChoyFood();

  const [trackedOrders, setTrackedOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [updatingStep, setUpdatingStep] = useState<boolean>(false);

  const riderCode = profile?.riderCode || "JC389";

  // 1. Real-time Firestore collection listener scoped strictly to firestore.rules allow list
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified) {
      setTrackedOrders([]);
      setSelectedOrderId("");
      setLiveOrder(null);
      setLoadingList(false);
      return;
    }

    setLoadingList(true);
    const isBootstrap = authUser.email === SUPER_ADMIN_EMAIL;

    const ordersQuery = isBootstrap
      ? query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(25))
      : profile?.role === "rider"
      ? query(collection(db, "orders"), where("riderId", "==", authUser.uid), limit(25))
      : profile?.role === "store"
      ? query(collection(db, "orders"), where("storeOwnerId", "==", authUser.uid), limit(25))
      : query(collection(db, "orders"), where("customerId", "==", authUser.uid), limit(25));

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const docs: Order[] = snapshot.docs.map((snap) => ({
          id: snap.id,
          ...(snap.data() as Omit<Order, "id">),
        }));
        setTrackedOrders(docs);
        setLoadingList(false);
        setLastSyncedAt(new Date());

        setSelectedOrderId((prev) => {
          if (prev && docs.some((d) => d.id === prev)) return prev;
          const activeFirst = docs.find(
            (d) => d.status !== "delivered" && d.status !== "cancelled"
          );
          return activeFirst?.id || docs[0]?.id || "";
        });
      },
      (error) => {
        setLoadingList(false);
        handleFirestoreError(error, OperationType.LIST, "orders");
      }
    );

    return () => unsubscribe();
  }, [authReady, authUser, profile?.role]);

  // 2. Real-time Firestore document listener on the selected order for instant status updates
  useEffect(() => {
    if (
      !authReady ||
      !authUser ||
      !authUser.emailVerified ||
      !selectedOrderId ||
      !BLUEPRINT_LIMITS.idPattern.test(selectedOrderId)
    ) {
      setLiveOrder(null);
      setLoadingDoc(false);
      return;
    }

    setLoadingDoc(true);
    const orderPath = `orders/${selectedOrderId}`;
    const orderRef = doc(db, "orders", selectedOrderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLiveOrder({
            id: snapshot.id,
            ...(snapshot.data() as Omit<Order, "id">),
          });
        } else {
          setLiveOrder(null);
        }
        setLoadingDoc(false);
        setLastSyncedAt(new Date());
      },
      (error) => {
        setLoadingDoc(false);
        handleFirestoreError(error, OperationType.GET, orderPath);
      }
    );

    return () => unsubscribe();
  }, [authReady, authUser, selectedOrderId]);

  const displayedOrder = useMemo(() => {
    if (liveOrder) return liveOrder;
    return trackedOrders.find((o) => o.id === selectedOrderId) || null;
  }, [liveOrder, trackedOrders, selectedOrderId]);

  const progressPercent = useMemo(() => {
    if (!displayedOrder || displayedOrder.status === "cancelled") return 0;
    return Math.round((Math.min(7, Math.max(1, displayedOrder.step)) / 7) * 100);
  }, [displayedOrder]);

  // Computed map pin coordinates (interpolated percentage [0..100] between Store [20, 50] and Drop-off [80, 50])
  const riderMapPosition = useMemo(() => {
    if (!displayedOrder) return { x: 20, y: 50 };
    const step = displayedOrder.step;
    if (step <= 3) return { x: 22, y: 50 }; // At store
    if (step === 4) return { x: 38, y: 42 }; // Rider heading to store
    if (step === 5) return { x: 25, y: 50 }; // Food ready at store
    if (step === 6) return { x: 62, y: 55 }; // Out for delivery (halfway)
    return { x: 80, y: 50 }; // Delivered at customer
  }, [displayedOrder]);

  const statusCopy = displayedOrder
    ? CUSTOMER_STATUS_COPY[displayedOrder.status]
    : CUSTOMER_STATUS_COPY.picked;

  const tierInfo = displayedOrder
    ? DISTANCE_FEES[displayedOrder.distanceTier]
    : DISTANCE_FEES["0-2km"];

  const canAdvanceAsRiderOrAdmin = Boolean(
    displayedOrder &&
      displayedOrder.status !== "delivered" &&
      displayedOrder.status !== "cancelled" &&
      (isAdmin || profile?.role === "rider")
  );

  const handleQuickAdvance = async (
    nextStep: number,
    options?: { claimAsRider?: boolean; riderCode?: string; proofOfDeliveryNote?: string }
  ) => {
    if (!displayedOrder) return;
    setUpdatingStep(true);
    try {
      await advanceOrder(displayedOrder, nextStep, options);
    } finally {
      setUpdatingStep(false);
    }
  };

  return (
    <section
      aria-label="Real-Time Customer Order Tracking"
      className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#1F7A4C]" />
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Real-Time Customer Order Tracker &amp; Live Map Visualizer
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Live Firestore order stream · Surigao City, Surigao del Norte radar &amp; live movement indicator
          </p>
        </div>

        <div className="text-xs font-mono text-stone-500 tabular-nums whitespace-nowrap">
          {authUser ? `Synced ${formatSyncTime(lastSyncedAt)}` : "Sign in for live sync"}
        </div>
      </div>

      {/* Unauthenticated State */}
      {!authUser && (
        <div className="py-8 text-center space-y-3">
          <Truck className="w-6 h-6 text-stone-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1C1917]">
              Connect to Firestore Live Tracking
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Sign in with Google to subscribe to real-time order status updates and preview the
              customer delivery progress bar.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Sign in with Google
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {authUser && loadingList && trackedOrders.length === 0 && (
        <div className="space-y-4 animate-pulse" aria-busy="true">
          <div className="h-5 w-48 bg-stone-200 rounded" />
          <div className="h-2.5 w-full bg-stone-100 rounded-full" />
          <div className="grid grid-cols-7 gap-2">
            {ORDER_STEPS.map((s) => (
              <div key={s.step} className="h-14 bg-stone-100 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {authUser && !loadingList && trackedOrders.length === 0 && (
        <div className="py-8 text-center space-y-1.5">
          <PackageCheck className="w-6 h-6 text-stone-400 mx-auto" />
          <p className="text-sm font-semibold text-[#1C1917]">
            No orders currently assigned or tracked
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Once an order is placed or accepted into your delivery queue, its real-time Firestore
            status and customer progress indicator will stream here automatically.
          </p>
        </div>
      )}

      {/* Populated Real-Time Order Tracker & Map Visualizer */}
      {authUser && trackedOrders.length > 0 && displayedOrder && (
        <div className="space-y-6">
          {/* Interactive Order Selector Strip (when tracking multiple orders) */}
          {trackedOrders.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-stone-100 rounded-xl">
              {trackedOrders.slice(0, 8).map((ord) => {
                const active = ord.id === displayedOrder.id;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors tabular-nums ${
                      active
                        ? "bg-white text-[#1C1917] shadow-xs"
                        : "text-stone-600 hover:text-[#1C1917]"
                    }`}
                  >
                    {ord.orderNumber} ·{" "}
                    {ord.status === "cancelled" ? "Cancelled" : `Step ${ord.step}/7`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Interactive Cebu Neighborhood Map Visualizer & Live Location Indicator */}
          <div className="relative bg-[#0F172A] rounded-2xl overflow-hidden border border-stone-800 p-5 text-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span className="font-display text-sm font-bold text-white">
                  Surigao City Neighborhood Radar &amp; Live Transit GPS
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 tabular-nums">
                GPS Lat 9.7989° N · Long 125.4936° E
              </span>
            </div>

            {/* Visual SVG Map Canvas */}
            <div className="relative h-48 sm:h-56 w-full bg-[#1E293B] rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
              {/* Map grid lines & roads background simulation */}
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#94a3b8" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Connecting route line */}
                <path
                  d="M 120 110 Q 240 60 380 110"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
              </svg>

              {/* Origin Marker: Store */}
              <div
                className="absolute left-[20%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                title={`Origin: ${displayedOrder.storeName}`}
              >
                <div className="w-9 h-9 rounded-full bg-[#D12D11] text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <Store className="w-4 h-4" />
                </div>
                <span className="bg-black/85 text-white text-[10px] font-medium px-2 py-0.5 rounded-md mt-1 whitespace-nowrap shadow-xs">
                  {displayedOrder.storeName}
                </span>
              </div>

              {/* Destination Marker: Customer Drop-off */}
              <div
                className="absolute left-[80%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                title={`Destination: ${displayedOrder.deliveryAddress}`}
              >
                <div className="w-9 h-9 rounded-full bg-[#1F7A4C] text-white flex items-center justify-center shadow-lg border-2 border-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="bg-black/85 text-white text-[10px] font-medium px-2 py-0.5 rounded-md mt-1 whitespace-nowrap shadow-xs max-w-[140px] truncate">
                  {displayedOrder.deliveryAddress}
                </span>
              </div>

              {/* Live Moving Rider Location Indicator Pin */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-700 ease-out"
                style={{ left: `${riderMapPosition.x}%`, top: `${riderMapPosition.y}%` }}
                title={`Rider ${riderCode} live position`}
              >
                <div className="relative">
                  <span className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping" />
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xl border-2 border-white">
                    <Navigation className="w-5 h-5 rotate-45" />
                  </div>
                </div>
                <span className="bg-emerald-950 text-emerald-200 border border-emerald-700/60 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md mt-1 whitespace-nowrap shadow-lg">
                  Rider {riderCode} · Step {displayedOrder.step}/7
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <span>
                Distance Tier: <strong className="text-white">{displayedOrder.distanceTier}</strong> ({tierInfo.eta})
              </span>
              <span>
                Live Status: <strong className="text-emerald-400 uppercase">{displayedOrder.status}</strong>
              </span>
            </div>
          </div>

          {/* Customer-Facing Progress Headline & Meter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div className="space-y-1">
                <p className="text-xs text-stone-500 font-mono tabular-nums">
                  {displayedOrder.orderNumber} · Customer Progress View · ETA {tierInfo.eta}
                  {loadingDoc ? " · Syncing" : ""}
                </p>
                <h3 className="font-display text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
                  {displayedOrder.status === "cancelled" ? (
                    <XCircle className="w-5 h-5 text-[#D12D11] shrink-0" />
                  ) : displayedOrder.status === "delivered" ? (
                    <CheckCircle2 className="w-5 h-5 text-[#1F7A4C] shrink-0" />
                  ) : (
                    <Truck className="w-5 h-5 text-[#1F7A4C] shrink-0" />
                  )}
                  <span>{statusCopy.headline}</span>
                </h3>
                <p className="text-xs text-stone-600">{statusCopy.customerMessage}</p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p className="font-display text-2xl font-extrabold text-[#1F7A4C] tabular-nums">
                  {displayedOrder.status === "cancelled" ? "Halted" : `${progressPercent}%`}
                </p>
                <p className="text-xs font-mono text-stone-500 tabular-nums">
                  {displayedOrder.status === "cancelled"
                    ? "Order Cancelled"
                    : `Stage ${displayedOrder.step} of 7`}
                </p>
              </div>
            </div>

            {/* Smooth Compositor-Only Progress Bar (scaleX) */}
            <div
              role="progressbar"
              aria-label="Customer order delivery progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden"
            >
              <div
                className={`h-full w-full origin-left transition-transform duration-300 ease-out rounded-full ${
                  displayedOrder.status === "cancelled"
                    ? "bg-stone-400"
                    : displayedOrder.status === "delivered"
                    ? "bg-[#1F7A4C]"
                    : "bg-[#D12D11]"
                }`}
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            {/* 7-Step Visual Milestone Grid */}
            <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              {ORDER_STEPS.map((stage) => {
                const isCancelled = displayedOrder.status === "cancelled";
                const isCompleted = !isCancelled && displayedOrder.step > stage.step;
                const isCurrent = !isCancelled && displayedOrder.step === stage.step;

                return (
                  <li
                    key={stage.step}
                    className={`rounded-xl border p-2.5 transition-colors space-y-1 ${
                      isCurrent
                        ? "bg-[#1F7A4C] border-[#1F7A4C] text-white"
                        : isCompleted
                        ? "bg-emerald-50/70 border-emerald-200 text-[#1C1917]"
                        : "bg-stone-50 border-stone-200 text-stone-500"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <span>0{stage.step}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1F7A4C]" />
                      ) : isCurrent ? (
                        <Clock className="w-3.5 h-3.5 text-amber-200" />
                      ) : null}
                    </div>
                    <p
                      className={`text-xs font-semibold leading-snug ${
                        isCurrent
                          ? "text-white"
                          : isCompleted
                          ? "text-[#1C1917]"
                          : "text-stone-500"
                      }`}
                    >
                      {stage.shortLabel}
                    </p>
                    <p
                      className={`text-[11px] leading-tight ${
                        isCurrent
                          ? "text-emerald-100"
                          : isCompleted
                          ? "text-[#1F7A4C]"
                          : "text-stone-400"
                      }`}
                    >
                      {isCompleted ? "Done" : isCurrent ? "In progress" : "Pending"}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Order Route & Customer Summary Strip (Hairline Divided, Zero Nested Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200 text-xs">
            <div className="space-y-1">
              <p className="text-stone-500 flex items-center gap-1.5 font-medium">
                <Store className="w-3.5 h-3.5 text-[#D12D11]" />
                <span>Partner Kitchen</span>
              </p>
              <p className="font-semibold text-[#1C1917]">{displayedOrder.storeName}</p>
              <p className="text-stone-600">
                {displayedOrder.items.map((item) => `${item.qty}x ${item.name}`).join(", ")}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-stone-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-[#1F7A4C]" />
                <span>Customer &amp; Drop-off</span>
              </p>
              <p className="font-semibold text-[#1C1917]">
                {displayedOrder.customerDisplayName} · {displayedOrder.distanceTier}
              </p>
              <p className="text-stone-600 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>
                  {displayedOrder.deliveryAddress}
                  {displayedOrder.deliveryNote ? ` (${displayedOrder.deliveryNote})` : ""}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-stone-500 font-medium">Settlement &amp; Rider Assignment</p>
              <p className="font-mono font-bold text-sm text-[#1C1917] tabular-nums">
                ₱{displayedOrder.totalAmount.toFixed(2)} · {displayedOrder.paymentMethod}
              </p>
              <p className="text-stone-600">
                {displayedOrder.riderCode
                  ? `Assigned to Rider ${displayedOrder.riderCode}`
                  : "Awaiting rider acceptance"}
              </p>
              {displayedOrder.proofOfDeliveryNote && (
                <p className="text-[#1F7A4C] font-medium">
                  POD: {displayedOrder.proofOfDeliveryNote}
                </p>
              )}
            </div>
          </div>

          {/* Direct Rider Live Status Push Controls */}
          {canAdvanceAsRiderOrAdmin && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
              <p className="text-xs text-stone-500">
                Update delivery milestone to broadcast real-time progress to the customer:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {!displayedOrder.riderId && displayedOrder.step < 4 && (
                  <button
                    type="button"
                    disabled={updatingStep}
                    onClick={() =>
                      handleQuickAdvance(4, { claimAsRider: true, riderCode })
                    }
                    className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Accept Delivery (Step 4)
                  </button>
                )}
                {displayedOrder.step >= 4 && displayedOrder.step < 6 && (
                  <button
                    type="button"
                    disabled={updatingStep}
                    onClick={() => handleQuickAdvance(6)}
                    className="bg-[#E08E00] hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Confirm Pickup (Step 6)
                  </button>
                )}
                {displayedOrder.step >= 4 && displayedOrder.step < 7 && (
                  <button
                    type="button"
                    disabled={updatingStep}
                    onClick={() =>
                      handleQuickAdvance(7, {
                        proofOfDeliveryNote: `Delivered to ${displayedOrder.customerDisplayName} by Rider ${riderCode}`,
                      })
                    }
                    className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Mark Delivered (Step 7)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
