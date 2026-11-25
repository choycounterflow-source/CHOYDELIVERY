export type AppView =
  | "landing"
  | "customer"
  | "rider"
  | "store"
  | "admin"
  | "blog"
  | "about"
  | "contact"
  | "privacy";

export type UserRole = "customer" | "rider" | "store" | "admin";

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
  createdAt?: unknown;
  updatedAt?: unknown;
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
  totalAmount: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  deliveryNote: string;
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
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

// Validation constants synchronized verbatim with firebase-blueprint.json & firestore.rules
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
