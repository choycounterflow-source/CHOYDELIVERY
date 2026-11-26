import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  AppAuthUser,
  ensureSupabaseClient,
  getSupabaseClient,
  getSupabaseProjectLabel,
  SUPER_ADMIN_EMAIL,
} from "../lib/supabase";
import {
  ActivityLog,
  BLUEPRINT_LIMITS,
  ChoyRewardsSummary,
  DeliveryCoords,
  Dish,
  DishApprovalStatus,
  DistanceTier,
  IdType,
  KycVaultRecord,
  NotificationItem,
  Order,
  OrderItemSummary,
  OrderStatus,
  PaymentMethod,
  PlatformCmsSettings,
  PromoCode,
  RewardOption,
  RiderOnboardingDocs,
  SaleGroup,
  StoreOperatingStatus,
  StorePermitChecklist,
  SupportTicket,
  ToastMessage,
  UserProfile,
  UserRole,
} from "../types/choyfood";
import {
  DISH_IMAGES,
  DISTANCE_FEES,
  HERO_FEAST_IMAGE,
  ORDER_STEPS,
  SEED_DISHES,
  SEED_PROMOS,
} from "../data/seedData";
import {
  buildRewardVoucherDescription,
  calculateOrderPoints,
  computeChoyRewardsSummary,
} from "../lib/rewards";
import { playNotificationChime } from "../lib/fees";

const CMS_STORAGE_KEY = "choy_platform_cms_v1";
const NOTIF_STORAGE_KEY = "choy_notifications_v1";
const RIDER_DOCS_STORAGE_KEY = "choy_rider_docs_v1";
const GAME_BONUS_STORAGE_KEY = "choy_game_bonus_v1";
const ORDER_EXTRAS_STORAGE_KEY = "choy_order_extras_v1";
const AVATAR_STORAGE_KEY = "choy_user_avatars_v1";

const DEFAULT_CMS_SETTINGS: PlatformCmsSettings = {
  bannerText:
    "🔥 PROMO ALERT: Gamita ang code CHOY25 para sa ₱25 OFF! • 🛵 Free Delivery uban sa Choy Pro! • 🍔 Fresh from Surigao & Cebu Partner Kitchens!",
  slides: [
    {
      id: "slide-1",
      imageUrl: HERO_FEAST_IMAGE,
      caption: "Paspas ug presko nga pagkaon diretso sa imong pultahan!",
      promoCode: "CHOY25",
    },
    {
      id: "slide-2",
      imageUrl: DISH_IMAGES.lechonKawali,
      caption: "Crispy Lechon Kawali & Fiesta Platters — Hot from Partner Kitchens",
      promoCode: "CHOY50",
    },
    {
      id: "slide-3",
      imageUrl: DISH_IMAGES.haloHalo,
      caption: "Beat the heat with Halo-Halo Special Supreme & Sweet Corner treats!",
      promoCode: "SURIGAO100",
    },
  ],
  aiKnowledgeBase:
    "CHOY DELIVERY operates across Surigao City and Cebu City. Official GCash Remittance & Top-Up Hotline: 0936-122-3978. Use CHOY25 (₱25 off ₱250+), CHOY50 (₱50 off ₱500+), SURIGAO100 (₱100 off ₱1000+). Riders wear helmets and thermal bags.",
  referralBonusCustomer: 50,
  referralBonusRider: 150,
  choyProMonthlyFee: 149,
  soundEnabled: true,
  storeStatuses: {
    "Jollibee / Centro": "open",
    "Nanay's Sizzling & BBQ": "open",
    "Cebu Grill Hub": "open",
    "Sweet Corner": "open",
  },
  storePermits: {
    "Jollibee / Centro": { dti: true, bir: true, mayors: true, sanitary: true },
    "Nanay's Sizzling & BBQ": { dti: true, bir: true, mayors: true, sanitary: true },
    "Cebu Grill Hub": { dti: true, bir: true, mayors: true, sanitary: true },
    "Sweet Corner": { dti: true, bir: true, mayors: true, sanitary: true },
  },
  dishApprovals: {},
  dishMarkups: {},
  donationCampaigns: [
    {
      id: "don-feeding",
      title: "Surigao Neighborhood Feeding Program",
      description:
        "Provides warm rice bowls and bottled water to children and senior citizens across Surigao barangays.",
      goalAmount: 15000,
      raisedAmount: 0,
    },
    {
      id: "don-typhoon",
      title: "VisMin Typhoon & Calamity Relief Kitchen",
      description:
        "Supports emergency hot meal packs dispatched by Choy partner kitchens and rider volunteers.",
      goalAmount: 25000,
      raisedAmount: 0,
    },
  ],
  riderShiftAssignments: {},
};

