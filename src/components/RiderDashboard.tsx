import React, { useEffect, useRef, useState } from "react";
import { useChoyFood } from "../context/SupabaseContext";
import { DISTANCE_FEES, ORDER_STEPS } from "../data/seedData";
import { calculateHiddenRiderPayout } from "../lib/fees";
import { RiderOnboardingDocs } from "../types/choyfood";
import { RiderOrderTracker } from "./RiderOrderTracker";
import { RiderNavigationMap } from "./RiderNavigationMap";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileBadge2,
  Gamepad2,
  Gift,
  Handshake,
  HeartPulse,
  KeyRound,
  MapPin,
  Menu,
  Navigation,
  PackageCheck,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  User,
  Video,
  VideoOff,
  Wallet,
  X,
} from "lucide-react";

export type RiderTab =
  | "deliveries"
  | "profile"
  | "public_name"
  | "schedule"
  | "wallet"
  | "insurance"
  | "bonuses"
  | "referrals"
  | "promo"
  | "rules"
  | "acknowledgement"
  | "earnings"
  | "remittance"
  | "concern"
  | "games"
  | "account";

export const RiderDashboard: React.FC = () => {
  const {
    authUser,
    profile,
    isAdmin,
    orders,
    myKycRecord,
    advanceOrder,
    submitSupportTicket,
    openAuthModal,
    openAskChoy,
    pushToast,
    updateRiderProfile,
    submitKyc,
    cmsSettings,
    riderDocsByUid,
    submitRiderOnboardingDocs,
    changeUserPassword,
    awardGameBonusPoints,
  } = useChoyFood();

  const [activeTab, setActiveTab] = useState<RiderTab>("deliveries");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [countdown, setCountdown] = useState(60);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [proofPhotoName, setProofPhotoName] = useState<string>("");

  // 30-Minute Anti-Late Live Video Camera Verification
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dutyVerifiedAt, setDutyVerifiedAt] = useState<string | null>(null);

  // Rider Schedule state
  const [selectedShift, setSelectedShift] = useState<string>("Morning Batch (6:00 AM - 2:00 PM)");
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Extended Rider Profile & Super Admin Onboarding Vault state
  const existingDocs = authUser ? riderDocsByUid[authUser.uid] : undefined;
  const [realLegalName, setRealLegalName] = useState(
    existingDocs?.legalFullName || myKycRecord?.realLegalName || ""
  );
  const [nickname, setNickname] = useState(existingDocs?.nickname || profile?.nickname || "");
  const [address, setAddress] = useState(existingDocs?.address || "");
  const [phoneNumber, setPhoneNumber] = useState(
    existingDocs?.contactNumber || myKycRecord?.phoneNumber || ""
  );
  const [age, setAge] = useState(existingDocs?.age || "");
  const [sex, setSex] = useState<RiderOnboardingDocs["sex"]>(existingDocs?.sex || "Male");
  const [civilStatus, setCivilStatus] = useState<RiderOnboardingDocs["civilStatus"]>(
    existingDocs?.civilStatus || "Single"
  );
  const [driversLicenseNo, setDriversLicenseNo] = useState(existingDocs?.licenseNumber || "");
  const [licenseExpiry, setLicenseExpiry] = useState(existingDocs?.licenseExpiry || "");
  const [vehicleType, setVehicleType] = useState<RiderOnboardingDocs["vehicleType"]>(
    existingDocs?.vehicleType || "Motorcycle"
  );
  const [plateNumber, setPlateNumber] = useState(existingDocs?.plateNumber || "");
  const [orCrNumber, setOrCrNumber] = useState(existingDocs?.orCrNumber || "");
  const [orCrExpiry, setOrCrExpiry] = useState(existingDocs?.orCrExpiry || "");
  const [vehiclePhotoName, setVehiclePhotoName] = useState(existingDocs?.vehiclePhotoName || "");
  const [barangayClearanceRef, setBarangayClearanceRef] = useState(
    existingDocs?.barangayClearanceRef || ""
  );
  const [cityClearanceRef, setCityClearanceRef] = useState(existingDocs?.cityClearanceRef || "");
  const [policeClearanceRef, setPoliceClearanceRef] = useState(
    existingDocs?.policeClearanceRef || ""
  );
  const [sssNumber, setSssNumber] = useState(existingDocs?.sssNumber || "");
  const [pagIbigNumber, setPagIbigNumber] = useState(existingDocs?.pagibigNumber || "");
  const [philHealthNumber, setPhilHealthNumber] = useState(existingDocs?.philhealthNumber || "");
  const [tinNumber, setTinNumber] = useState(existingDocs?.tinNumber || "");
  const [idType, setIdType] = useState(myKycRecord?.idType || "Drivers License");
  const [idReference, setIdReference] = useState(myKycRecord?.idReference || "");
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Rider Incident / Concern Report state
  const [concernTopic, setConcernTopic] = useState("Customer No-Show / Wrong Pin");
  const [concernMessage, setConcernMessage] = useState("");
  const [concernSubmitting, setConcernSubmitting] = useState(false);
  const [concernRef, setConcernRef] = useState<string | null>(null);

  // Rider Account Password change state
  const [riderNewPass, setRiderNewPass] = useState("");
  const [riderConfirmPass, setRiderConfirmPass] = useState("");
  const [riderPassStatus, setRiderPassStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [updatingPass, setUpdatingPass] = useState(false);

  // Rider Mini-game state
  const [riderGameSpinning, setRiderGameSpinning] = useState(false);
  const [riderGameWon, setRiderGameWon] = useState<number | null>(null);

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

  const riderCode = profile?.riderCode || (authUser ? `RD${authUser.uid.slice(0, 4).toUpperCase()}` : "NEW");
  const riderScore = profile?.ratingScore ? Math.round(profile.ratingScore * 20) : 100;
  const riderBatch = riderScore >= 85 ? "Batch A" : riderScore >= 75 ? "Batch B" : "Batch C";
  const batchReason =
    riderScore >= 85
      ? "Assigned to Batch A (100-85 pts) due to exceptional reliability score, 100% successful handoffs, and 1st priority schedule picking."
      : riderScore >= 75
      ? "Assigned to Batch B (85-75 pts) due to consistent deliveries and solid reliability (2nd priority picking)."
      : "Assigned to Batch C (Below 75 pts) — provisional tier requiring additional on-time delivery runs to advance.";
  const batchBadgeColor =
    riderScore >= 85 ? "bg-emerald-500 text-white" : riderScore >= 75 ? "bg-amber-500 text-white" : "bg-rose-500 text-white";

  // Compute Public Name format: First letter of name + First letter of last name + last 3 digits of uid / phone
  const rawDisplayName = profile?.displayName || authUser?.displayName || "Rider Partner";
  const nameParts = rawDisplayName.trim().split(/\s+/);
  const firstInitial = nameParts[0]?.[0]?.toUpperCase() || "R";
  const lastInitial = nameParts[nameParts.length - 1]?.[0]?.toUpperCase() || "P";
  const tailDigits = authUser?.uid ? authUser.uid.replace(/\D/g, "").slice(-3) || "000" : "000";
  const publicHandle = `${firstInitial}${lastInitial}${tailDigits}`;

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

  const completedDeliveries = orders.filter(
    (o) => o.status === "delivered" && (isAdmin || (authUser && o.riderId === authUser.uid))
  );
  const todayEarnings = completedDeliveries.reduce(
    (sum, o) => sum + calculateHiddenRiderPayout(o),
    0
  );

  const totalCodCollected = completedDeliveries
    .filter((o) => o.paymentMethod === "COD")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalRemittanceDue = Math.max(0, totalCodCollected * 0.85); // 85% cash collection remittance due to store/platform

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

  // Stop camera stream safely on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API unavailable on this browser. Please allow media permissions.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraActive(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err: any) {
      setCameraError(err?.message || "Camera permission denied or no camera device detected.");
      setCameraActive(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleVerifyOnTimeDuty = () => {
    const timestamp = new Date().toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setDutyVerifiedAt(timestamp);
    stopLiveCamera();
    pushToast(
      "30-Min Pre-Shift Duty Verified",
      `Live video check-in logged at ${timestamp} for Rider ${riderCode}.`,
      "success"
    );
  };

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

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realLegalName.trim()) {
      pushToast("Missing Fields", "Please enter your complete legal full name.", "error");
      return;
    }
    setSubmittingKyc(true);
    try {
      await submitRiderOnboardingDocs({
        legalFullName: realLegalName.trim(),
        nickname: nickname.trim() || rawDisplayName,
        publicHandle,
        address: address.trim(),
        contactNumber: phoneNumber.trim(),
        age: age.trim(),
        sex,
        civilStatus,
        licenseNumber: driversLicenseNo.trim() || idReference.trim(),
        licenseExpiry: licenseExpiry.trim(),
        vehicleType,
        plateNumber: plateNumber.trim(),
        orCrNumber: orCrNumber.trim(),
        orCrExpiry: orCrExpiry.trim(),
        vehiclePhotoName: vehiclePhotoName.trim() || "vehicle_photo.jpg",
        barangayClearanceRef: barangayClearanceRef.trim(),
        cityClearanceRef: cityClearanceRef.trim(),
        policeClearanceRef: policeClearanceRef.trim(),
        sssNumber: sssNumber.trim(),
        pagibigNumber: pagIbigNumber.trim(),
        philhealthNumber: philHealthNumber.trim(),
        tinNumber: tinNumber.trim(),
      });

      if (nickname.trim()) {
        await updateRiderProfile({ nickname: nickname.trim() });
      }

      if (idReference.trim()) {
        await submitKyc({
          displayName: rawDisplayName,
          realLegalName,
          phoneNumber,
          otpVerified: true,
          idType: idType as any,
          idReference,
          profilePhotoName: profile?.riderPhotoUrl || "rider_profile.jpg",
          validIdPhotoName: `${idType.toLowerCase().replace(/\s+/g, "_")}_id.jpg`,
          privacyConsentAccepted: true,
        });
      }
    } finally {
      setSubmittingKyc(false);
    }
  };

  const handleSubmitConcern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concernMessage.trim()) return;
    setConcernSubmitting(true);
    try {
      const ref = await submitSupportTicket({
        fullName: `${rawDisplayName} (${riderCode})`,
        contact: phoneNumber,
        category: `Rider Incident: ${concernTopic}`,
        message: concernMessage.trim(),
      });
      if (ref) {
        setConcernRef(ref);
        setConcernMessage("");
      }
    } finally {
      setConcernSubmitting(false);
    }
  };

  const handleRiderPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (riderNewPass !== riderConfirmPass) {
      setRiderPassStatus({ ok: false, text: "Passwords do not match." });
      return;
    }
    setUpdatingPass(true);
    setRiderPassStatus(null);
    try {
      const res = await changeUserPassword(riderNewPass);
      if (res.ok) {
        setRiderPassStatus({ ok: true, text: "Rider password updated." });
        setRiderNewPass("");
        setRiderConfirmPass("");
      } else {
        setRiderPassStatus({ ok: false, text: res.error || "Failed to update password." });
      }
    } finally {
      setUpdatingPass(false);
    }
  };

  const menuItems = [
    { id: "deliveries", label: "Dispatch Dashboard & Map", icon: Truck },
    { id: "profile", label: "Profile & Super Admin Docs", icon: FileBadge2 },
    { id: "public_name", label: "Public Name Display", icon: User },
    { id: "schedule", label: "Schedule & Shift Picking", icon: Calendar },
    { id: "wallet", label: "Wallet & Choy Wallet", icon: Wallet },
    { id: "insurance", label: "Insurance & Benefits", icon: HeartPulse },
    { id: "bonuses", label: "Bonuses & Peak Surge", icon: Sparkles },
    { id: "referrals", label: "Referrals", icon: Gift },
    { id: "promo", label: "Promo & Incentives", icon: Tag },
    { id: "rules", label: "Rules & Regulations", icon: ScrollText },
    { id: "acknowledgement", label: "Acknowledgement & Terms", icon: Handshake },
    { id: "earnings", label: "Earnings Ledger", icon: ClipboardCheck },
    { id: "remittance", label: "Remittance & Cash Due", icon: ReceiptText },
    { id: "concern", label: "Report Concern / Incident", icon: AlertTriangle },
    { id: "games", label: "Rider Bonus Game", icon: Gamepad2 },
    { id: "account", label: "Account & Password", icon: KeyRound },
  ];

  return (
    <div className="space-y-8">
      {/* Rider Header Bar with Sidebar Menu Button */}
      <section className="bg-[#1F7A4C] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-md">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open rider menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0 mt-1"
            title="Open Rider Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="space-y-2">
            <p className="text-xs text-emerald-100 font-medium">
              Dashboard 4 of 5 · Rider Partner Portal · Active Duty
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Rider {riderCode} ({publicHandle})
            </h1>
            <p className="text-sm text-emerald-50/90 max-w-xl">
              Accept incoming neighborhood batches within the 60-second window and log Proof of
              Delivery upon handoff.
            </p>
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
            <p className="font-display text-2xl font-black tabular-nums">
              {riderScore} <span className="text-xs font-normal text-emerald-100">/ 100 pts</span>
            </p>
            <p className="text-[11px] text-emerald-50/80 leading-snug">{batchReason}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-black/20 border border-white/15 rounded-xl p-4 shrink-0">
            <div>
              <p className="text-xs text-emerald-100">Remittance Due</p>
              <p className="font-display text-xl font-bold tabular-nums">
                ₱{totalRemittanceDue.toFixed(2)}
              </p>
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
              Sign in with your Supabase Rider or Super Admin account to claim live delivery orders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal("rider")}
            className="bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Sign In / Register Rider
          </button>
        </div>
      )}

      {/* Tab Content Panels */}
      {activeTab === "deliveries" && (
        <div className="space-y-8">
          {/* 30-Minute Anti-Late Live Video Camera Duty Verification */}
          <section className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#1C1917] flex items-center gap-2">
                  <Video className="w-4 h-4 text-[#1F7A4C]" />
                  <span>30-Minute Pre-Shift Live Camera Duty Check</span>
                </h2>
                <p className="text-xs text-stone-500">
                  Verify your helmet, thermal bag, and on-time readiness 30 minutes before shift start.
                </p>
              </div>
              {dutyVerifiedAt ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#1F7A4C] text-xs font-bold px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified On-Time ({dutyVerifiedAt})</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      className="inline-flex items-center gap-1.5 bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Live Camera</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleVerifyOnTimeDuty}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify Duty Ready</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopLiveCamera}
                        className="inline-flex items-center gap-1 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold px-3 py-2 rounded-lg"
                      >
                        <VideoOff className="w-4 h-4" />
                        <span>Stop</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {cameraError}
              </div>
            )}

            {cameraActive && (
              <div className="rounded-xl overflow-hidden bg-stone-950 border border-stone-800 max-w-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-56 object-cover"
                />
              </div>
            )}
          </section>

          {/* Real-Time Supabase Order Tracker */}
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
                  Distance payout shown clearly before pickup · Customer legal IDs remain private
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
                  const riderPayout = calculateHiddenRiderPayout(order);
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
                          type="button"
                          onClick={() =>
                            advanceOrder(order, 4, { claimAsRider: true, riderCode })
                          }
                          className="flex-1 bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
                        >
                          Accept Order ({countdown}s) — Step 4
                        </button>
                        <button
                          type="button"
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
                              type="button"
                              onClick={() => advanceOrder(order, 6)}
                              className="inline-flex items-center gap-1.5 bg-[#E08E00] hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                              <PackageCheck className="w-4 h-4" />
                              <span>Confirm Pickup (Step 6)</span>
                            </button>
                          )}
                          <button
                            type="button"
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
        </div>
      )}

      {activeTab === "profile" && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917]">
                Rider Profile &amp; Super Admin Requirements Vault
              </h2>
              <p className="text-xs text-stone-500">
                Legal name, clearances, license, and OR/CR are stored strictly for Super Admin review. Customers only see {publicHandle}.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-[#1F7A4C] text-xs font-bold rounded-lg font-mono w-fit">
              Public Handle: {publicHandle} · {riderCode}
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
                <p className="font-display text-base font-bold text-[#1C1917]">
                  {nickname || rawDisplayName}
                </p>
                <p className="text-xs text-[#1F7A4C] font-mono font-bold">Public: {publicHandle}</p>
                <p className="text-xs text-stone-500 font-mono">{authUser?.email || "No email"}</p>
              </div>

              <div className="space-y-2 pt-2 text-left">
                <label className="block text-xs font-semibold text-stone-700">Rider Avatar Photo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  defaultValue={profile?.riderPhotoUrl || ""}
                  onBlur={(e) => updateRiderProfile({ riderPhotoUrl: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 font-mono"
                />
                <p className="text-[11px] text-stone-500">Paste image URL and click away to save.</p>
              </div>
            </div>

            <form onSubmit={handleKycSubmit} className="md:col-span-2 space-y-4 text-xs">
              <h3 className="font-display text-base font-bold text-[#1C1917]">
                Personal Identity &amp; Vehicle Requirements (Private to Super Admin)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Complete Legal Full Name (Private)
                  </label>
                  <input
                    type="text"
                    required
                    value={realLegalName}
                    onChange={(e) => setRealLegalName(e.target.value)}
                    placeholder="e.g. Juan Santos Dela Cruz Jr."
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Public Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Juan"
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Home Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Barangay, City, Province"
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mobile Contact #</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0917 000 0000"
                    className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as RiderOnboardingDocs["sex"])}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Civil Status</label>
                  <select
                    value={civilStatus}
                    onChange={(e) => setCivilStatus(e.target.value as RiderOnboardingDocs["civilStatus"])}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Driver&apos;s License #</label>
                  <input
                    type="text"
                    value={driversLicenseNo}
                    onChange={(e) => setDriversLicenseNo(e.target.value)}
                    placeholder="N02-12-345678"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">License Expiry</label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as RiderOnboardingDocs["vehicleType"])}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Bicycle / E-Bike">Bicycle / E-Bike</option>
                    <option value="Tricycle">Tricycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="e.g. 123ABC"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">OR / CR Number</label>
                  <input
                    type="text"
                    value={orCrNumber}
                    onChange={(e) => setOrCrNumber(e.target.value)}
                    placeholder="OR-998124"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">OR / CR Expiry</label>
                  <input
                    type="date"
                    value={orCrExpiry}
                    onChange={(e) => setOrCrExpiry(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Barangay Clearance Ref</label>
                  <input
                    type="text"
                    value={barangayClearanceRef}
                    onChange={(e) => setBarangayClearanceRef(e.target.value)}
                    placeholder="BRGY-2026-01"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City Clearance Ref</label>
                  <input
                    type="text"
                    value={cityClearanceRef}
                    onChange={(e) => setCityClearanceRef(e.target.value)}
                    placeholder="CITY-2026-44"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Police Clearance Ref</label>
                  <input
                    type="text"
                    value={policeClearanceRef}
                    onChange={(e) => setPoliceClearanceRef(e.target.value)}
                    placeholder="PNP-98112"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Government ID Type (KYC)</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Drivers License">Driver&apos;s License (LTO)</option>
                    <option value="UMID">UMID ID</option>
                    <option value="Passport">Philippine Passport</option>
                    <option value="PhilID">National PhilID</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Vehicle Photo &amp; ID File</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={idReference}
                      onChange={(e) => setIdReference(e.target.value)}
                      placeholder="ID Ref # (optional)"
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-stone-300 font-mono"
                    />
                    <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-2 rounded-lg font-semibold whitespace-nowrap">
                      <span>{vehiclePhotoName ? "Attached" : "Vehicle Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setVehiclePhotoName(e.target.files?.[0]?.name || "")}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SSS # (Optional)</label>
                  <input
                    type="text"
                    value={sssNumber}
                    onChange={(e) => setSssNumber(e.target.value)}
                    placeholder="34-XXXXXXX-X"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pag-IBIG #</label>
                  <input
                    type="text"
                    value={pagIbigNumber}
                    onChange={(e) => setPagIbigNumber(e.target.value)}
                    placeholder="1210-XXXX-XXXX"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">PhilHealth #</label>
                  <input
                    type="text"
                    value={philHealthNumber}
                    onChange={(e) => setPhilHealthNumber(e.target.value)}
                    placeholder="01-XXXXXXXXX-X"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">TIN #</label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="XXX-XXX-XXX"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    Vault Status: <span className="uppercase">{myKycRecord?.status || profile?.kycStatus || "Verified"}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Documents are encrypted and reviewed strictly by Super Admin personnel.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  {submittingKyc ? "Saving..." : "Save & Submit Requirements"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "public_name" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Public Name Display</h2>
            <p className="text-xs text-stone-500">
              Privacy-safe public handle displayed to partner kitchens and customers during delivery.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#1F7A4C] text-white font-display text-2xl font-black flex items-center justify-center shadow-md">
              {publicHandle}
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold text-[#1C1917]">{rawDisplayName}</p>
              <p className="text-xs text-stone-500 font-mono">Public Handle: {publicHandle}</p>
            </div>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              To protect rider personal privacy while maintaining accountability, partner kitchens and diners
              only see your public handle (<strong className="font-mono">{publicHandle}</strong>) and rider code (
              <strong className="font-mono">{riderCode}</strong>). Your full legal name remains private in the
              Super Admin vault.
            </p>
          </div>
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Shift Schedule &amp; Priority Picking</h2>
            <p className="text-xs text-stone-500">
              Select your preferred shift window. Batch A riders enjoy 1st priority schedule picking.
            </p>
          </div>

          {scheduleSaved && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold">
              Shift schedule updated successfully! Dispatch coordinators have logged your preference.
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-2">Select Active Shift Window</label>
              <div className="space-y-2.5">
                {[
                  "Morning Batch (6:00 AM - 2:00 PM) · Peak Breakfast & Lunch",
                  "Afternoon Batch (2:00 PM - 10:00 PM) · Peak Dinner & Snacks",
                  "Night Owl Shift (10:00 PM - 6:00 AM) · Late Night Delivery Surge",
                  "Full Day Double Shift (6:00 AM - 10:00 PM) · Maximum Earnings",
                ].map((shift) => (
                  <button
                    type="button"
                    key={shift}
                    onClick={() => {
                      setSelectedShift(shift);
                      setScheduleSaved(true);
                      pushToast("Shift Saved", `Active shift updated to: ${shift}`, "success");
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedShift === shift
                        ? "bg-[#1F7A4C] text-white border-[#1F7A4C] shadow-sm"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                    }`}
                  >
                    <p className="font-semibold text-sm">{shift}</p>
                    <p className={`text-[11px] mt-0.5 ${selectedShift === shift ? "text-emerald-100" : "text-stone-500"}`}>
                      Priority tier eligibility: {riderBatch} status active.
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Wallet &amp; Choy Wallet</h2>
            <p className="text-xs text-stone-500">Manage delivery payout balances and credits.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-6 rounded-2xl bg-[#1F7A4C] text-white space-y-2">
              <p className="text-emerald-100">Choy Wallet Credit Balance</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">
                ₱{(profile?.walletBalance ?? 0).toFixed(2)}
              </p>
              <p className="text-emerald-100/80 text-[11px]">Available for food purchases or cashout.</p>
            </div>
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <p className="text-stone-500">Today&apos;s Delivered Payouts</p>
              <p className="font-display text-3xl font-extrabold text-[#1C1917] tabular-nums">
                ₱{todayEarnings.toFixed(2)}
              </p>
              <p className="text-stone-500 text-[11px]">Includes distance fees and bonuses.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "referrals" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Referrals</h2>
            <p className="text-stone-500">Invite fellow delivery riders and earn referral bonuses.</p>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3 text-center">
            <Gift className="w-8 h-8 text-[#1F7A4C] mx-auto" />
            <p className="font-semibold text-sm text-[#1C1917]">Your Rider Referral Link</p>
            <div className="bg-white border border-stone-300 rounded-lg p-3 font-mono text-stone-800 text-sm select-all">
              https://choyfood.ph/rider/join?ref={riderCode}
            </div>
            <p className="text-stone-500 text-[11px]">
              Earn ₱{cmsSettings.referralBonusRider} bonus when your referred rider completes their first 10 successful deliveries.
            </p>
          </div>
        </div>
      )}

      {activeTab === "insurance" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Accident Insurance &amp; Benefits</h2>
              <p className="text-stone-500">Active-duty protection and voluntary government benefit tracking.</p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-[#1F7A4C] font-bold">
              ₱475 / Day Active Duty Plan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="font-bold text-[#1F7A4C] text-sm">On-Duty Road Accident Coverage</p>
              <p className="text-emerald-900">
                Up to ₱50,000 medical &amp; emergency road assistance while actively fulfilling CHOY DELIVERY dispatches.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <p className="font-bold text-[#1C1917] text-sm">Registered Benefit Numbers</p>
              <p className="font-mono text-stone-700">SSS: {sssNumber || "Not set in Profile"}</p>
              <p className="font-mono text-stone-700">PhilHealth: {philHealthNumber || "Not set in Profile"}</p>
              <p className="font-mono text-stone-700">Pag-IBIG: {pagIbigNumber || "Not set"} · TIN: {tinNumber || "Not set"}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bonuses" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Bonuses &amp; Peak Surge Multipliers</h2>
            <p className="text-stone-500">Additional earnings incentives for Batch A &amp; high-reliability partners.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <p className="font-bold text-amber-950 text-sm">Lunch &amp; Dinner Peak</p>
              <p className="font-display text-xl font-extrabold text-[#D12D11] tabular-nums">+₱15 / drop</p>
              <p className="text-amber-900">11:30 AM–1:30 PM &amp; 5:30 PM–8:00 PM</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-950 text-sm">Batch A Attendance</p>
              <p className="font-display text-xl font-extrabold text-[#1F7A4C] tabular-nums">₱500 / week</p>
              <p className="text-emerald-900">6+ active shifts &amp; 30-min live camera checks</p>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
              <p className="font-bold text-sky-950 text-sm">Rainy Weather Bonus</p>
              <p className="font-display text-xl font-extrabold text-sky-800 tabular-nums">+₱20 / drop</p>
              <p className="text-sky-900">Activated automatically during heavy rain advisories</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "promo" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Active Rider Promos &amp; Surge Bonuses</h2>
            <p className="text-stone-500">Current fleet incentives and peak hour multipliers.</p>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <p className="font-bold text-amber-900 text-sm">🔥 Peak Lunch Surge (+₱15 / delivery)</p>
              <p className="text-amber-800">Active daily from 11:30 AM to 1:30 PM across all zones.</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="font-bold text-[#1F7A4C] text-sm">⭐ Batch A Reliability Bonus (₱500 weekly)</p>
              <p className="text-emerald-800">Awarded to Batch A riders maintaining &gt;95% on-time handoffs.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "rules" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Fleet Rules &amp; Regulations</h2>
            <p className="text-stone-500">Standard operating procedures for ChoyFood Delivery partners.</p>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-stone-700">
            <li><strong>Safety Gear Mandatory:</strong> All riders must wear an approved crash helmet and high-visibility vest during active deliveries.</li>
            <li><strong>Thermal Delivery Bag:</strong> Food orders must be secured in a clean insulated thermal bag to maintain food temperature.</li>
            <li><strong>60-Second Dispatch Window:</strong> Claimed orders must be picked up promptly from partner kitchens within estimated times.</li>
            <li><strong>Proof of Delivery:</strong> Always log the recipient name or upload a clear doorstep photo at Step 7 handoff.</li>
            <li><strong>Honest Remittance:</strong> Cash collections (COD) must be remitted accurately according to the Super Admin remittance schedule.</li>
          </ol>
        </div>
      )}

      {activeTab === "acknowledgement" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Acknowledgement &amp; Terms</h2>
            <p className="text-stone-500">Independent contractor service agreement.</p>
          </div>
          <p className="text-stone-700">
            By operating as a ChoyFood Rider Partner, you acknowledge that you act as an independent logistics provider,
            maintaining valid vehicle registration, driver&apos;s license, and local clearances. ChoyFood provides transparent
            distance-tier compensation and instant dispatch tools.
          </p>
        </div>
      )}

      {activeTab === "earnings" && (
        <div className="space-y-6">
          <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#1F7A4C]" />
                <h2 className="font-display text-lg font-bold text-[#1C1917]">
                  Completed Deliveries Earnings Ledger
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
                      const payout = calculateHiddenRiderPayout(order);
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
      )}

      {activeTab === "remittance" && (
        <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917]">Cash Remittance &amp; Collection Due</h2>
            <p className="text-xs text-stone-500">Track Cash-on-Delivery (COD) collections to be remitted to Super Admin.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <p className="text-stone-500">Total COD Collected</p>
              <p className="font-display text-2xl font-bold text-stone-900 tabular-nums">
                ₱{totalCodCollected.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <p className="text-amber-900">Remittance Payable (85%)</p>
              <p className="font-display text-2xl font-bold text-amber-950 tabular-nums">
                ₱{totalRemittanceDue.toFixed(2)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <p className="text-emerald-900">Net Rider Earnings</p>
              <p className="font-display text-2xl font-bold text-[#1F7A4C] tabular-nums">
                ₱{(todayEarnings - totalRemittanceDue).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
            <p className="font-semibold text-stone-800">Super Admin Remittance Instructions</p>
            <p className="text-stone-600 leading-relaxed">
              Remit cash collections daily via GCash to official Super Admin account <strong className="font-mono">0936-122-3978</strong> or at the Cebu operations hub. Submit reference numbers to support for instant clearance.
            </p>
          </div>
        </div>
      )}

      {activeTab === "concern" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#D12D11]" />
              <span>Report Delivery Concern or Road Incident</span>
            </h2>
            <p className="text-stone-500">Send urgent dispatch concerns directly to Admin &amp; Super Admin Operations.</p>
          </div>

          {concernRef && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
              Concern logged with Reference <span className="font-mono">{concernRef}</span>. Dispatch coordinators have been notified.
            </div>
          )}

          <form onSubmit={handleSubmitConcern} className="space-y-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Concern Category</label>
              <select
                value={concernTopic}
                onChange={(e) => setConcernTopic(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white"
              >
                <option value="Customer No-Show / Wrong Pin">Customer No-Show / Wrong Pin</option>
                <option value="Kitchen Delay / Missing Item">Kitchen Delay / Missing Item</option>
                <option value="Motorcycle Breakdown / Flat Tire">Motorcycle Breakdown / Flat Tire</option>
                <option value="Remittance or Payout Question">Remittance or Payout Question</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Describe the Issue</label>
              <textarea
                rows={4}
                required
                value={concernMessage}
                onChange={(e) => setConcernMessage(e.target.value)}
                placeholder="Include order number, store name, and what happened..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300"
              />
            </div>
            <button
              type="submit"
              disabled={concernSubmitting}
              className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              {concernSubmitting ? "Submitting..." : "Submit Incident Report"}
            </button>
          </form>
        </div>
      )}

      {activeTab === "games" && (
        <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-5 text-center text-xs">
          <Gamepad2 className="w-10 h-10 text-[#1F7A4C] mx-auto" />
          <h2 className="font-display text-xl font-bold text-[#1C1917]">Rider Breaktime Bonus Spin</h2>
          <p className="text-stone-600">
            Spin during your break to win bonus Choy Rewards points credited directly to your account.
          </p>
          {riderGameWon !== null && (
            <p className="font-mono text-base font-extrabold text-[#1F7A4C]">
              You won +{riderGameWon} bonus pts!
            </p>
          )}
          <button
            type="button"
            disabled={riderGameSpinning}
            onClick={() => {
              setRiderGameSpinning(true);
              window.setTimeout(() => {
                const prizes = [10, 15, 20, 25];
                const won = prizes[Math.floor(Math.random() * prizes.length)];
                setRiderGameWon(won);
                setRiderGameSpinning(false);
                awardGameBonusPoints(won, "Rider Breaktime Spin");
              }, 750);
            }}
            className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl"
          >
            {riderGameSpinning ? "Spinning..." : "Spin for Rider Bonus Pts"}
          </button>
        </div>
      )}

      {activeTab === "account" && (
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#1F7A4C]" />
              <span>Rider Account &amp; Password Settings</span>
            </h2>
            <p className="text-stone-500">Update your login password and inspect your assigned fleet code.</p>
          </div>
          <form onSubmit={handleRiderPasswordUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={riderNewPass}
                  onChange={(e) => setRiderNewPass(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={riderConfirmPass}
                  onChange={(e) => setRiderConfirmPass(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>
            {riderPassStatus && (
              <p className={`font-semibold ${riderPassStatus.ok ? "text-[#1F7A4C]" : "text-rose-700"}`}>
                {riderPassStatus.text}
              </p>
            )}
            <button
              type="submit"
              disabled={updatingPass}
              className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              {updatingPass ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      )}

      {/* Rider Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs">
          <aside className="w-80 max-w-[85vw] bg-[#1F7A4C] text-white h-full flex flex-col justify-between shadow-2xl">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-display text-lg font-extrabold">Rider Fleet Menu</p>
                <p className="text-xs text-emerald-100 font-mono">Rider {riderCode} ({publicHandle})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1" aria-label="Rider sidebar menu">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as RiderTab);
                      setIsSidebarOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                      active
                        ? "bg-white text-[#1F7A4C] shadow-sm"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  openAskChoy();
                }}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 bg-[#FF5A1F] hover:bg-[#E54B12] text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Choy AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  openAuthModal("rider");
                }}
                className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <span>Switch / Sign In Account</span>
              </button>
            </div>
          </aside>
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}
    </div>
  );
};
