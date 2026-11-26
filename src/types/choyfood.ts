export type AppView =
  | "landing"
  | "super_admin"
  | "admin"
  | "store"
  | "rider"
  | "customer"
  | "blog"
  | "about"
  | "contact"
  | "privacy";

export type UserRole = "super_admin" | "admin" | "store" | "rider" | "customer";

export type SaleGroup = "Combo Meal" | "Solo" | "Extra" | "Promo" | "Good for Family";

export type DistanceTier = "0-2km" | "2-5km" | "5-10km";

export type PaymentMethod = "COD" | "GCash" | "Card" | "ChoyWallet";

export type OrderStatus =
  | "picked"
  | "admin_checked"
  | "store_accepted"
  | "rider_accepted"
  | "food_ready"
  | "picked_up"
  | "delivered"
  | "cancelled";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export type IdType = "Drivers License" | "UMID" | "Passport" | "PhilID";

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  walletBalance: number;
  choyProActive: boolean;
  kycStatus: KycStatus;
  riderCode?: string;
  storeName?: string;
  referralCode?: string;
  referralEarnings?: number;
  referredCount?: number;
  ratingScore?: number;
  riderPhotoUrl?: string;
  avatarUrl?: string;
  nickname?: string;
  gameBonusPoints?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RiderOnboardingDocs {
  uid: string;
  legalFullName: string;
  nickname: string;
  publicHandle: string;
  address: string;
  contactNumber: string;
  age: string;
  sex: "Male" | "Female" | "Prefer not to say";
  civilStatus: "Single" | "Married" | "Widowed" | "Separated";
  licenseNumber: string;
  licenseExpiry: string;
  vehicleType: "Motorcycle" | "Bicycle / E-Bike" | "Tricycle";
  plateNumber: string;
  orCrNumber: string;
  orCrExpiry: string;
  vehiclePhotoName: string;
  barangayClearanceRef: string;
  cityClearanceRef: string;
  policeClearanceRef: string;
  sssNumber?: string;
  pagibigNumber?: string;
  philhealthNumber?: string;
  tinNumber?: string;
  cameraVerifiedAt?: string;
  updatedAt: string;
}

export interface KycVaultRecord {
  uid: string;
  displayName: string;
  realLegalName: string;
  phoneNumber: string;
  otpVerified: boolean;
  idType: IdType;
  idReference: string;
  profilePhotoName: string;
  validIdPhotoName: string;
  privacyConsentAccepted: boolean;
  status: "pending" | "verified" | "rejected";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type DishApprovalStatus = "approved" | "pending" | "rejected";

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  saleGroup: SaleGroup;
  storeName: string;
  storeOwnerId: string;
  imageUrl: string;
  likes: number;
  available: boolean;
  approvalStatus?: DishApprovalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  dish: Dish;
  qty: number;
}

export interface OrderItemSummary {
  dishId: string;
  name: string;
  price: number;
  qty: number;
}

export interface DeliveryCoords {
  lat: number;
  lng: number;
  label?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerDisplayName: string;
  storeName: string;
  storeOwnerId: string;
  riderId: string;
  riderCode: string;
  items: OrderItemSummary[];
  subtotal: number;
  distanceTier: DistanceTier;
  deliveryFee: number;
  discount: number;
  tipAmount?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  deliveryNote: string;
  deliveryCoords?: DeliveryCoords | null;
  step: number;
  status: OrderStatus;
  proofOfDeliveryNote: string;
  rating?: number;
  reviewComment?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SupportTicket {
  id: string;
  uid: string;
  fullName: string;
  contact: string;
  category: string;
  message: string;
  referenceCode: string;
  status: "open" | "resolved";
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityLog {
  id: string;
  message: string;
  category: "order" | "kyc" | "store" | "rider" | "system";
  actorId: string;
  createdAt?: unknown;
}

export interface BlogPost {
  id: string;
  title: string;
  readMinutes: number;
  publishedDate: string;
  tag: string;
  summary: string;
  body: string[];
  imageUrl: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  minSpend: number;
  description: string;
  active: boolean;
  createdAt?: unknown;
}

export interface SlidePhoto {
  id: string;
  imageUrl: string;
  caption: string;
  promoCode?: string;
}

export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
}

export type StoreOperatingStatus = "open" | "closed" | "coming_soon";

export interface StorePermitChecklist {
  dti: boolean;
  bir: boolean;
  mayors: boolean;
  sanitary: boolean;
}

export interface NotificationItem {
  id: string;
  audience: "admin" | "customer" | "rider" | "store" | "all";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface PlatformCmsSettings {
  bannerText: string;
  slides: SlidePhoto[];
  aiKnowledgeBase: string;
  referralBonusCustomer: number;
  referralBonusRider: number;
  choyProMonthlyFee: number;
  soundEnabled: boolean;
  storeStatuses: Record<string, StoreOperatingStatus>;
  storePermits: Record<string, StorePermitChecklist>;
  dishApprovals: Record<string, DishApprovalStatus>;
  donationCampaigns: DonationCampaign[];
  riderShiftAssignments: Record<string, string>;
}

export interface RewardOption {
  id: string;
  title: string;
  subtitle: string;
  pointsCost: number;
  discount: number;
  minSpend: number;
}

export interface RewardOrderEntry {
  orderId: string;
  orderNumber: string;
  storeName: string;
  totalAmount: number;
  status: OrderStatus;
  basePoints: number;
  deliveryBonus: number;
  totalPoints: number;
  createdAt?: unknown;
}

export interface RedeemedRewardVoucher {
  id: string;
  code: string;
  title: string;
  discount: number;
  minSpend: number;
  pointsCost: number;
  active: boolean;
  createdAt?: unknown;
}

export interface ChoyRewardsSummary {
  lifetimeEarned: number;
  totalRedeemed: number;
  availablePoints: number;
  tierName: "Bronze Diner" | "Silver Foodie" | "Gold Feast VIP";
  nextTierName: string | null;
  nextTierPoints: number | null;
  tierProgressPct: number;
  orderEntries: RewardOrderEntry[];
  vouchers: RedeemedRewardVoucher[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

// Validation constants synchronized with supabase_schema.sql & RLS policies
export const BLUEPRINT_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  orderCodePattern: /^CF-[0-9A-Z]+$/,
  displayNameMax: 60,
  realLegalNameMax: 120,
  phoneMax: 25,
  idRefMax: 80,
  photoNameMax: 120,
  dishNameMax: 100,
  dishDescMax: 300,
  storeNameMax: 80,
  addressMax: 240,
  deliveryNoteMax: 200,
  ticketMessageMax: 1000,
  logMessageMax: 240,
} as const;
