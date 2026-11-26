import {
  ChoyRewardsSummary,
  Order,
  PromoCode,
  RedeemedRewardVoucher,
  RewardOption,
  RewardOrderEntry,
} from "../types/choyfood";

export const CHOY_REWARD_OPTIONS: RewardOption[] = [
  {
    id: "rw_25",
    title: "₱25 Meal Discount",
    subtitle: "Great for solo merienda or quick lunch orders",
    pointsCost: 50,
    discount: 25,
    minSpend: 150,
  },
  {
    id: "rw_60",
    title: "₱60 Fiesta Voucher",
    subtitle: "Save on combo meals and sizzling favorites",
    pointsCost: 100,
    discount: 60,
    minSpend: 250,
  },
  {
    id: "rw_150",
    title: "₱150 Barkada Feast Off",
    subtitle: "Big savings for group trays and shared meals",
    pointsCost: 200,
    discount: 150,
    minSpend: 450,
  },
  {
    id: "rw_300",
    title: "₱300 Family Blowout",
    subtitle: "Top-tier reward voucher for family celebrations",
    pointsCost: 350,
    discount: 300,
    minSpend: 750,
  },
];

export function calculateOrderPoints(
  totalAmount: number,
  status: Order["status"]
): { basePoints: number; deliveryBonus: number; totalPoints: number } {
  if (status === "cancelled") {
    return { basePoints: 0, deliveryBonus: 0, totalPoints: 0 };
  }
  const safeTotal = Math.max(0, Number(totalAmount) || 0);
  const basePoints = safeTotal > 0 ? Math.max(5, Math.floor(safeTotal / 10)) : 0;
  const deliveryBonus = status === "delivered" ? 10 : 0;
  return {
    basePoints,
    deliveryBonus,
    totalPoints: basePoints + deliveryBonus,
  };
}

export function buildRewardVoucherDescription(
  title: string,
  uid: string,
  pointsCost: number
): string {
  return `Choy Rewards · ${title} · uid:${uid} · -${pointsCost} pts`;
}

export function parseRewardVoucherMeta(promo: PromoCode): {
  uid: string;
  pointsCost: number;
  title: string;
} | null {
  if (!promo.code.toUpperCase().startsWith("CHOYRW-")) return null;
  const uidMatch = promo.description.match(/uid:([^\s·]+)/);
  const ptsMatch = promo.description.match(/-(\d+)\s*pts/i);
  if (!uidMatch || !ptsMatch) return null;
  const parts = promo.description.split("·").map((s) => s.trim());
  const title = parts[1] || `₱${promo.discount.toFixed(0)} Discount Voucher`;
  return {
    uid: uidMatch[1],
    pointsCost: Number(ptsMatch[1]) || 0,
    title,
  };
}

export function getLoyaltyTier(lifetimePoints: number): {
  tierName: ChoyRewardsSummary["tierName"];
  nextTierName: string | null;
  nextTierPoints: number | null;
  tierProgressPct: number;
} {
  if (lifetimePoints >= 300) {
    return {
      tierName: "Gold Feast VIP",
      nextTierName: null,
      nextTierPoints: null,
      tierProgressPct: 100,
    };
  }
  if (lifetimePoints >= 100) {
    const pct = Math.min(100, Math.round(((lifetimePoints - 100) / 200) * 100));
    return {
      tierName: "Silver Foodie",
      nextTierName: "Gold Feast VIP",
      nextTierPoints: 300 - lifetimePoints,
      tierProgressPct: pct,
    };
  }
  const pct = Math.min(100, Math.round((lifetimePoints / 100) * 100));
  return {
    tierName: "Bronze Diner",
    nextTierName: "Silver Foodie",
    nextTierPoints: 100 - lifetimePoints,
    tierProgressPct: pct,
  };
}

export function computeChoyRewardsSummary(
  uid: string | undefined,
  orders: Order[],
  allPromos: PromoCode[],
  bonusPoints = 0
): ChoyRewardsSummary {
  if (!uid) {
    return {
      lifetimeEarned: 0,
      totalRedeemed: 0,
      availablePoints: 0,
      tierName: "Bronze Diner",
      nextTierName: "Silver Foodie",
      nextTierPoints: 100,
      tierProgressPct: 0,
      orderEntries: [],
      vouchers: [],
    };
  }

  const orderEntries: RewardOrderEntry[] = orders
    .filter((o) => o.customerId === uid && o.status !== "cancelled")
    .map((o) => {
      const calc = calculateOrderPoints(o.totalAmount, o.status);
      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        storeName: o.storeName,
        totalAmount: o.totalAmount,
        status: o.status,
        basePoints: calc.basePoints,
        deliveryBonus: calc.deliveryBonus,
        totalPoints: calc.totalPoints,
        createdAt: o.createdAt,
      };
    });

  const orderPoints = orderEntries.reduce((sum, entry) => sum + entry.totalPoints, 0);
  const lifetimeEarned = orderPoints + Math.max(0, Math.floor(bonusPoints));

  const vouchers: RedeemedRewardVoucher[] = [];
  for (const promo of allPromos) {
    const meta = parseRewardVoucherMeta(promo);
    if (!meta || meta.uid !== uid) continue;
    vouchers.push({
      id: promo.id,
      code: promo.code,
      title: meta.title,
      discount: promo.discount,
      minSpend: promo.minSpend,
      pointsCost: meta.pointsCost,
      active: promo.active,
      createdAt: promo.createdAt,
    });
  }

  const totalRedeemed = vouchers.reduce((sum, v) => sum + v.pointsCost, 0);
  const availablePoints = Math.max(0, lifetimeEarned - totalRedeemed);
  const tier = getLoyaltyTier(lifetimeEarned);

  return {
    lifetimeEarned,
    totalRedeemed,
    availablePoints,
    ...tier,
    orderEntries,
    vouchers,
  };
}