function mergeCmsSettings(stored: Partial<PlatformCmsSettings>): PlatformCmsSettings {
  const nextStatuses = {
    ...DEFAULT_CMS_SETTINGS.storeStatuses,
    ...(stored.storeStatuses || {}),
  };
  if (nextStatuses["Jollibee Surigao City"]) {
    if (!stored.storeStatuses?.["Jollibee / Centro"]) {
      nextStatuses["Jollibee / Centro"] = nextStatuses["Jollibee Surigao City"];
    }
    delete nextStatuses["Jollibee Surigao City"];
  }

  const nextPermits = {
    ...DEFAULT_CMS_SETTINGS.storePermits,
    ...(stored.storePermits || {}),
  };
  if (nextPermits["Jollibee Surigao City"]) {
    if (!stored.storePermits?.["Jollibee / Centro"]) {
      nextPermits["Jollibee / Centro"] = nextPermits["Jollibee Surigao City"];
    }
    delete nextPermits["Jollibee Surigao City"];
  }

  return {
    ...DEFAULT_CMS_SETTINGS,
    ...stored,
    slides:
      Array.isArray(stored.slides) && stored.slides.length > 0
        ? stored.slides
        : DEFAULT_CMS_SETTINGS.slides,
    storeStatuses: nextStatuses,
    storePermits: nextPermits,
    dishApprovals: {
      ...(stored.dishApprovals || {}),
    },
    dishMarkups: {
      ...(stored.dishMarkups || {}),
    },
    donationCampaigns:
      Array.isArray(stored.donationCampaigns) && stored.donationCampaigns.length > 0
        ? stored.donationCampaigns
        : DEFAULT_CMS_SETTINGS.donationCampaigns,
    riderShiftAssignments: {
      ...(stored.riderShiftAssignments || {}),
    },
  };
}

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export interface SupabaseContextValue {
  authUser: AppAuthUser | null;
  authReady: boolean;
  supabaseConfigured: boolean;
  supabaseProjectLabel: string;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalTargetRole: UserRole;
  openAuthModal: (role?: UserRole) => void;
  closeAuthModal: () => void;
  dishes: Dish[];
  allDishes: Dish[];
  orders: Order[];
  allUsers: UserProfile[];
  kycRecords: KycVaultRecord[];
  myKycRecord: KycVaultRecord | null;
  activityLogs: ActivityLog[];
  supportTickets: SupportTicket[];
  toasts: ToastMessage[];
  pushToast: (title: string, description?: string, variant?: ToastMessage["variant"]) => void;
  dismissToast: (id: string) => void;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    requestedRole?: "customer" | "rider" | "store",
    extra?: { storeName?: string; riderCode?: string }
  ) => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  getSuperAdminStatus: () => Promise<{
    mode: "env" | "claimed" | "unclaimed";
    needsSetup: boolean;
    mobileHint: string | null;
  }>;
  setupSuperAdmin: (
    mobile: string,
    pin: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signInSuperAdmin: (
    mobile: string,
    pin: string
  ) => Promise<{ ok: boolean; error?: string; needsSetup?: boolean }>;
  getOpsAdminStatus: () => Promise<{
    mode: "env" | "claimed" | "unclaimed";
    needsSetup: boolean;
    mobileHint: string | null;
  }>;
  setupOpsAdmin: (
    mobile: string,
    pin: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signInOpsAdmin: (
    mobile: string,
    pin: string
  ) => Promise<{ ok: boolean; error?: string; needsSetup?: boolean }>;
  getJollibeeStoreStatus: () => Promise<{
    mode: "env" | "claimed" | "unclaimed";
    needsSetup: boolean;
    mobileHint: string | null;
  }>;
  setupJollibeeStore: (
    identifier: string,
    pin: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signInJollibeeStore: (
    identifier: string,
    pin: string
  ) => Promise<{ ok: boolean; error?: string; needsSetup?: boolean }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  likeDish: (dish: Dish) => Promise<void>;
  addMenuDish: (input: {
    name: string;
    description: string;
    price: number;
    saleGroup: SaleGroup;
    storeName: string;
    imageUrl: string;
  }) => Promise<void>;
  toggleDishAvailability: (dish: Dish) => Promise<void>;
  updateDishPrice: (dish: Dish, newPrice: number) => Promise<void>;
  deleteMenuDish: (dish: Dish) => Promise<void>;
  placeOrder: (input: {
    items: OrderItemSummary[];
    subtotal: number;
    distanceTier: DistanceTier;
    paymentMethod: PaymentMethod;
    promoCode: string;
    deliveryAddress: string;
    deliveryNote: string;
    tipAmount?: number;
    deliveryCoords?: DeliveryCoords | null;
    storeName: string;
    storeOwnerId: string;
  }) => Promise<Order | null>;
  advanceOrder: (
    order: Order,
    nextStep: number,
    options?: { proofOfDeliveryNote?: string; claimAsRider?: boolean; riderCode?: string }
  ) => Promise<void>;
  cancelOrder: (order: Order) => Promise<void>;
  rateOrder: (order: Order, rating: number, reviewComment?: string) => Promise<void>;
  fetchCustomerOrders: () => Promise<{ orders: Order[]; error?: string }>;
  applyRealtimeOrderUpdate: (row: any, eventType: "INSERT" | "UPDATE" | "DELETE") => void;
  activateChoyPro: () => Promise<void>;
  updateUserAdmin: (
    targetUser: UserProfile,
    patch: {
      role?: UserRole;
      walletBalance?: number;
      choyProActive?: boolean;
      riderCode?: string;
      storeName?: string;
      ratingScore?: number;
    }
  ) => Promise<void>;
  adjustRiderScore: (targetUser: UserProfile, delta: number) => Promise<void>;
  submitKyc: (input: {
    displayName: string;
    realLegalName: string;
    phoneNumber: string;
    otpVerified: boolean;
    idType: IdType;
    idReference: string;
    profilePhotoName: string;
    validIdPhotoName: string;
    privacyConsentAccepted: boolean;
  }) => Promise<boolean>;
  reviewKyc: (record: KycVaultRecord, decision: "verified" | "rejected") => Promise<void>;
  submitSupportTicket: (input: {
    fullName: string;
    contact: string;
    category: string;
    message: string;
  }) => Promise<string | null>;
  resolveSupportTicket: (ticket: SupportTicket, status: "open" | "resolved") => Promise<void>;
  dismissActivityLog: (logId: string) => Promise<void>;
  runSystemCleaner: () => Promise<void>;
  clearOperationalDemoData: () => Promise<void>;
  seedCatalogToSupabase: () => Promise<void>;
  promos: PromoCode[];
  allPromos: PromoCode[];
  createPromoCode: (input: {
    code: string;
    discount: number;
    minSpend: number;
    description: string;
  }) => Promise<boolean>;
  togglePromoActive: (promo: PromoCode) => Promise<void>;
  validatePromoCode: (
    code: string,
    subtotal: number
  ) => Promise<{ valid: boolean; discount: number; message: string }>;
  rewardsSummary: ChoyRewardsSummary;
  redeemRewardPoints: (option: RewardOption) => Promise<PromoCode | null>;
  awardGameBonusPoints: (points: number, sourceLabel: string) => void;
  updateRiderProfile: (input: { riderPhotoUrl?: string; nickname?: string }) => Promise<void>;
  updateCustomerProfile: (input: { displayName?: string; avatarUrl?: string }) => Promise<void>;
  changeUserPassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  isAskChoyOpen: boolean;
  openAskChoy: () => void;
  closeAskChoy: () => void;
  cmsSettings: PlatformCmsSettings;
  updateCmsSettings: (patch: Partial<PlatformCmsSettings>) => void;
  setStoreStatus: (storeName: string, status: StoreOperatingStatus) => void;
  setStorePermit: (storeName: string, permitKey: keyof StorePermitChecklist, value: boolean) => void;
  approveDish: (dishId: string, status: DishApprovalStatus, adminMarkup?: number) => void;
  notifications: NotificationItem[];
  pushNotification: (
    audience: NotificationItem["audience"],
    title: string,
    message: string,
    playSound?: boolean
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (audience?: NotificationItem["audience"]) => void;
  deleteNotification: (id: string) => void;
  riderDocsByUid: Record<string, RiderOnboardingDocs>;
  submitRiderOnboardingDocs: (docs: Omit<RiderOnboardingDocs, "uid" | "updatedAt">) => Promise<void>;
  donateToCampaign: (campaignId: string, amount: number) => Promise<boolean>;
}

function mapUserFromDb(row: any): UserProfile {
  return {
    uid: row.uid,
    displayName: row.display_name || "ChoyFood User",
    role: (row.role || "customer") as UserRole,
    walletBalance: Number(row.wallet_balance ?? 0),
    choyProActive: Boolean(row.choy_pro_active),
    kycStatus: (row.kyc_status || "unverified") as UserProfile["kycStatus"],
    riderCode: row.rider_code || "",
    storeName: row.store_name || "",
    referralCode: row.referral_code || "",
    referralEarnings: Number(row.referral_earnings ?? 0),
    referredCount: Number(row.referred_count ?? 0),
    ratingScore: Number(row.rating_score ?? 5.0),
    riderPhotoUrl: row.rider_photo_url || "",
    avatarUrl: row.avatar_url || "",
    nickname: row.nickname || "",
    gameBonusPoints: Number(row.game_bonus_points ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserToDb(u: UserProfile, includeExtended = true) {
  const base = {
    uid: u.uid,
    display_name: u.displayName,
    role: u.role,
    wallet_balance: u.walletBalance,
    choy_pro_active: u.choyProActive,
    kyc_status: u.kycStatus,
    rider_code: u.riderCode || "",
    store_name: u.storeName || "",
    referral_code: u.referralCode || "",
    referral_earnings: u.referralEarnings ?? 0,
    referred_count: u.referredCount ?? 0,
    rating_score: u.ratingScore ?? 5.0,
    rider_photo_url: u.riderPhotoUrl || "",
    updated_at: new Date().toISOString(),
  };
  if (!includeExtended) return base;
  return {
    ...base,
    avatar_url: u.avatarUrl || "",
    nickname: u.nickname || "",
    game_bonus_points: u.gameBonusPoints ?? 0,
  };
}

function mapDishFromDb(row: any): Dish {
  const price = Number(row.price ?? 0);
  const adminMarkup = Math.max(0, Number(row.admin_markup ?? 0));
  const storePrice =
    row.store_price != null
      ? Math.max(0, Number(row.store_price))
      : Math.max(0, Math.round((price - adminMarkup) * 100) / 100);
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price,
    storePrice,
    adminMarkup,
    saleGroup: (row.sale_group || "Solo") as SaleGroup,
    storeName: row.store_name || "Partner Store",
    storeOwnerId: row.store_owner_id || "store_default",
    imageUrl: row.image_url || "",
    likes: Number(row.likes ?? 0),
    available: row.available !== false,
    approvalStatus: (row.approval_status || "approved") as DishApprovalStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDishToDb(d: Dish, includeExtended = true) {
  const base = {
    id: d.id,
    name: d.name,
    description: d.description,
    price: d.price,
    sale_group: d.saleGroup,
    store_name: d.storeName,
    store_owner_id: d.storeOwnerId,
    image_url: d.imageUrl,
    likes: d.likes,
    available: d.available,
    updated_at: new Date().toISOString(),
  };
  if (!includeExtended) return base;
  return {
    ...base,
    store_price: d.storePrice ?? d.price,
    admin_markup: d.adminMarkup ?? 0,
    approval_status: d.approvalStatus || "approved",
  };
}

function mapPromoFromDb(row: any): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discount: Number(row.discount ?? 0),
    minSpend: Number(row.min_spend ?? 0),
    description: row.description || "",
    active: row.active !== false,
    createdAt: row.created_at,
  };
}

function mapOrderFromDb(row: any): Order {
  const noteStr = String(row.delivery_note || "");
  const tipMatch = noteStr.match(/\[Tip:\s*₱?([0-9]+(?:\.[0-9]+)?)\]/i);
  const parsedTip = tipMatch ? Number(tipMatch[1]) || 0 : 0;
  const localExtras = readJsonStorage<
    Record<string, { tipAmount?: number; deliveryCoords?: DeliveryCoords | null }>
  >(ORDER_EXTRAS_STORAGE_KEY, {});
  const extra = localExtras[row.id];
  const dbTip = row.tip_amount != null ? Number(row.tip_amount) : undefined;
  const dbCoords =
    row.delivery_coords && typeof row.delivery_coords === "object"
      ? (row.delivery_coords as DeliveryCoords)
      : null;

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerDisplayName: row.customer_display_name,
    storeName: row.store_name,
    storeOwnerId: row.store_owner_id,
    riderId: row.rider_id || "",
    riderCode: row.rider_code || "",
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal ?? 0),
    distanceTier: (row.distance_tier || "0-2km") as DistanceTier,
    deliveryFee: Number(row.delivery_fee ?? 0),
    discount: Number(row.discount ?? 0),
    tipAmount: dbTip && dbTip > 0 ? dbTip : extra?.tipAmount ?? parsedTip,
    totalAmount: Number(row.total_amount ?? 0),
    paymentMethod: (row.payment_method || "COD") as PaymentMethod,
    deliveryAddress: row.delivery_address || "",
    deliveryNote: noteStr,
    deliveryCoords: dbCoords ?? extra?.deliveryCoords ?? null,
    step: Number(row.step ?? 1),
    status: (row.status || "picked") as OrderStatus,
    proofOfDeliveryNote: row.proof_of_delivery_note || "",
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewComment: row.review_comment || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderToDb(o: Order, includeExtended = true) {
  const base = {
    id: o.id,
    order_number: o.orderNumber,
    customer_id: o.customerId,
    customer_display_name: o.customerDisplayName,
    store_name: o.storeName,
    store_owner_id: o.storeOwnerId,
    rider_id: o.riderId,
    rider_code: o.riderCode,
    items: o.items,
    subtotal: o.subtotal,
    distance_tier: o.distanceTier,
    delivery_fee: o.deliveryFee,
    discount: o.discount,
    total_amount: o.totalAmount,
    payment_method: o.paymentMethod,
    delivery_address: o.deliveryAddress,
    delivery_note: o.deliveryNote,
    step: o.step,
    status: o.status,
    proof_of_delivery_note: o.proofOfDeliveryNote,
    rating: o.rating ?? null,
    review_comment: o.reviewComment ?? null,
    updated_at: new Date().toISOString(),
  };
  if (!includeExtended) return base;
  return {
    ...base,
    tip_amount: o.tipAmount ?? 0,
    delivery_coords: o.deliveryCoords ?? null,
  };
}

function isMissingColumnError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return (
    err.code === "42703" ||
    err.code === "PGRST204" ||
    /column .* does not exist|schema cache/i.test(err.message || "")
  );
}

async function upsertUserResilient(client: SupabaseClient, u: UserProfile) {
  const res = await client.from("users").upsert(mapUserToDb(u, true));
  if (res.error && isMissingColumnError(res.error)) {
    return client.from("users").upsert(mapUserToDb(u, false));
  }
  return res;
}

async function upsertDishResilient(client: SupabaseClient, d: Dish | Dish[]) {
  const list = Array.isArray(d) ? d : [d];
  const res = await client.from("dishes").upsert(list.map((item) => mapDishToDb(item, true)));
  if (res.error && isMissingColumnError(res.error)) {
    return client.from("dishes").upsert(list.map((item) => mapDishToDb(item, false)));
  }
  return res;
}

async function upsertOrderResilient(client: SupabaseClient, o: Order) {
  const res = await client.from("orders").upsert(mapOrderToDb(o, true));
  if (res.error && isMissingColumnError(res.error)) {
    return client.from("orders").upsert(mapOrderToDb(o, false));
  }
  return res;
}

function mapRiderDocsFromDb(row: any): RiderOnboardingDocs {
  return {
    uid: row.uid,
    legalFullName: row.legal_full_name || "",
    nickname: row.nickname || "",
    publicHandle: row.public_handle || "",
    address: row.address || "",
    contactNumber: row.contact_number || "",
    age: row.age || "",
    sex: (row.sex || "Male") as RiderOnboardingDocs["sex"],
    civilStatus: (row.civil_status || "Single") as RiderOnboardingDocs["civilStatus"],
    licenseNumber: row.license_number || "",
    licenseExpiry: row.license_expiry || "",
    vehicleType: (row.vehicle_type || "Motorcycle") as RiderOnboardingDocs["vehicleType"],
    plateNumber: row.plate_number || "",
    orCrNumber: row.or_cr_number || "",
    orCrExpiry: row.or_cr_expiry || "",
    vehiclePhotoName: row.vehicle_photo_name || "",
    barangayClearanceRef: row.barangay_clearance_ref || "",
    cityClearanceRef: row.city_clearance_ref || "",
    policeClearanceRef: row.police_clearance_ref || "",
    sssNumber: row.sss_number || "",
    pagibigNumber: row.pagibig_number || "",
    philhealthNumber: row.philhealth_number || "",
    tinNumber: row.tin_number || "",
    cameraVerifiedAt: row.camera_verified_at || undefined,
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapRiderDocsToDb(docs: RiderOnboardingDocs) {
  return {
    uid: docs.uid,
    legal_full_name: docs.legalFullName,
    nickname: docs.nickname,
    public_handle: docs.publicHandle,
    address: docs.address,
    contact_number: docs.contactNumber,
    age: docs.age,
    sex: docs.sex,
    civil_status: docs.civilStatus,
    license_number: docs.licenseNumber,
    license_expiry: docs.licenseExpiry,
    vehicle_type: docs.vehicleType,
    plate_number: docs.plateNumber,
    or_cr_number: docs.orCrNumber,
    or_cr_expiry: docs.orCrExpiry,
    vehicle_photo_name: docs.vehiclePhotoName,
    barangay_clearance_ref: docs.barangayClearanceRef,
    city_clearance_ref: docs.cityClearanceRef,
    police_clearance_ref: docs.policeClearanceRef,
    sss_number: docs.sssNumber || "",
    pagibig_number: docs.pagibigNumber || "",
    philhealth_number: docs.philhealthNumber || "",
    tin_number: docs.tinNumber || "",
    camera_verified_at: docs.cameraVerifiedAt || "",
    updated_at: docs.updatedAt || new Date().toISOString(),
  };
}

function mapNotificationFromDb(row: any): NotificationItem {
  return {
    id: row.id,
    audience: (row.audience || "all") as NotificationItem["audience"],
    title: row.title || "",
    message: row.message || "",
    read: Boolean(row.read),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapNotificationToDb(n: NotificationItem) {
  return {
    id: n.id,
    audience: n.audience,
    title: n.title,
    message: n.message,
    read: n.read,
    created_at: n.createdAt || new Date().toISOString(),
  };
}

function mapKycFromDb(row: any): KycVaultRecord {
  return {
    uid: row.uid,
    displayName: row.display_name,
    realLegalName: row.real_legal_name,
    phoneNumber: row.phone_number,
    otpVerified: Boolean(row.otp_verified),
    idType: row.id_type as IdType,
    idReference: row.id_reference,
    profilePhotoName: row.profile_photo_name,
    validIdPhotoName: row.valid_id_photo_name,
    privacyConsentAccepted: Boolean(row.privacy_consent_accepted),
    status: row.status as KycVaultRecord["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTicketFromDb(row: any): SupportTicket {
  return {
    id: row.id,
    uid: row.uid,
    fullName: row.full_name,
    contact: row.contact,
    category: row.category,
    message: row.message,
    referenceCode: row.reference_code,
    status: row.status as SupportTicket["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLogFromDb(row: any): ActivityLog {
  return {
    id: row.id,
    message: row.message,
    category: (row.category || "system") as ActivityLog["category"],
    actorId: row.actor_id,
    createdAt: row.created_at,
  };
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(() => getSupabaseClient());
  const supabaseRef = useRef<SupabaseClient | null>(supabase);
  const [supabaseProjectLabel, setSupabaseProjectLabel] = useState<string>(() =>
    getSupabaseProjectLabel()
  );

  const [authUser, setAuthUser] = useState<AppAuthUser | null>(null);
  const [authReady, setAuthReady] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTargetRole, setAuthModalTargetRole] = useState<UserRole>("super_admin");
  // Server-verified Super Admin / Ops Admin Bearer token held strictly in React memory (never localStorage)
  const adminBearerTokenRef = useRef<string | null>(null);

  const [isAskChoyOpen, setIsAskChoyOpen] = useState(false);
  const openAskChoy = useCallback(() => setIsAskChoyOpen(true), []);
  const closeAskChoy = useCallback(() => setIsAskChoyOpen(false), []);

  const [cmsSettings, setCmsSettings] = useState<PlatformCmsSettings>(() => {
    const stored = readJsonStorage<Partial<PlatformCmsSettings>>(CMS_STORAGE_KEY, {});
    return mergeCmsSettings(stored);
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    readJsonStorage<NotificationItem[]>(NOTIF_STORAGE_KEY, [])
  );

  const [riderDocsByUid, setRiderDocsByUid] = useState<Record<string, RiderOnboardingDocs>>(() =>
    readJsonStorage<Record<string, RiderOnboardingDocs>>(RIDER_DOCS_STORAGE_KEY, {})
  );

  const [gameBonusByUid, setGameBonusByUid] = useState<Record<string, number>>(() =>
    readJsonStorage<Record<string, number>>(GAME_BONUS_STORAGE_KEY, {})
  );

  const [rawAllDishes, setRawAllDishes] = useState<Dish[]>(SEED_DISHES);

  const allDishes = useMemo(
    () =>
      rawAllDishes.map((d) => {
        const markupEntry = cmsSettings.dishMarkups?.[d.id];
        const storePrice =
          markupEntry?.storePrice ?? d.storePrice ?? d.price;
        const adminMarkup =
          markupEntry?.adminMarkup ?? d.adminMarkup ?? 0;
        const price = markupEntry
          ? Math.round((storePrice + adminMarkup) * 100) / 100
          : d.price;
        return {
          ...d,
          storePrice,
          adminMarkup,
          price,
          approvalStatus: cmsSettings.dishApprovals[d.id] || d.approvalStatus || "approved",
        };
      }),
    [rawAllDishes, cmsSettings.dishApprovals, cmsSettings.dishMarkups]
  );

  const dishes = useMemo(
    () =>
      allDishes.filter(
        (d) =>
          d.available &&
          d.approvalStatus !== "pending" &&
          d.approvalStatus !== "rejected" &&
          cmsSettings.storeStatuses[d.storeName] !== "closed"
      ),
    [allDishes, cmsSettings.storeStatuses]
  );

  const [allPromos, setAllPromos] = useState<PromoCode[]>(SEED_PROMOS);
  const promos = useMemo(() => allPromos.filter((p) => p.active), [allPromos]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [kycRecords, setKycRecords] = useState<KycVaultRecord[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const rewardsSummary = useMemo(
    () =>
      computeChoyRewardsSummary(
        authUser?.uid,
        orders,
        allPromos,
        authUser?.uid
          ? Math.max(profile?.gameBonusPoints ?? 0, gameBonusByUid[authUser.uid] || 0)
          : 0
      ),
    [authUser?.uid, profile?.gameBonusPoints, orders, allPromos, gameBonusByUid]
  );

  const myKycRecord = authUser ? kycRecords.find((r) => r.uid === authUser.uid) || null : null;

  const isSuperAdmin = Boolean(
    authUser &&
      (authUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
        profile?.role === "super_admin")
  );

  const isAdmin = Boolean(isSuperAdmin || (authUser && profile?.role === "admin"));

  const pushToast = useCallback(
    (title: string, description?: string, variant: ToastMessage["variant"] = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openAuthModal = useCallback((role?: UserRole) => {
    if (role) {
      setAuthModalTargetRole(role);
    }
    setIsAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  // Load runtime Supabase config from Express server if not baked at build time
  useEffect(() => {
    let mounted = true;
    ensureSupabaseClient().then((client) => {
      if (mounted && client) {
        supabaseRef.current = client;
        setSupabase(client);
        setSupabaseProjectLabel(getSupabaseProjectLabel());
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const syncFromSupabase = useCallback(async (client: SupabaseClient) => {
    try {
      const [
        dishesRes,
        promosRes,
        ordersRes,
        usersRes,
        kycRes,
        ticketsRes,
        logsRes,
        cmsRes,
        riderDocsRes,
        notifsRes,
      ] = await Promise.all([
        client.from("dishes").select("*").limit(200),
        client
          .from("promos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        client.from("orders").select("*").order("created_at", { ascending: false }).limit(60),
        client.from("users").select("*").limit(100),
        client.from("kyc_vault").select("*").limit(100),
        client
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        client
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        client.from("platform_settings").select("*").eq("id", "default").maybeSingle(),
        client.from("rider_onboarding_docs").select("*").limit(100),
        client.from("notifications").select("*").order("created_at", { ascending: false }).limit(40),
      ]);

      if (!dishesRes.error && dishesRes.data && dishesRes.data.length > 0) {
        const seedById = new Map(SEED_DISHES.map((s) => [s.id, s]));
        const dbDishes = dishesRes.data.map(mapDishFromDb).map((d) => {
          const seed = seedById.get(d.id);
          const normalizedStoreName =
            d.storeOwnerId === "store_jollibee_surigao" ||
            d.storeName === "Jollibee Surigao City"
              ? "Jollibee / Centro"
              : d.storeName;
          return {
            ...d,
            storeName: normalizedStoreName,
            imageUrl:
              seed && (!d.imageUrl || d.imageUrl.startsWith("/src/assets/images/"))
                ? seed.imageUrl
                : d.imageUrl,
          };
        });
        const dbIds = new Set(dbDishes.map((d) => d.id));
        const missingJollibee = SEED_DISHES.filter(
          (d) => d.storeOwnerId === "store_jollibee_surigao" && !dbIds.has(d.id)
        );
        setRawAllDishes([...dbDishes, ...missingJollibee]);
      }
      if (!promosRes.error && promosRes.data && promosRes.data.length > 0) {
        setAllPromos(promosRes.data.map(mapPromoFromDb));
      }
      if (!ordersRes.error && ordersRes.data) {
        setOrders(ordersRes.data.map(mapOrderFromDb));
      }
      if (!usersRes.error && usersRes.data) {
        const mappedUsers = usersRes.data.map(mapUserFromDb);
        setAllUsers(mappedUsers);
        setGameBonusByUid((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const u of mappedUsers) {
            if (typeof u.gameBonusPoints === "number" && u.gameBonusPoints > (next[u.uid] || 0)) {
              next[u.uid] = u.gameBonusPoints;
              changed = true;
            }
          }
          if (changed) writeJsonStorage(GAME_BONUS_STORAGE_KEY, next);
          return changed ? next : prev;
        });
      }
      if (!kycRes.error && kycRes.data) {
        setKycRecords(kycRes.data.map(mapKycFromDb));
      }
      if (!ticketsRes.error && ticketsRes.data) {
        setSupportTickets(ticketsRes.data.map(mapTicketFromDb));
      }
      if (!logsRes.error && logsRes.data) {
        setActivityLogs(logsRes.data.map(mapLogFromDb));
      }
      if (!cmsRes.error && cmsRes.data?.settings && typeof cmsRes.data.settings === "object") {
        const merged = mergeCmsSettings(cmsRes.data.settings as Partial<PlatformCmsSettings>);
        setCmsSettings(merged);
        writeJsonStorage(CMS_STORAGE_KEY, merged);
      }
      if (!riderDocsRes.error && riderDocsRes.data && riderDocsRes.data.length > 0) {
        const nextDocs: Record<string, RiderOnboardingDocs> = {};
        for (const row of riderDocsRes.data) {
          const mapped = mapRiderDocsFromDb(row);
          nextDocs[mapped.uid] = mapped;
        }
        setRiderDocsByUid((prev) => {
          const merged = { ...prev, ...nextDocs };
          writeJsonStorage(RIDER_DOCS_STORAGE_KEY, merged);
          return merged;
        });
      }
      if (!notifsRes.error && notifsRes.data && notifsRes.data.length > 0) {
        const mappedNotifs = notifsRes.data.map(mapNotificationFromDb);
        setNotifications(mappedNotifs);
        writeJsonStorage(NOTIF_STORAGE_KEY, mappedNotifs);
      }
    } catch (err) {
      console.warn("Supabase sync skipped:", err);
    }
  }, []);

  const fetchCustomerOrders = useCallback(async (): Promise<{
    orders: Order[];
    error?: string;
  }> => {
    if (!authUser) {
      return { orders: [] };
    }

    const client = supabaseRef.current || (await ensureSupabaseClient());
    if (!client) {
      const localOrders = isAdmin
        ? orders
        : orders.filter((o) => o.customerId === authUser.uid);
      return { orders: localOrders };
    }

    try {
      let query = client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!isAdmin) {
        query = query.eq("customer_id", authUser.uid);
      }

      const { data, error } = await query;
      if (error) {
        return { orders: [], error: error.message };
      }

      const mapped = (data || []).map(mapOrderFromDb);
      setOrders((prev) => {
        const byId = new Map<string, Order>();
        for (const ord of mapped) byId.set(ord.id, ord);
        for (const ord of prev) {
          if (!byId.has(ord.id) && (isAdmin || ord.customerId === authUser.uid)) {
            byId.set(ord.id, ord);
          }
        }
        return Array.from(byId.values()).sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );
      });

      return { orders: mapped };
    } catch (err: any) {
      return {
        orders: [],
        error: err?.message || "Failed to fetch order history from Supabase.",
      };
    }
  }, [authUser, isAdmin, orders]);

  const applyRealtimeOrderUpdate = useCallback(
    (row: any, eventType: "INSERT" | "UPDATE" | "DELETE") => {
      if (!row || !row.id) return;
      if (eventType === "DELETE") {
        setOrders((prev) => prev.filter((o) => o.id !== row.id));
        return;
      }
      const mapped = mapOrderFromDb(row);
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === mapped.id);
        const next = exists
          ? prev.map((o) => (o.id === mapped.id ? mapped : o))
          : [mapped, ...prev];
        return next.sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );
      });
    },
    []
  );

  // Attach Supabase Auth & Realtime subscriptions
  useEffect(() => {
    if (!supabase) return;

    syncFromSupabase(supabase);

    const bootstrapAuthUser = async (sbUser: any) => {
      if (!sbUser) {
        // Keep active in-memory server-verified Super Admin session if signed in via Mobile + PIN
        if (adminBearerTokenRef.current) return;
        setAuthUser(null);
        setProfile(null);
        return;
      }

      const mappedUser: AppAuthUser = {
        uid: sbUser.id,
        email: sbUser.email || null,
        emailVerified: Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at || true),
        displayName:
          sbUser.user_metadata?.full_name ||
          sbUser.user_metadata?.display_name ||
          sbUser.user_metadata?.name ||
          sbUser.email?.split("@")[0] ||
          "ChoyFood User",
      };
      setAuthUser(mappedUser);

      const isBootstrapAdmin =
        mappedUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      const { data: existingProfile } = await supabase
        .from("users")
        .select("*")
        .eq("uid", mappedUser.uid)
        .maybeSingle();

      if (existingProfile) {
        const mapped = mapUserFromDb(existingProfile);
        if (isBootstrapAdmin && mapped.role !== "super_admin") {
          mapped.role = "super_admin";
        }
        const avatarMap = readJsonStorage<Record<string, string>>(AVATAR_STORAGE_KEY, {});
        if (!mapped.avatarUrl && avatarMap[mapped.uid]) {
          mapped.avatarUrl = avatarMap[mapped.uid];
        }
        setProfile(mapped);
      } else {
        const now = new Date().toISOString();
        const metaRole = sbUser.user_metadata?.requested_role;
        // Strictly restrict self-signup metadata to non-admin roles
        const safeSelfRole: UserRole =
          metaRole === "store" || metaRole === "rider" ? metaRole : "customer";
        const assignedRole: UserRole = isBootstrapAdmin ? "super_admin" : safeSelfRole;
        const metaStoreName = String(sbUser.user_metadata?.store_name || "").slice(
          0,
          BLUEPRINT_LIMITS.storeNameMax
        );
        const metaRiderCode = String(sbUser.user_metadata?.rider_code || "").slice(0, 20);

        const nextProfile: UserProfile = {
          uid: mappedUser.uid,
          displayName: (mappedUser.displayName || "ChoyFood User").slice(
            0,
            BLUEPRINT_LIMITS.displayNameMax
          ),
          role: assignedRole,
          walletBalance: 0,
          choyProActive: false,
          kycStatus: "unverified",
          riderCode: isBootstrapAdmin
            ? "JC389"
            : assignedRole === "rider"
            ? metaRiderCode || `RD${mappedUser.uid.slice(0, 4).toUpperCase()}`
            : "",
          storeName: isBootstrapAdmin
            ? "Nanay's Sizzling & BBQ"
            : assignedRole === "store"
            ? metaStoreName || `${mappedUser.displayName}'s Kitchen`
            : "",
          referralCode: `CHOY-${mappedUser.uid.slice(0, 6).toUpperCase()}`,
          referralEarnings: 0,
          referredCount: 0,
          ratingScore: 5.0,
          createdAt: now,
          updatedAt: now,
        };
        setProfile(nextProfile);
        await upsertUserResilient(supabase, nextProfile);
      }

      syncFromSupabase(supabase);
    };

    supabase.auth.getSession().then(({ data }) => {
      bootstrapAuthUser(data.session?.user || null);
      setAuthReady(true);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      bootstrapAuthUser(session?.user || null);
    });

    const channel = supabase
      .channel("choyfood-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "DELETE" && payload.old) {
          applyRealtimeOrderUpdate(payload.old, "DELETE");
        } else if (
          (payload.eventType === "INSERT" || payload.eventType === "UPDATE") &&
          payload.new
        ) {
          applyRealtimeOrderUpdate(payload.new, payload.eventType);
        }
        syncFromSupabase(supabase);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "dishes" }, () => {
        syncFromSupabase(supabase);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        syncFromSupabase(supabase);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_settings" }, () => {
        syncFromSupabase(supabase);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        syncFromSupabase(supabase);
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rider_onboarding_docs" },
        () => {
          syncFromSupabase(supabase);
        }
      )
      .subscribe();

    return () => {
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [supabase, syncFromSupabase, applyRealtimeOrderUpdate]);

  const logActivity = useCallback(
    async (message: string, category: ActivityLog["category"]) => {
      if (!authUser) return;
      const entry: ActivityLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        message: message.slice(0, BLUEPRINT_LIMITS.logMessageMax),
        category,
        actorId: authUser.uid,
        createdAt: new Date().toISOString(),
      };
      setActivityLogs((prev) => [entry, ...prev].slice(0, 50));
      const client = supabaseRef.current;
      if (client) {
        await client.from("activity_logs").insert({
          id: entry.id,
          message: entry.message,
          category: entry.category,
          actor_id: entry.actorId,
        });
      }
    },
    [authUser]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const client = supabaseRef.current || (await ensureSupabaseClient());
      if (!client) {
        return {
          ok: false,
          error:
            "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Render Environment variables.",
        };
      }
      supabaseRef.current = client;
      setSupabase(client);

      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.user) {
        setIsAuthModalOpen(false);
        pushToast("Signed In", `Welcome back, ${data.user.email}`, "success");
      }
      return { ok: true };
    },
    [pushToast]
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      requestedRole: "customer" | "rider" | "store" = "customer",
      extra?: { storeName?: string; riderCode?: string }
    ): Promise<{ ok: boolean; error?: string; needsVerification?: boolean }> => {
      const client = supabaseRef.current || (await ensureSupabaseClient());
      if (!client) {
        return {
          ok: false,
          error:
            "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Render Environment variables.",
        };
      }
      supabaseRef.current = client;
      setSupabase(client);

      const safeRole: "customer" | "rider" | "store" =
        requestedRole === "store" || requestedRole === "rider" ? requestedRole : "customer";
      const cleanName = displayName.trim().slice(0, BLUEPRINT_LIMITS.displayNameMax);
      const cleanStore = (extra?.storeName || "").trim().slice(0, BLUEPRINT_LIMITS.storeNameMax);
      const cleanRiderCode = (extra?.riderCode || "").trim().slice(0, 20);

      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: cleanName,
            requested_role: safeRole,
            store_name: cleanStore,
            rider_code: cleanRiderCode,
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      if (data.session) {
        setIsAuthModalOpen(false);
        pushToast("Account Created", `Signed in as ${email.trim()} (${safeRole})`, "success");
        return { ok: true, needsVerification: false };
      }

      pushToast(
        "Check Your Email",
        "Account created! Confirm your email link from Supabase to sign in.",
        "info"
      );
      return { ok: true, needsVerification: true };
    },
    [pushToast]
  );

  const applyVerifiedAdminSession = useCallback(
    async (
      token: string,
      admin: {
        uid: string;
        email: string;
        displayName: string;
        mobile: string;
        role: "super_admin" | "admin";
      }
    ) => {
      adminBearerTokenRef.current = token;
      const role: "super_admin" | "admin" = admin.role === "super_admin" ? "super_admin" : "admin";
      const mappedUser: AppAuthUser = {
        uid: admin.uid,
        email: admin.email,
        emailVerified: true,
        displayName: admin.displayName || (role === "super_admin" ? "Super Admin" : "Admin Operations"),
      };
      setAuthUser(mappedUser);

      const now = new Date().toISOString();
      const adminProfile: UserProfile = {
        uid: admin.uid,
        displayName: mappedUser.displayName || "Admin",
        role,
        walletBalance: 0,
        choyProActive: true,
        kycStatus: "verified",
        riderCode: role === "super_admin" ? "JC389" : "",
        storeName: role === "super_admin" ? "Nanay's Sizzling & BBQ" : "",
        referralCode: role === "super_admin" ? "CHOY-SUPER" : "CHOY-OPS",
        referralEarnings: 0,
        referredCount: 0,
        ratingScore: 5.0,
        createdAt: now,
        updatedAt: now,
      };
      setProfile(adminProfile);
      setIsAuthModalOpen(false);

      const client = supabaseRef.current || (await ensureSupabaseClient());
      if (client) {
        supabaseRef.current = client;
        setSupabase(client);
        const { data: existing } = await client
          .from("users")
          .select("*")
          .eq("uid", admin.uid)
          .maybeSingle();
        if (existing) {
          setProfile(mapUserFromDb({ ...existing, role }));
        } else {
          await upsertUserResilient(client, adminProfile);
        }
        syncFromSupabase(client);
      }
    },
    [syncFromSupabase]
  );

  const fetchServerPinStatus = useCallback(async (prefix: string) => {
    try {
      const res = await fetch(`${prefix}/status`);
      if (!res.ok) {
        return { mode: "unclaimed" as const, needsSetup: true, mobileHint: null };
      }
      return (await res.json()) as {
        mode: "env" | "claimed" | "unclaimed";
        needsSetup: boolean;
        mobileHint: string | null;
      };
    } catch {
      return { mode: "unclaimed" as const, needsSetup: true, mobileHint: null };
    }
  }, []);

  const getSuperAdminStatus = useCallback(
    () => fetchServerPinStatus("/api/admin"),
    [fetchServerPinStatus]
  );

  const getOpsAdminStatus = useCallback(
    () => fetchServerPinStatus("/api/ops-admin"),
    [fetchServerPinStatus]
  );

  const setupSuperAdmin = useCallback(
    async (mobile: string, pin: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/admin/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: mobile.trim(), pin: pin.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          return { ok: false, error: data.error || "Unable to complete Super Admin setup." };
        }
        await applyVerifiedAdminSession(data.token, { ...data.admin, role: "super_admin" });
        pushToast(
          "Super Admin Configured",
          "Super Admin credentials saved securely on the server. You are now signed in.",
          "success"
        );
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the authentication server." };
      }
    },
    [applyVerifiedAdminSession, pushToast]
  );

  const signInSuperAdmin = useCallback(
    async (
      mobile: string,
      pin: string
    ): Promise<{ ok: boolean; error?: string; needsSetup?: boolean }> => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: mobile.trim(), pin: pin.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          return {
            ok: false,
            error: data.error || "Invalid Super Admin mobile number or PIN.",
            needsSetup: Boolean(data.needsSetup),
          };
        }
        await applyVerifiedAdminSession(data.token, { ...data.admin, role: "super_admin" });
        pushToast("Super Admin Signed In", "Full platform command controls unlocked.", "success");
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the authentication server." };
      }
    },
    [applyVerifiedAdminSession, pushToast]
  );

  const setupOpsAdmin = useCallback(
    async (mobile: string, pin: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/ops-admin/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: mobile.trim(), pin: pin.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          return { ok: false, error: data.error || "Unable to complete Admin setup." };
        }
        await applyVerifiedAdminSession(data.token, { ...data.admin, role: "admin" });
        pushToast(
          "Admin Account Configured",
          "Admin Operations credentials saved securely on the server.",
          "success"
        );
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the authentication server." };
      }
    },
    [applyVerifiedAdminSession, pushToast]
  );

  const getJollibeeStoreStatus = useCallback(
    () => fetchServerPinStatus("/api/store-auth"),
    [fetchServerPinStatus]
  );

  const applyVerifiedStoreSession = useCallback(
    async (
      token: string,
      store: {
        uid: string;
        email: string;
        displayName: string;
        storeName?: string;
        mobile?: string;
      }
    ) => {
      adminBearerTokenRef.current = token;
      const storeLabel = store.storeName || "Jollibee / Centro";
      const mappedUser: AppAuthUser = {
        uid: store.uid,
        email: store.email,
        emailVerified: true,
        displayName: store.displayName || storeLabel,
      };
      setAuthUser(mappedUser);

      const now = new Date().toISOString();
      const storeProfile: UserProfile = {
        uid: store.uid,
        displayName: storeLabel,
        role: "store",
        walletBalance: 0,
        choyProActive: false,
        kycStatus: "verified",
        riderCode: "",
        storeName: storeLabel,
        referralCode: "CHOY-JB-CENTRO",
        referralEarnings: 0,
        referredCount: 0,
        ratingScore: 5.0,
        createdAt: now,
        updatedAt: now,
      };
      setProfile(storeProfile);
      setIsAuthModalOpen(false);

      const client = supabaseRef.current || (await ensureSupabaseClient());
      if (client) {
        supabaseRef.current = client;
        setSupabase(client);
        const { data: existing } = await client
          .from("users")
          .select("*")
          .eq("uid", store.uid)
          .maybeSingle();
        if (existing) {
          setProfile(mapUserFromDb({ ...existing, role: "store", store_name: storeLabel }));
        } else {
          await upsertUserResilient(client, storeProfile);
        }
        syncFromSupabase(client);
      }
    },
    [syncFromSupabase]
  );

  const setupJollibeeStore = useCallback(
    async (identifier: string, pin: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/store-auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: identifier.trim(), pin: pin.trim() }),
        });
        const data = await res.json();
        const storePayload = data.store || data.admin;
        if (!res.ok || !data.token || !storePayload) {
          return {
            ok: false,
            error: data.error || "Unable to complete Jollibee / Centro store setup.",
          };
        }
        await applyVerifiedStoreSession(data.token, storePayload);
        pushToast(
          "Jollibee / Centro Configured",
          "Store PIN saved securely on the server. You are now signed in to Store Dashboard.",
          "success"
        );
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the authentication server." };
      }
    },
    [applyVerifiedStoreSession, pushToast]
  );

  const signInJollibeeStore = useCallback(
    async (
      identifier: string,
      pin: string
    ): Promise<{ ok: boolean; error?: string; needsSetup?: boolean }> => {
      try {
        const res = await fetch("/api/store-auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: identifier.trim(), pin: pin.trim() }),
        });
        const data = await res.json();
        const storePayload = data.store || data.admin;
        if (!res.ok || !data.token || !storePayload) {
          return {
            ok: false,
            error: data.error || "Invalid Jollibee / Centro login ID or PIN.",
            needsSetup: Boolean(data.needsSetup),
          };
        }
        await applyVerifiedStoreSession(data.token, storePayload);
        pushToast(
          "Jollibee / Centro Signed In",
          "Kitchen queue and Jollibee menu catalog are now active.",
          "success"
        );
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the authentication server." };
      }
    },
    [applyVerifiedStoreSession, pushToast]
  );

  const signInOpsAdmin = useCallback(
    async (
      mobile: string,
      pin: string
    ): Promise<{ ok: boolean; error?: string; needsSetup?: boolean }> => {
      try {
        const res = await fetch("/api/ops-admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: mobile.trim(), pin: pin.trim() }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) {
          return {
            ok: false,
            error: data.error || "Invalid Admin mobile number or PIN.",
            needsSetup: Boolean(data.needsSetup),
          };
        }
        await applyVerifiedAdminSession(data.token, { ...data.admin, role: "admin" });
        pushToast("Admin Signed In", "Operations dashboard controls unlocked.", "success");
        return { ok: true };
      } catch {
        return { ok: false, error: "Could not reach the authentication server." };
      }
    },
    [applyVerifiedAdminSession, pushToast]
  );

  const loginWithGoogle = useCallback(async () => {
    setIsAuthModalOpen(true);
  }, []);

  const logout = useCallback(async () => {
    const token = adminBearerTokenRef.current;
    adminBearerTokenRef.current = null;
    if (token) {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    const client = supabaseRef.current;
    if (client) {
      await client.auth.signOut();
    }
    setAuthUser(null);
    setProfile(null);
    pushToast("Signed Out", "You have been safely signed out.", "info");
  }, [pushToast]);

  const persistCmsToSupabase = useCallback((nextCms: PlatformCmsSettings) => {
    const client = supabaseRef.current;
    if (!client) return;
    void client
      .from("platform_settings")
      .upsert({
        id: "default",
        settings: nextCms,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          console.debug("platform_settings sync skipped:", error.message);
        }
      });
  }, []);

  const pushNotification = useCallback(
    (
      audience: NotificationItem["audience"],
      title: string,
      message: string,
      playSound = false
    ) => {
      const entry: NotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        audience,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => {
        const next = [entry, ...prev].slice(0, 40);
        writeJsonStorage(NOTIF_STORAGE_KEY, next);
        return next;
      });
      const client = supabaseRef.current;
      if (client) {
        void client.from("notifications").upsert(mapNotificationToDb(entry));
      }
      if (playSound && cmsSettings.soundEnabled) {
        playNotificationChime("order");
      }
    },
    [cmsSettings.soundEnabled]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      writeJsonStorage(NOTIF_STORAGE_KEY, next);
      return next;
    });
    const client = supabaseRef.current;
    if (client) {
      void client.from("notifications").update({ read: true }).eq("id", id);
    }
  }, []);

  const markAllNotificationsRead = useCallback((audience?: NotificationItem["audience"]) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        !audience || n.audience === audience || n.audience === "all" ? { ...n, read: true } : n
      );
      writeJsonStorage(NOTIF_STORAGE_KEY, next);
      return next;
    });
    const client = supabaseRef.current;
    if (client) {
      if (!audience || audience === "all") {
        void client.from("notifications").update({ read: true }).eq("read", false);
      } else {
        void client
          .from("notifications")
          .update({ read: true })
          .in("audience", [audience, "all"]);
      }
    }
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      writeJsonStorage(NOTIF_STORAGE_KEY, next);
      return next;
    });
    const client = supabaseRef.current;
    if (client) {
      void client.from("notifications").delete().eq("id", id);
    }
  }, []);

  const updateCmsSettings = useCallback(
    (patch: Partial<PlatformCmsSettings>) => {
      setCmsSettings((prev) => {
        const next = mergeCmsSettings({ ...prev, ...patch });
        writeJsonStorage(CMS_STORAGE_KEY, next);
        persistCmsToSupabase(next);
        return next;
      });
    },
    [persistCmsToSupabase]
  );

  const setStoreStatus = useCallback(
    (storeName: string, status: StoreOperatingStatus) => {
      setCmsSettings((prev) => {
        const next: PlatformCmsSettings = {
          ...prev,
          storeStatuses: { ...prev.storeStatuses, [storeName]: status },
        };
        writeJsonStorage(CMS_STORAGE_KEY, next);
        persistCmsToSupabase(next);
        return next;
      });
      pushToast("Store Status Updated", `${storeName} is now ${status.replace("_", " ")}.`, "info");
    },
    [persistCmsToSupabase, pushToast]
  );

  const setStorePermit = useCallback(
    (storeName: string, permitKey: keyof StorePermitChecklist, value: boolean) => {
      setCmsSettings((prev) => {
        const current = prev.storePermits[storeName] || {
          dti: false,
          bir: false,
          mayors: false,
          sanitary: false,
        };
        const next: PlatformCmsSettings = {
          ...prev,
          storePermits: {
            ...prev.storePermits,
            [storeName]: { ...current, [permitKey]: value },
          },
        };
        writeJsonStorage(CMS_STORAGE_KEY, next);
        persistCmsToSupabase(next);
        return next;
      });
    },
    [persistCmsToSupabase]
  );

  const approveDish = useCallback(
    (dishId: string, status: DishApprovalStatus, adminMarkupInput?: number) => {
      if (!isAdmin) return;
      const target = allDishes.find((d) => d.id === dishId);
      const baseStorePrice = Math.max(0, target?.storePrice ?? target?.price ?? 0);
      const safeMarkup =
        adminMarkupInput !== undefined
          ? Math.max(0, Math.round((Number(adminMarkupInput) || 0) * 100) / 100)
          : Math.max(0, target?.adminMarkup ?? 0);
      const customerPrice = Math.round((baseStorePrice + safeMarkup) * 100) / 100;
      const now = new Date().toISOString();

      setRawAllDishes((prev) =>
        prev.map((d) =>
          d.id === dishId
            ? {
                ...d,
                approvalStatus: status,
                storePrice: baseStorePrice,
                adminMarkup: safeMarkup,
                price: customerPrice,
                updatedAt: now,
              }
            : d
        )
      );
      setCmsSettings((prev) => {
        const next: PlatformCmsSettings = {
          ...prev,
          dishApprovals: { ...prev.dishApprovals, [dishId]: status },
          dishMarkups: {
            ...(prev.dishMarkups || {}),
            [dishId]: { storePrice: baseStorePrice, adminMarkup: safeMarkup },
          },
        };
        writeJsonStorage(CMS_STORAGE_KEY, next);
        persistCmsToSupabase(next);
        return next;
      });
      const client = supabaseRef.current;
      if (client) {
        if (target) {
          void upsertDishResilient(client, {
            ...target,
            approvalStatus: status,
            storePrice: baseStorePrice,
            adminMarkup: safeMarkup,
            price: customerPrice,
            updatedAt: now,
          });
        } else {
          void client
            .from("dishes")
            .update({ approval_status: status, price: customerPrice, updated_at: now })
            .eq("id", dishId);
        }
      }

      if (target) {
        pushNotification(
          "store",
          status === "approved" ? "Dish Approved & Live" : "Dish Review Update",
          status === "approved"
            ? `"${target.name}" approved (Store ₱${baseStorePrice.toFixed(2)} + Admin Markup ₱${safeMarkup.toFixed(2)} = ₱${customerPrice.toFixed(2)} customer price).`
            : `"${target.name}" was marked ${status} by Admin.`,
          false
        );
      }

      pushToast(
        status === "approved" ? "Dish Approved & Posted" : "Menu Approval Updated",
        status === "approved"
          ? `${target?.name || "Dish"} live at ₱${customerPrice.toFixed(2)} (Store ₱${baseStorePrice.toFixed(2)} + Markup ₱${safeMarkup.toFixed(2)}).`
          : `Dish marked as ${status}.`,
        "success"
      );
    },
    [isAdmin, allDishes, persistCmsToSupabase, pushNotification, pushToast]
  );

  const likeDish = useCallback(
    async (dish: Dish) => {
      const nextLikes = (dish.likes || 0) + 1;
      setRawAllDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, likes: nextLikes } : d))
      );
      const client = supabaseRef.current;
      if (client) {
        await client
          .from("dishes")
          .update({ likes: nextLikes, updated_at: new Date().toISOString() })
          .eq("id", dish.id);
      }
      pushToast("Dish Liked", `You liked ${dish.name}.`, "success");
    },
    [pushToast]
  );

  const addMenuDish = useCallback(
    async (input: {
      name: string;
      description: string;
      price: number;
      saleGroup: SaleGroup;
      storeName: string;
      imageUrl: string;
    }) => {
      if (!authUser) {
        setIsAuthModalOpen(true);
        return;
      }
      const approvalStatus: DishApprovalStatus = isAdmin ? "approved" : "pending";
      const storeBasePrice = Math.max(1, Math.round((Number(input.price) || 1) * 100) / 100);
      const newDish: Dish = {
        id: `dish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: input.name.trim().slice(0, BLUEPRINT_LIMITS.dishNameMax),
        description: input.description.trim().slice(0, BLUEPRINT_LIMITS.dishDescMax),
        price: storeBasePrice,
        storePrice: storeBasePrice,
        adminMarkup: 0,
        saleGroup: input.saleGroup,
        storeName: input.storeName.trim().slice(0, BLUEPRINT_LIMITS.storeNameMax),
        storeOwnerId: authUser.uid,
        imageUrl: input.imageUrl.trim() || SEED_DISHES[0].imageUrl,
        likes: 0,
        available: true,
        approvalStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRawAllDishes((prev) => [newDish, ...prev]);
      setCmsSettings((prev) => {
        const next: PlatformCmsSettings = {
          ...prev,
          dishApprovals: { ...prev.dishApprovals, [newDish.id]: approvalStatus },
          dishMarkups: {
            ...(prev.dishMarkups || {}),
            [newDish.id]: { storePrice: storeBasePrice, adminMarkup: 0 },
          },
        };
        writeJsonStorage(CMS_STORAGE_KEY, next);
        persistCmsToSupabase(next);
        return next;
      });

      const client = supabaseRef.current;
      if (client) {
        const { error } = await upsertDishResilient(client, newDish);
        if (error) {
          pushToast("Save Failed", error.message, "error");
          return;
        }
      }
      await logActivity(`Added menu dish "${newDish.name}" (Store ₱${storeBasePrice.toFixed(2)})`, "store");
      if (approvalStatus === "pending") {
        pushNotification(
          "admin",
          "New Store Dish Pending Approval & Markup",
          `${newDish.storeName} posted "${newDish.name}" at ₱${storeBasePrice.toFixed(2)}. Set Admin markup & approve to publish to Customer Dashboard.`,
          true
        );
      }
      pushToast(
        approvalStatus === "pending" ? "Dish Submitted for Admin Approval" : "Dish Added",
        approvalStatus === "pending"
          ? `${newDish.name} (₱${storeBasePrice.toFixed(2)}) is awaiting Admin markup & approval before posting to customers.`
          : `${newDish.name} saved to Supabase.`,
        "success"
      );
    },
    [authUser, isAdmin, logActivity, persistCmsToSupabase, pushNotification, pushToast]
  );

  const toggleDishAvailability = useCallback(
    async (dish: Dish) => {
      const nextAvailable = !dish.available;
      setRawAllDishes((prev) =>
        prev.map((d) => (d.id === dish.id ? { ...d, available: nextAvailable } : d))
      );
      const client = supabaseRef.current;
      if (client) {
        await client
          .from("dishes")
          .update({ available: nextAvailable, updated_at: new Date().toISOString() })
          .eq("id", dish.id);
      }
      pushToast(
        nextAvailable ? "Dish Available" : "Dish Sold Out",
        `${dish.name} updated.`,
        "info"
      );
    },
    [pushToast]
  );

  const updateDishPrice = useCallback(
    async (dish: Dish, newStorePrice: number) => {
      if (!Number.isFinite(newStorePrice) || newStorePrice < 1) return;
      const cleanStorePrice = Math.round(newStorePrice * 100) / 100;
      const existingMarkup = Math.max(0, dish.adminMarkup ?? 0);
      const nextCustomerPrice = Math.round((cleanStorePrice + existingMarkup) * 100) / 100;
      const nextApproval: DishApprovalStatus = isAdmin ? dish.approvalStatus || "approved" : "pending";
      const now = new Date().toISOString();

      setRawAllDishes((prev) =>
        prev.map((d) =>
          d.id === dish.id
            ? {
                ...d,
                storePrice: cleanStorePrice,
                adminMarkup: existingMarkup,
                price: nextCustomerPrice,
                approvalStatus: nextApproval,
                updatedAt: now,
              }
            : d
        )
      );
      setCmsSettings((prev) => {
        const next: PlatformCmsSettings = {
          ...prev,
          dishApprovals: { ...prev.dishApprovals, [dish.id]: nextApproval },
          dishMarkups: {
            ...(prev.dishMarkups || {}),
            [dish.id]: { storePrice: cleanStorePrice, adminMarkup: existingMarkup },
          },
        };
        writeJsonStorage(CMS_STORAGE_KEY, next);
        persistCmsToSupabase(next);
        return next;
      });
      const client = supabaseRef.current;
      if (client) {
        await upsertDishResilient(client, {
          ...dish,
          storePrice: cleanStorePrice,
          adminMarkup: existingMarkup,
          price: nextCustomerPrice,
          approvalStatus: nextApproval,
          updatedAt: now,
        });
      }
      if (!isAdmin) {
        pushNotification(
          "admin",
          "Store Price Change Needs Approval",
          `${dish.storeName} updated "${dish.name}" store price to ₱${cleanStorePrice.toFixed(2)}. Approve & confirm markup to post live.`,
          true
        );
      }
      pushToast(
        isAdmin ? "Price Updated" : "Price Submitted for Admin Approval",
        isAdmin
          ? `${dish.name} updated to ₱${nextCustomerPrice.toFixed(2)}.`
          : `${dish.name} store price ₱${cleanStorePrice.toFixed(2)} queued for Admin approval before posting to customers.`,
        isAdmin ? "success" : "info"
      );
    },
    [isAdmin, persistCmsToSupabase, pushNotification, pushToast]
  );

  const deleteMenuDish = useCallback(
    async (dish: Dish) => {
      setRawAllDishes((prev) => prev.filter((d) => d.id !== dish.id));
      const client = supabaseRef.current;
      if (client) {
        await client.from("dishes").delete().eq("id", dish.id);
      }
      pushToast("Dish Removed", `${dish.name} deleted from catalog.`, "info");
    },
    [pushToast]
  );

  const validatePromoCode = useCallback(
    async (code: string, subtotal: number) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) {
        return { valid: false, discount: 0, message: "Enter a promo code." };
      }

      let found = promos.find((p) => p.code.toUpperCase() === normalized && p.active);
      const client = supabaseRef.current;
      if (!found && client) {
        const { data } = await client
          .from("promos")
          .select("*")
          .ilike("code", normalized)
          .eq("active", true)
          .maybeSingle();
        if (data) {
          found = mapPromoFromDb(data);
        }
      }

      if (!found) {
        return { valid: false, discount: 0, message: `Promo code "${normalized}" not found.` };
      }
      if (subtotal < found.minSpend) {
        return {
          valid: false,
          discount: 0,
          message: `Minimum order of ₱${found.minSpend.toFixed(2)} required for ${found.code}.`,
        };
      }
      return {
        valid: true,
        discount: found.discount,
        message: `${found.code} applied — ₱${found.discount.toFixed(2)} OFF!`,
      };
    },
    [promos]
  );

  const placeOrder = useCallback(
    async (input: {
      items: OrderItemSummary[];
      subtotal: number;
      distanceTier: DistanceTier;
      paymentMethod: PaymentMethod;
      promoCode: string;
      deliveryAddress: string;
      deliveryNote: string;
      tipAmount?: number;
      deliveryCoords?: DeliveryCoords | null;
      storeName: string;
      storeOwnerId: string;
    }): Promise<Order | null> => {
      if (!authUser || !profile) {
        setIsAuthModalOpen(true);
        pushToast("Sign In Required", "Please sign in with your account to place an order.", "error");
        return null;
      }

      if (profile.kycStatus !== "verified") {
        pushToast(
          "Verification Required Before Ordering",
          profile.kycStatus === "pending"
            ? "Your KYC verification is submitted and awaiting Super Admin approval."
            : "Please fill out and complete your Verification (KYC) before placing an order.",
          "error"
        );
        return null;
      }

      const fee = profile.choyProActive ? 0 : DISTANCE_FEES[input.distanceTier]?.fee ?? 25;
      let discount = 0;
      const normalizedPromo = input.promoCode.trim().toUpperCase();
      let appliedRewardPromoCode: string | null = null;
      if (normalizedPromo) {
        const check = await validatePromoCode(normalizedPromo, input.subtotal);
        if (check.valid) {
          discount = check.discount;
          if (normalizedPromo.startsWith("CHOYRW-")) {
            appliedRewardPromoCode = normalizedPromo;
          }
        }
      }
      const safeTip = Math.max(0, Math.min(5000, Number(input.tipAmount) || 0));
      const totalAmount = Math.max(0, Number((input.subtotal + fee + safeTip - discount).toFixed(2)));

      if (input.paymentMethod === "ChoyWallet" && profile.walletBalance < totalAmount) {
        pushToast(
          "Insufficient Choy Wallet",
          `Balance ₱${profile.walletBalance.toFixed(2)} is below ₱${totalAmount.toFixed(2)}.`,
          "error"
        );
        return null;
      }

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const orderNumber = `CF-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();
      const baseNote = input.deliveryNote.trim();
      const finalNote = (
        safeTip > 0 ? `${baseNote} [Tip: ₱${safeTip.toFixed(2)}]`.trim() : baseNote
      ).slice(0, BLUEPRINT_LIMITS.deliveryNoteMax);

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customerId: authUser.uid,
        customerDisplayName: profile.displayName || authUser.displayName || "Customer",
        storeName: input.storeName,
        storeOwnerId: input.storeOwnerId || "store_default",
        riderId: "",
        riderCode: "",
        items: input.items,
        subtotal: input.subtotal,
        distanceTier: input.distanceTier,
        deliveryFee: fee,
        discount,
        tipAmount: safeTip,
        totalAmount,
        paymentMethod: input.paymentMethod,
        deliveryAddress: input.deliveryAddress.trim().slice(0, BLUEPRINT_LIMITS.addressMax),
        deliveryNote: finalNote,
        deliveryCoords: input.deliveryCoords || null,
        step: 1,
        status: "picked",
        proofOfDeliveryNote: "",
        createdAt: now,
        updatedAt: now,
      };

      const extras = readJsonStorage<
        Record<string, { tipAmount?: number; deliveryCoords?: DeliveryCoords | null }>
      >(ORDER_EXTRAS_STORAGE_KEY, {});
      extras[orderId] = { tipAmount: safeTip, deliveryCoords: input.deliveryCoords || null };
      writeJsonStorage(ORDER_EXTRAS_STORAGE_KEY, extras);

      const client = supabaseRef.current;
      if (client) {
        const { error } = await upsertOrderResilient(client, newOrder);
        if (error) {
          pushToast("Order Error", error.message, "error");
          return null;
        }
      }

      setOrders((prev) => [newOrder, ...prev]);

      // Mark single-use Choy Rewards voucher as redeemed/used once applied to an order
      if (appliedRewardPromoCode) {
        setAllPromos((prev) =>
          prev.map((p) =>
            p.code.toUpperCase() === appliedRewardPromoCode ? { ...p, active: false } : p
          )
        );
        if (client) {
          await client
            .from("promos")
            .update({ active: false })
            .ilike("code", appliedRewardPromoCode);
        }
      }

      if (input.paymentMethod === "ChoyWallet") {
        const nextBalance = Number((profile.walletBalance - totalAmount).toFixed(2));
        const nextProfile = { ...profile, walletBalance: nextBalance, updatedAt: now };
        setProfile(nextProfile);
        setAllUsers((prev) => prev.map((u) => (u.uid === profile.uid ? nextProfile : u)));
        if (client) {
          await client
            .from("users")
            .update({ wallet_balance: nextBalance, updated_at: now })
            .eq("uid", profile.uid);
        }
      }

      const earnedPts = calculateOrderPoints(totalAmount, "picked").totalPoints;
      await logActivity(
        `New order ${orderNumber} placed at ${input.storeName} (₱${totalAmount.toFixed(2)}) · +${earnedPts} Choy Points`,
        "order"
      );
      pushNotification(
        "admin",
        `New Order ${orderNumber}`,
        `${newOrder.customerDisplayName} ordered ₱${totalAmount.toFixed(2)} from ${input.storeName} (${input.paymentMethod}).`,
        true
      );
      pushNotification(
        "customer",
        `Order ${orderNumber} Received`,
        `Your order at ${input.storeName} is queued (+${earnedPts} Choy Points).`,
        false
      );
      pushToast(
        "Order Placed!",
        `${orderNumber} sent to ${input.storeName} · +${earnedPts} Choy Rewards pts earned!`,
        "success"
      );
      return newOrder;
    },
    [authUser, profile, validatePromoCode, logActivity, pushNotification, pushToast]
  );

  const advanceOrder = useCallback(
    async (
      order: Order,
      nextStep: number,
      options?: { proofOfDeliveryNote?: string; claimAsRider?: boolean; riderCode?: string }
    ) => {
      if (!authUser) {
        setIsAuthModalOpen(true);
        return;
      }
      const clampedStep = Math.min(7, Math.max(1, nextStep));
      const stepInfo = ORDER_STEPS.find((s) => s.step === clampedStep);
      const nextStatus: OrderStatus = stepInfo?.status || order.status;
      const now = new Date().toISOString();

      const updated: Order = {
        ...order,
        step: clampedStep,
        status: nextStatus,
        riderId: options?.claimAsRider ? authUser.uid : order.riderId,
        riderCode: options?.riderCode || order.riderCode,
        proofOfDeliveryNote: options?.proofOfDeliveryNote || order.proofOfDeliveryNote,
        updatedAt: now,
      };

      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));

      const client = supabaseRef.current;
      if (client) {
        await upsertOrderResilient(client, updated);
      }

      await logActivity(
        `Order ${order.orderNumber} updated to Step ${clampedStep} (${nextStatus})`,
        "order"
      );
      pushToast(
        "Order Updated",
        `${order.orderNumber} → ${stepInfo?.shortLabel || nextStatus}`,
        "success"
      );
    },
    [authUser, logActivity, pushToast]
  );

  const cancelOrder = useCallback(
    async (order: Order) => {
      const now = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled", updatedAt: now } : o))
      );
      const client = supabaseRef.current;
      if (client) {
        await client
          .from("orders")
          .update({ status: "cancelled", updated_at: now })
          .eq("id", order.id);
      }
      await logActivity(`Order ${order.orderNumber} cancelled`, "order");
      pushToast("Order Cancelled", `${order.orderNumber} has been cancelled.`, "info");
    },
    [logActivity, pushToast]
  );

  const rateOrder = useCallback(
    async (order: Order, rating: number, reviewComment?: string) => {
      const now = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, rating, reviewComment: reviewComment || "", updatedAt: now } : o
        )
      );
      const client = supabaseRef.current;
      if (client) {
        await client
          .from("orders")
          .update({ rating, review_comment: reviewComment || "", updated_at: now })
          .eq("id", order.id);
      }
      pushToast("Review Saved", `Rated ${order.orderNumber} ${rating}/5 stars.`, "success");
    },
    [pushToast]
  );

  const activateChoyPro = useCallback(async () => {
    if (!authUser || !profile) {
      setIsAuthModalOpen(true);
      pushToast("Sign In Required", "Sign in to activate Choy Pro.", "error");
      return;
    }
    if (profile.choyProActive) {
      pushToast("Choy Pro Active", "You already have unlimited free delivery!", "info");
      return;
    }
    const fee = cmsSettings.choyProMonthlyFee || 149;
    const nextBalance = Math.max(0, Number((profile.walletBalance - fee).toFixed(2)));
    const nextProfile: UserProfile = {
      ...profile,
      choyProActive: true,
      walletBalance: nextBalance,
      updatedAt: new Date().toISOString(),
    };
    setProfile(nextProfile);
    setAllUsers((prev) => prev.map((u) => (u.uid === profile.uid ? nextProfile : u)));

    const client = supabaseRef.current;
    if (client) {
      await upsertUserResilient(client, nextProfile);
    }
    pushToast("Choy Pro Activated!", "Enjoy ₱0 delivery fees on all orders.", "success");
  }, [authUser, profile, cmsSettings.choyProMonthlyFee, pushToast]);

  const updateUserAdmin = useCallback(
    async (
      targetUser: UserProfile,
      patch: {
        role?: UserRole;
        walletBalance?: number;
        choyProActive?: boolean;
        riderCode?: string;
        storeName?: string;
        ratingScore?: number;
      }
    ) => {
      if (!isAdmin) {
        pushToast("Super Admin Only", "Admin privileges required.", "error");
        return;
      }
      const updated: UserProfile = {
        ...targetUser,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      setAllUsers((prev) => prev.map((u) => (u.uid === targetUser.uid ? updated : u)));
      if (profile?.uid === targetUser.uid) {
        setProfile(updated);
      }
      const client = supabaseRef.current;
      if (client) {
        await upsertUserResilient(client, updated);
      }
      pushToast("Account Updated", `Updated ${updated.displayName}.`, "success");
    },
    [isAdmin, profile, pushToast]
  );

  const adjustRiderScore = useCallback(
    async (targetUser: UserProfile, delta: number) => {
      if (!isAdmin) {
        pushToast("Admin Required", "Only Admin/Super Admin can adjust rider scores.", "error");
        return;
      }
      const current100 = Math.round((targetUser.ratingScore ?? 4.7) * 20);
      const next100 = Math.max(50, Math.min(100, current100 + delta));
      const nextRatingScore = Math.round((next100 / 20) * 100) / 100;
      await updateUserAdmin(targetUser, { ratingScore: nextRatingScore });
      await logActivity(
        `Adjusted rider score for ${targetUser.displayName}: ${current100} → ${next100} pts`,
        "rider"
      );
    },
    [isAdmin, updateUserAdmin, logActivity, pushToast]
  );

  const submitKyc = useCallback(
    async (input: {
      displayName: string;
      realLegalName: string;
      phoneNumber: string;
      otpVerified: boolean;
      idType: IdType;
      idReference: string;
      profilePhotoName: string;
      validIdPhotoName: string;
      privacyConsentAccepted: boolean;
    }): Promise<boolean> => {
      if (!authUser || !profile) {
        setIsAuthModalOpen(true);
        pushToast("Sign In Required", "Please sign in before submitting KYC.", "error");
        return false;
      }
      const now = new Date().toISOString();
      const record: KycVaultRecord = {
        uid: authUser.uid,
        displayName: input.displayName.trim(),
        realLegalName: input.realLegalName.trim(),
        phoneNumber: input.phoneNumber.trim(),
        otpVerified: input.otpVerified,
        idType: input.idType,
        idReference: input.idReference.trim(),
        profilePhotoName: input.profilePhotoName,
        validIdPhotoName: input.validIdPhotoName,
        privacyConsentAccepted: input.privacyConsentAccepted,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      const client = supabaseRef.current;
      if (client) {
        const { error } = await client.from("kyc_vault").upsert({
          uid: record.uid,
          display_name: record.displayName,
          real_legal_name: record.realLegalName,
          phone_number: record.phoneNumber,
          otp_verified: record.otpVerified,
          id_type: record.idType,
          id_reference: record.idReference,
          profile_photo_name: record.profilePhotoName,
          valid_id_photo_name: record.validIdPhotoName,
          privacy_consent_accepted: record.privacyConsentAccepted,
          status: record.status,
          updated_at: now,
        });
        if (error) {
          pushToast("KYC Save Failed", error.message, "error");
          return false;
        }
      }

      setKycRecords((prev) => {
        const exists = prev.some((r) => r.uid === record.uid);
        return exists ? prev.map((r) => (r.uid === record.uid ? record : r)) : [record, ...prev];
      });

      const nextProfile: UserProfile = {
        ...profile,
        displayName: input.displayName.trim() || profile.displayName,
        kycStatus: "pending",
        updatedAt: now,
      };
      setProfile(nextProfile);
      if (client) {
        await upsertUserResilient(client, nextProfile);
      }

      await logActivity(`KYC verification submitted by ${record.displayName}`, "kyc");
      pushToast("KYC Submitted", "Your ID is now pending Super Admin verification.", "success");
      return true;
    },
    [authUser, profile, logActivity, pushToast]
  );

  const reviewKyc = useCallback(
    async (record: KycVaultRecord, decision: "verified" | "rejected") => {
      if (!isSuperAdmin) {
        pushToast("Super Admin Only", "Only the Super Admin can approve or reject KYC records.", "error");
        return;
      }
      const now = new Date().toISOString();
      setKycRecords((prev) =>
        prev.map((r) => (r.uid === record.uid ? { ...r, status: decision, updatedAt: now } : r))
      );
      setAllUsers((prev) =>
        prev.map((u) => (u.uid === record.uid ? { ...u, kycStatus: decision, updatedAt: now } : u))
      );
      if (profile?.uid === record.uid) {
        setProfile({ ...profile, kycStatus: decision, updatedAt: now });
      }

      const client = supabaseRef.current;
      if (client) {
        await client
          .from("kyc_vault")
          .update({ status: decision, updated_at: now })
          .eq("uid", record.uid);
        await client
          .from("users")
          .update({ kyc_status: decision, updated_at: now })
          .eq("uid", record.uid);
      }
      await logActivity(`KYC for ${record.displayName} marked ${decision}`, "kyc");
      pushToast("KYC Reviewed", `${record.displayName} is now ${decision}.`, "success");
    },
    [isSuperAdmin, profile, logActivity, pushToast]
  );

  const submitSupportTicket = useCallback(
    async (input: {
      fullName: string;
      contact: string;
      category: string;
      message: string;
    }): Promise<string | null> => {
      const now = new Date().toISOString();
      const refCode = `CF-${Math.floor(100000 + Math.random() * 900000)}`;
      const ticket: SupportTicket = {
        id: `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        uid: authUser?.uid || "guest_user",
        fullName: input.fullName.trim(),
        contact: input.contact.trim(),
        category: input.category,
        message: input.message.trim(),
        referenceCode: refCode,
        status: "open",
        createdAt: now,
        updatedAt: now,
      };

      setSupportTickets((prev) => [ticket, ...prev]);
      const client = supabaseRef.current;
      if (client) {
        await client.from("support_tickets").insert({
          id: ticket.id,
          uid: ticket.uid,
          full_name: ticket.fullName,
          contact: ticket.contact,
          category: ticket.category,
          message: ticket.message,
          reference_code: ticket.referenceCode,
          status: ticket.status,
          updated_at: now,
        });
      }
      pushNotification(
        "admin",
        `New Ticket · ${input.category}`,
        `${ticket.fullName}: ${ticket.message.slice(0, 120)}`,
        true
      );
      pushToast("Request Logged", `Reference ${refCode} saved.`, "success");
      return refCode;
    },
    [authUser, pushNotification, pushToast]
  );

  const resolveSupportTicket = useCallback(
    async (ticket: SupportTicket, status: "open" | "resolved") => {
      const now = new Date().toISOString();
      setSupportTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status, updatedAt: now } : t))
      );
      const client = supabaseRef.current;
      if (client) {
        await client
          .from("support_tickets")
          .update({ status, updated_at: now })
          .eq("id", ticket.id);
      }
      pushToast("Ticket Updated", `${ticket.referenceCode} marked ${status}.`, "success");
    },
    [pushToast]
  );

  const dismissActivityLog = useCallback(async (logId: string) => {
    setActivityLogs((prev) => prev.filter((l) => l.id !== logId));
    const client = supabaseRef.current;
    if (client) {
      await client.from("activity_logs").delete().eq("id", logId);
    }
  }, []);

  const runSystemCleaner = useCallback(async () => {
    if (!isAdmin) return;
    const count = activityLogs.length;
    setActivityLogs([]);
    const client = supabaseRef.current;
    if (client && count > 0) {
      await client.from("activity_logs").delete().neq("id", "");
    }
    await logActivity(`System Cleaner purged ${count} old activity entries.`, "system");
    pushToast("System Cleaner Completed", `Purged ${count} logs.`, "success");
  }, [isAdmin, activityLogs.length, logActivity, pushToast]);

  const clearOperationalDemoData = useCallback(async () => {
    if (!isAdmin) {
      pushToast("Super Admin Only", "Only Super Admin can clear operational demo data.", "error");
      return;
    }

    const now = new Date().toISOString();
    const resetCampaigns = cmsSettings.donationCampaigns.map((c) => ({ ...c, raisedAmount: 0 }));
    const nextCms: PlatformCmsSettings = { ...cmsSettings, donationCampaigns: resetCampaigns };
    setCmsSettings(nextCms);
    writeJsonStorage(CMS_STORAGE_KEY, nextCms);

    setOrders([]);
    setSupportTickets([]);
    setActivityLogs([]);
    setNotifications([]);
    setGameBonusByUid({});
    setRawAllDishes((prev) => prev.map((d) => ({ ...d, likes: 0 })));
    setAllUsers((prev) => prev.map((u) => ({ ...u, gameBonusPoints: 0 })));
    if (profile) {
      setProfile({ ...profile, gameBonusPoints: 0, updatedAt: now });
    }

    try {
      window.localStorage.removeItem(ORDER_EXTRAS_STORAGE_KEY);
      window.localStorage.removeItem(NOTIF_STORAGE_KEY);
      window.localStorage.removeItem(GAME_BONUS_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors gracefully
    }

    const client = supabaseRef.current;
    if (client) {
      await Promise.all([
        client.from("orders").delete().neq("id", ""),
        client.from("support_tickets").delete().neq("id", ""),
        client.from("activity_logs").delete().neq("id", ""),
        client.from("notifications").delete().neq("id", ""),
        client.from("dishes").update({ likes: 0, updated_at: now }).neq("id", ""),
        client.from("platform_settings").upsert({
          id: "default",
          settings: nextCms,
          updated_at: now,
        }),
      ]);
    }

    pushToast(
      "Live Ledger Cleared",
      "All demo orders, tickets, logs, notifications, dish likes, and donation totals have been reset to zero.",
      "success"
    );
  }, [isAdmin, cmsSettings, profile, pushToast]);

  const seedCatalogToSupabase = useCallback(async () => {
    setRawAllDishes(SEED_DISHES);
    setAllPromos((prev) => {
      const existingCodes = new Set(prev.map((p) => p.code.toUpperCase()));
      const additions = SEED_PROMOS.filter((p) => !existingCodes.has(p.code.toUpperCase()));
      return [...prev, ...additions];
    });
    const client = supabaseRef.current;
    if (client) {
      await upsertDishResilient(client, SEED_DISHES);
      await client.from("promos").upsert(
        SEED_PROMOS.map((p) => ({
          id: p.id,
          code: p.code,
          discount: p.discount,
          min_spend: p.minSpend,
          description: p.description,
          active: p.active,
        }))
      );
    }
    pushToast("Catalog Synced", "Partner dishes and promos synced to Supabase.", "success");
  }, [pushToast]);

  const createPromoCode = useCallback(
    async (input: {
      code: string;
      discount: number;
      minSpend: number;
      description: string;
    }): Promise<boolean> => {
      if (!isAdmin) return false;
      const cleanCode = input.code.trim().toUpperCase().replace(/\s+/g, "");
      if (cleanCode.length < 3) {
        pushToast("Invalid Code", "Promo code must be at least 3 characters.", "error");
        return false;
      }
      const newPromo: PromoCode = {
        id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code: cleanCode,
        discount: Math.max(5, Number(input.discount) || 25),
        minSpend: Math.max(0, Number(input.minSpend) || 0),
        description: input.description.trim() || `₱${input.discount} OFF`,
        active: true,
        createdAt: new Date().toISOString(),
      };
      const client = supabaseRef.current;
      if (client) {
        const { error } = await client.from("promos").upsert({
          id: newPromo.id,
          code: newPromo.code,
          discount: newPromo.discount,
          min_spend: newPromo.minSpend,
          description: newPromo.description,
          active: true,
        });
        if (error) {
          pushToast("Promo Save Failed", error.message, "error");
          return false;
        }
      }
      setAllPromos((prev) => [newPromo, ...prev.filter((p) => p.code !== cleanCode)]);
      pushToast("Promo Created", `${cleanCode} is now active.`, "success");
      return true;
    },
    [isAdmin, pushToast]
  );

  const togglePromoActive = useCallback(
    async (promo: PromoCode) => {
      if (!isAdmin) return;
      const nextActive = !promo.active;
      setAllPromos((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, active: nextActive } : p))
      );
      const client = supabaseRef.current;
      if (client) {
        await client.from("promos").update({ active: nextActive }).eq("id", promo.id);
      }
      pushToast("Promo Updated", `${promo.code} is now ${nextActive ? "Active" : "Paused"}.`, "info");
    },
    [isAdmin, pushToast]
  );

  const redeemRewardPoints = useCallback(
    async (option: RewardOption): Promise<PromoCode | null> => {
      if (!authUser) {
        openAuthModal("customer");
        pushToast("Sign In Required", "Please sign in to redeem Choy Rewards points.", "error");
        return null;
      }

      if (rewardsSummary.availablePoints < option.pointsCost) {
        const shortage = option.pointsCost - rewardsSummary.availablePoints;
        pushToast(
          "Not Enough Points",
          `You need ${shortage} more Choy Points to redeem ${option.title}.`,
          "error"
        );
        return null;
      }

      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const code = `CHOYRW-${suffix}`;
      const id = `promo_rw_${Date.now()}_${suffix.toLowerCase()}`;
      const now = new Date().toISOString();
      const description = buildRewardVoucherDescription(
        option.title,
        authUser.uid,
        option.pointsCost
      );

      const createdPromo: PromoCode = {
        id,
        code,
        discount: option.discount,
        minSpend: option.minSpend,
        description,
        active: true,
        createdAt: now,
      };

      const client = supabaseRef.current;
      if (client) {
        const { error } = await client.from("promos").insert({
          id: createdPromo.id,
          code: createdPromo.code,
          discount: createdPromo.discount,
          min_spend: createdPromo.minSpend,
          description: createdPromo.description,
          active: true,
        });
        if (error) {
          pushToast("Redemption Failed", error.message, "error");
          return null;
        }
      }

      setAllPromos((prev) => [createdPromo, ...prev]);
      await logActivity(
        `Redeemed ${option.pointsCost} Choy Points for ${option.title} (${code})`,
        "order"
      );
      pushToast(
        "Reward Redeemed!",
        `Voucher ${code} (₱${option.discount.toFixed(0)} OFF) is ready for checkout.`,
        "success"
      );
      return createdPromo;
    },
    [authUser, rewardsSummary.availablePoints, openAuthModal, logActivity, pushToast]
  );

  const awardGameBonusPoints = useCallback(
    (points: number, sourceLabel: string) => {
      if (!authUser) {
        openAuthModal("customer");
        return;
      }
      const safePts = Math.max(1, Math.min(100, Math.floor(points)));
      const nextBonusTotal =
        Math.max(profile?.gameBonusPoints ?? 0, gameBonusByUid[authUser.uid] || 0) + safePts;

      setGameBonusByUid((prev) => {
        const next = { ...prev, [authUser.uid]: nextBonusTotal };
        writeJsonStorage(GAME_BONUS_STORAGE_KEY, next);
        return next;
      });
      if (profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          gameBonusPoints: nextBonusTotal,
          updatedAt: new Date().toISOString(),
        };
        setProfile(updatedProfile);
        setAllUsers((prev) => prev.map((u) => (u.uid === profile.uid ? updatedProfile : u)));
        const client = supabaseRef.current;
        if (client) {
          void upsertUserResilient(client, updatedProfile);
        }
      }
      pushNotification(
        "customer",
        `+${safePts} Choy Rewards Bonus!`,
        `You won +${safePts} points from ${sourceLabel}.`,
        false
      );
      pushToast("Bonus Points Won!", `+${safePts} Choy Rewards pts added to your balance.`, "success");
    },
    [authUser, profile, gameBonusByUid, openAuthModal, pushNotification, pushToast]
  );

  const updateRiderProfile = useCallback(
    async (input: { riderPhotoUrl?: string; nickname?: string }) => {
      if (!authUser || !profile) {
        setIsAuthModalOpen(true);
        return;
      }
      const nextProfile: UserProfile = {
        ...profile,
        riderPhotoUrl: input.riderPhotoUrl ?? profile.riderPhotoUrl,
        nickname: input.nickname ?? profile.nickname,
        updatedAt: new Date().toISOString(),
      };
      setProfile(nextProfile);
      setAllUsers((prev) => prev.map((u) => (u.uid === profile.uid ? nextProfile : u)));

      const client = supabaseRef.current;
      if (client) {
        await upsertUserResilient(client, nextProfile);
      }
      pushToast("Rider Profile Updated", "Your rider profile details have been saved.", "success");
    },
    [authUser, profile, pushToast]
  );

  const updateCustomerProfile = useCallback(
    async (input: { displayName?: string; avatarUrl?: string }) => {
      if (!authUser || !profile) {
        setIsAuthModalOpen(true);
        return;
      }
      const now = new Date().toISOString();
      const nextDisplay = input.displayName?.trim()
        ? input.displayName.trim().slice(0, BLUEPRINT_LIMITS.displayNameMax)
        : profile.displayName;
      const nextProfile: UserProfile = {
        ...profile,
        displayName: nextDisplay,
        avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : profile.avatarUrl,
        updatedAt: now,
      };
      if (input.avatarUrl !== undefined) {
        const avatarMap = readJsonStorage<Record<string, string>>(AVATAR_STORAGE_KEY, {});
        avatarMap[profile.uid] = input.avatarUrl;
        writeJsonStorage(AVATAR_STORAGE_KEY, avatarMap);
      }
      setProfile(nextProfile);
      setAllUsers((prev) => prev.map((u) => (u.uid === profile.uid ? nextProfile : u)));
      const client = supabaseRef.current;
      if (client) {
        await upsertUserResilient(client, nextProfile);
      }
      pushToast("Profile Updated", "Your display name and photo preferences are saved.", "success");
    },
    [authUser, profile, pushToast]
  );

  const changeUserPassword = useCallback(
    async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
      if (!authUser) {
        return { ok: false, error: "Sign in first to update your password." };
      }
      if (newPassword.trim().length < 6) {
        return { ok: false, error: "Password must be at least 6 characters." };
      }
      const client = supabaseRef.current;
      if (!client) {
        return { ok: false, error: "Supabase auth client is not connected." };
      }
      if (adminBearerTokenRef.current) {
        return {
          ok: false,
          error:
            "Server-managed Admin Mobile+PIN credentials are configured via environment or server claim.",
        };
      }
      const { error } = await client.auth.updateUser({ password: newPassword.trim() });
      if (error) {
        return { ok: false, error: error.message };
      }
      pushToast("Password Updated", "Your new account password is active.", "success");
      return { ok: true };
    },
    [authUser, pushToast]
  );

  const submitRiderOnboardingDocs = useCallback(
    async (docs: Omit<RiderOnboardingDocs, "uid" | "updatedAt">) => {
      if (!authUser) {
        setIsAuthModalOpen(true);
        return;
      }
      const fullRecord: RiderOnboardingDocs = {
        ...docs,
        uid: authUser.uid,
        updatedAt: new Date().toISOString(),
      };
      setRiderDocsByUid((prev) => {
        const next = { ...prev, [authUser.uid]: fullRecord };
        writeJsonStorage(RIDER_DOCS_STORAGE_KEY, next);
        return next;
      });
      const client = supabaseRef.current;
      if (client) {
        await client.from("rider_onboarding_docs").upsert(mapRiderDocsToDb(fullRecord));
      }
      await submitKyc({
        displayName: docs.nickname || docs.publicHandle,
        realLegalName: docs.legalFullName,
        phoneNumber: docs.contactNumber,
        otpVerified: true,
        idType: "Drivers License",
        idReference: docs.licenseNumber || docs.orCrNumber || "PENDING",
        profilePhotoName: profile?.riderPhotoUrl || "rider_selfie.jpg",
        validIdPhotoName: `${docs.vehiclePhotoName || "vehicle"}_${docs.barangayClearanceRef}`,
        privacyConsentAccepted: true,
      });
      await submitSupportTicket({
        fullName: docs.legalFullName,
        contact: docs.contactNumber,
        category: "Rider Application & Clearances",
        message: `Handle ${docs.publicHandle} (${docs.nickname}) · ${docs.vehicleType} ${docs.plateNumber} · License ${docs.licenseNumber} (Exp ${docs.licenseExpiry}) · OR/CR ${docs.orCrNumber} · Clearances: Brgy ${docs.barangayClearanceRef}, City ${docs.cityClearanceRef}, Police ${docs.policeClearanceRef}`,
      });
    },
    [authUser, profile?.riderPhotoUrl, submitKyc, submitSupportTicket]
  );

  const donateToCampaign = useCallback(
    async (campaignId: string, amount: number): Promise<boolean> => {
      if (!authUser || !profile) {
        openAuthModal("customer");
        pushToast("Sign In Required", "Please sign in to donate from Choy Wallet.", "error");
        return false;
      }
      const cleanAmt = Math.max(10, Math.round(amount));
      if (profile.walletBalance < cleanAmt) {
        pushToast(
          "Insufficient Choy Wallet",
          `Balance ₱${profile.walletBalance.toFixed(2)} is below ₱${cleanAmt}.`,
          "error"
        );
        return false;
      }
      const target = cmsSettings.donationCampaigns.find((c) => c.id === campaignId);
      if (!target) return false;

      const now = new Date().toISOString();
      const nextBalance = Number((profile.walletBalance - cleanAmt).toFixed(2));
      const nextProfile = { ...profile, walletBalance: nextBalance, updatedAt: now };
      setProfile(nextProfile);
      setAllUsers((prev) => prev.map((u) => (u.uid === profile.uid ? nextProfile : u)));

      const nextCampaigns = cmsSettings.donationCampaigns.map((c) =>
        c.id === campaignId ? { ...c, raisedAmount: c.raisedAmount + cleanAmt } : c
      );
      updateCmsSettings({ donationCampaigns: nextCampaigns });

      const client = supabaseRef.current;
      if (client) {
        await client
          .from("users")
          .update({ wallet_balance: nextBalance, updated_at: now })
          .eq("uid", profile.uid);
      }

      await logActivity(
        `Choy Cares donation ₱${cleanAmt.toFixed(2)} to "${target.title}" by ${profile.displayName}`,
        "system"
      );
      pushToast(
        "Thank You for Donating!",
        `₱${cleanAmt.toFixed(2)} donated to ${target.title}.`,
        "success"
      );
      return true;
    },
    [
      authUser,
      profile,
      cmsSettings.donationCampaigns,
      openAuthModal,
      updateCmsSettings,
      logActivity,
      pushToast,
    ]
  );

  return (
    <SupabaseContext.Provider
      value={{
        authUser,
        authReady,
        supabaseConfigured: Boolean(supabase),
        supabaseProjectLabel,
        profile,
        isSuperAdmin,
        isAdmin,
        isAuthModalOpen,
        authModalTargetRole,
        openAuthModal,
        closeAuthModal,
        dishes,
        allDishes,
        orders,
        allUsers,
        kycRecords,
        myKycRecord,
        activityLogs,
        supportTickets,
        toasts,
        pushToast,
        dismissToast,
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
        loginWithGoogle,
        logout,
        likeDish,
        addMenuDish,
        toggleDishAvailability,
        updateDishPrice,
        deleteMenuDish,
        placeOrder,
        advanceOrder,
        cancelOrder,
        rateOrder,
        fetchCustomerOrders,
        applyRealtimeOrderUpdate,
        activateChoyPro,
        updateUserAdmin,
        adjustRiderScore,
        submitKyc,
        reviewKyc,
        submitSupportTicket,
        resolveSupportTicket,
        dismissActivityLog,
        runSystemCleaner,
        clearOperationalDemoData,
        seedCatalogToSupabase,
        promos,
        allPromos,
        createPromoCode,
        togglePromoActive,
        validatePromoCode,
        rewardsSummary,
        redeemRewardPoints,
        awardGameBonusPoints,
        updateRiderProfile,
        updateCustomerProfile,
        changeUserPassword,
        isAskChoyOpen,
        openAskChoy,
        closeAskChoy,
        cmsSettings,
        updateCmsSettings,
        setStoreStatus,
        setStorePermit,
        approveDish,
        notifications,
        pushNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        riderDocsByUid,
        submitRiderOnboardingDocs,
        donateToCampaign,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export function useChoyFood() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useChoyFood must be used inside SupabaseProvider");
  return ctx;
}
