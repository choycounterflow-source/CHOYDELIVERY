import React, { useState } from "react";
import { useChoyFood } from "../context/SupabaseContext";
import { CHOY_REWARD_OPTIONS } from "../lib/rewards";
import { RewardOption } from "../types/choyfood";
import {
  ArrowRight,
  Award,
  Check,
  Copy,
  Gift,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  Trophy,
} from "lucide-react";

interface ChoyRewardsSectionProps {
  onApplyRewardCode?: (code: string) => void;
  onExploreMenu: () => void;
}

export const ChoyRewardsSection: React.FC<ChoyRewardsSectionProps> = ({
  onApplyRewardCode,
  onExploreMenu,
}) => {
  const {
    authUser,
    rewardsSummary,
    redeemRewardPoints,
    fetchCustomerOrders,
    openAuthModal,
    pushToast,
  } = useChoyFood();

  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshPoints = async () => {
    if (!authUser) return;
    setRefreshing(true);
    try {
      await fetchCustomerOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const handleRedeem = async (option: RewardOption) => {
    setRedeemingId(option.id);
    try {
      await redeemRewardPoints(option);
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      pushToast("Voucher Copied", `${code} copied to clipboard.`, "info");
      window.setTimeout(() => {
        setCopiedCode((prev) => (prev === code ? null : prev));
      }, 2000);
    } catch {
      pushToast("Voucher Code", `Use code ${code} at checkout.`, "info");
    }
  };

  const readyVouchers = rewardsSummary.vouchers.filter((v) => v.active);
  const usedVouchers = rewardsSummary.vouchers.filter((v) => !v.active);

  return (
    <div className="space-y-8">
      {/* Points Balance & Loyalty Tier Banner */}
      <section className="bg-[#114B22] text-white rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-200">
              Choy Rewards Loyalty Program · 1 pt per ₱10 spent · +10 bonus pts per completed delivery
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Choy Rewards
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-xl">
              Earn points automatically on every meal order and redeem them anytime for instant
              discount vouchers in your Food Saver Bag.
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-2xl p-5 min-w-[230px] space-y-1 shrink-0">
            <div className="flex items-center justify-between gap-2 text-xs text-emerald-100">
              <span>Available Balance</span>
              <Award className="w-4 h-4 text-amber-300" />
            </div>
            <p className="font-display text-4xl font-extrabold tabular-nums text-white">
              {rewardsSummary.availablePoints.toLocaleString()}{" "}
              <span className="text-sm font-semibold text-amber-300">pts</span>
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-100/80 pt-1 tabular-nums">
              <span>Earned: {rewardsSummary.lifetimeEarned}</span>
              <span aria-hidden="true">·</span>
              <span>Redeemed: {rewardsSummary.totalRedeemed}</span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="bg-black/20 border border-white/10 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Current Tier: {rewardsSummary.tierName}</span>
            </div>
            <span className="text-emerald-100/85 tabular-nums">
              {rewardsSummary.nextTierName && rewardsSummary.nextTierPoints !== null
                ? `${rewardsSummary.nextTierPoints} more pts to reach ${rewardsSummary.nextTierName}`
                : "Maximum VIP tier unlocked"}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF5A1F] transition-all duration-300"
              style={{ width: `${rewardsSummary.tierProgressPct}%` }}
            />
          </div>
        </div>

        {!authUser && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-emerald-50">
              Sign in with your Customer account to sync points from your Supabase orders and unlock
              discount vouchers.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal("customer")}
              className="bg-[#FF5A1F] hover:bg-[#E54B12] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Sign In to Track Points
            </button>
          </div>
        )}
      </section>

      {/* Redeem Points for Discounts Catalog */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1C1917]">
              Redeem Points for Discounts
            </h2>
            <p className="text-xs text-stone-500">
              Converted vouchers are saved to your account and can be applied immediately at
              checkout.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            Balance: {rewardsSummary.availablePoints} pts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CHOY_REWARD_OPTIONS.map((option) => {
            const canAfford = Boolean(authUser && rewardsSummary.availablePoints >= option.pointsCost);
            const shortage = Math.max(0, option.pointsCost - rewardsSummary.availablePoints);
            const isRedeeming = redeemingId === option.id;

            return (
              <div
                key={option.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-stone-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-stone-500 tabular-nums">
                        Min. order ₱{option.minSpend.toFixed(0)} · Single-use voucher
                      </p>
                      <h3 className="font-display text-lg font-extrabold text-[#1C1917]">
                        {option.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-base font-extrabold text-[#FF5A1F] tabular-nums">
                        {option.pointsCost} pts
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{option.subtitle}</p>
                </div>

                <button
                  type="button"
                  disabled={!canAfford || isRedeeming}
                  onClick={() => handleRedeem(option)}
                  className={`w-full min-h-[42px] inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors ${
                    canAfford
                      ? "bg-[#FF5A1F] hover:bg-[#E54B12] text-white"
                      : "bg-stone-100 text-stone-500 cursor-not-allowed"
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {isRedeeming
                      ? "Redeeming..."
                      : !authUser
                      ? "Sign In to Redeem"
                      : canAfford
                      ? `Redeem for ₱${option.discount.toFixed(0)} OFF`
                      : `Need ${shortage} more pts`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Redeemed Discount Vouchers */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#FF5A1F]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Your Redeemed Discount Vouchers
              </h2>
              <p className="text-xs text-stone-500">
                Apply any active code directly in your Food Saver Bag
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            {readyVouchers.length} active · {usedVouchers.length} used
          </span>
        </div>

        {rewardsSummary.vouchers.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-[#1C1917]">No redeemed vouchers yet</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Once you earn at least 50 Choy Points from orders, redeem a discount voucher above and
              it will appear here ready for checkout.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {rewardsSummary.vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  voucher.active ? "" : "opacity-60"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-[#1C1917]">
                      {voucher.code}
                    </span>
                    <span className="text-xs text-stone-400" aria-hidden="true">
                      ·
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        voucher.active ? "text-[#114B22]" : "text-stone-500"
                      }`}
                    >
                      {voucher.active ? "Ready to use" : "Applied to order"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 tabular-nums">
                    {voucher.title} (₱{voucher.discount.toFixed(0)} OFF · Min. spend ₱
                    {voucher.minSpend.toFixed(0)}) · Redeemed for {voucher.pointsCost} pts
                  </p>
                </div>

                {voucher.active && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(voucher.code)}
                      className="inline-flex items-center gap-1.5 border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      {copiedCode === voucher.code ? (
                        <Check className="w-3.5 h-3.5 text-[#114B22]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedCode === voucher.code ? "Copied" : "Copy"}</span>
                    </button>
                    {onApplyRewardCode && (
                      <button
                        type="button"
                        onClick={() => onApplyRewardCode(voucher.code)}
                        className="inline-flex items-center gap-1.5 bg-[#114B22] hover:bg-[#0D3B1B] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <span>Use in Bag</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Points Earned from Orders Ledger */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Points Earned from Orders
            </h2>
            <p className="text-xs text-stone-500">
              Every non-cancelled order earns 1 pt per ₱10 spent, plus +10 bonus pts upon delivery
            </p>
          </div>
          {authUser && (
            <button
              type="button"
              onClick={handleRefreshPoints}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-[#FF5A1F] border border-stone-200 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync Orders"}</span>
            </button>
          )}
        </div>

        {rewardsSummary.orderEntries.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <ShoppingBag className="w-7 h-7 text-stone-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#1C1917]">No order points earned yet</p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Place your first meal order from our neighborhood kitchens to start earning Choy
                Rewards points automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreMenu}
              className="inline-flex items-center gap-1.5 bg-[#FF5A1F] hover:bg-[#E54B12] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <span>Browse Menus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 text-stone-500">
                <tr>
                  <th className="py-2.5 pr-4 font-semibold">Order</th>
                  <th className="py-2.5 px-3 font-semibold">Kitchen</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Order Total</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Points Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rewardsSummary.orderEntries.map((entry) => (
                  <tr key={entry.orderId} className="hover:bg-stone-50/70">
                    <td className="py-3 pr-4 font-mono font-bold text-[#1C1917]">
                      {entry.orderNumber}
                    </td>
                    <td className="py-3 px-3 text-stone-700">{entry.storeName}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-stone-700">
                      ₱{entry.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-stone-600 capitalize">
                      {entry.status.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono font-bold text-[#114B22] tabular-nums whitespace-nowrap">
                      +{entry.totalPoints} pts
                      {entry.deliveryBonus > 0 && (
                        <span className="text-[10px] font-normal text-stone-500 ml-1">
                          (+{entry.deliveryBonus} bonus)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
