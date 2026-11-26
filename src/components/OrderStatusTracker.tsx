import React from "react";
import { Order } from "../types/choyfood";
import { DISTANCE_FEES, ORDER_STEPS } from "../data/seedData";
import {
  Bike,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  PackageCheck,
  XCircle,
} from "lucide-react";

interface OrderStatusTrackerProps {
  order: Order;
  compact?: boolean;
}

const VISUAL_MILESTONES = [
  {
    key: "placed",
    label: "Order Placed",
    minStep: 1,
    activeDetail: "Order received and confirmed by ChoyFood dispatch.",
    icon: ClipboardCheck,
  },
  {
    key: "preparing",
    label: "Preparing",
    minStep: 3,
    activeDetail: "The partner kitchen is cooking your meal fresh.",
    icon: Flame,
  },
  {
    key: "ready",
    label: "Ready for Pickup",
    minStep: 5,
    activeDetail: "Packed hot and waiting at the counter for your rider.",
    icon: PackageCheck,
  },
  {
    key: "out_for_delivery",
    label: "Out for Delivery",
    minStep: 6,
    activeDetail: "Your rider has picked up the order and is heading to you.",
    icon: Bike,
  },
  {
    key: "delivered",
    label: "Delivered",
    minStep: 7,
    activeDetail: "Order arrived safely. Enjoy your meal!",
    icon: CheckCircle2,
  },
] as const;

export function getMilestoneIndex(order: Order): number {
  if (order.status === "cancelled") return -1;
  if (order.step >= 7 || order.status === "delivered") return 4;
  if (order.step >= 6 || order.status === "picked_up") return 3;
  if (order.step >= 5 || order.status === "food_ready") return 2;
  if (order.step >= 3 || order.status === "store_accepted" || order.status === "rider_accepted") {
    return 1;
  }
  return 0;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  order,
  compact = false,
}) => {
  const activeIdx = getMilestoneIndex(order);
  const isCancelled = order.status === "cancelled";
  const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
  const tierInfo = DISTANCE_FEES[order.distanceTier] || DISTANCE_FEES["0-2km"];

  if (isCancelled) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-2.5 text-xs text-rose-800">
        <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
        <div>
          <p className="font-semibold">Order Cancelled</p>
          <p className="text-[11px] text-rose-700">
            This order was cancelled before kitchen handoff.
          </p>
        </div>
      </div>
    );
  }

  const activeMilestone = VISUAL_MILESTONES[Math.max(0, activeIdx)];
  const progressFraction = activeIdx / (VISUAL_MILESTONES.length - 1);

  return (
    <div
      className={
        compact
          ? "rounded-xl bg-white border border-stone-200 p-3.5 space-y-3"
          : "rounded-2xl bg-stone-50 border border-stone-200 p-5 space-y-4"
      }
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-[#1C1917] flex items-center gap-2">
            <span>{activeMilestone.label}</span>
            <span className="text-[11px] font-normal text-stone-500">
              · {stepMeta?.shortLabel || `Step ${order.step}`}
            </span>
          </p>
          <p className="text-[11px] text-stone-600">{activeMilestone.activeDetail}</p>
        </div>
        <div className="text-[11px] font-mono text-stone-500 tabular-nums whitespace-nowrap">
          {order.status === "delivered"
            ? "Completed"
            : `Est. ${tierInfo.eta}${order.riderCode ? ` · Rider ${order.riderCode}` : ""}`}
        </div>
      </div>

      {/* Horizontal Milestone Track */}
      <div className="relative pt-1">
        {/* Background & Active Connecting Track (desktop/tablet) */}
        <div
          aria-hidden="true"
          className="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-stone-200 rounded-full overflow-hidden"
        >
          <div
            className={`h-full origin-left transition-transform duration-500 ease-out rounded-full ${
              order.status === "delivered" ? "bg-[#1F7A4C]" : "bg-[#D12D11]"
            }`}
            style={{ transform: `scaleX(${Math.max(0.02, progressFraction)})` }}
          />
        </div>

        <ol
          aria-label={`Order ${order.orderNumber} live progress`}
          className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10"
        >
          {VISUAL_MILESTONES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIdx || (idx === 4 && activeIdx === 4);
            const isCurrent = idx === activeIdx && activeIdx < 4;

            return (
              <li key={stage.key} className="flex flex-col items-center text-center gap-1.5">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? "bg-[#1F7A4C] border-[#1F7A4C] text-white"
                      : isCurrent
                      ? "bg-[#D12D11] border-[#D12D11] text-white ring-4 ring-[#D12D11]/20"
                      : "bg-white border-stone-300 text-stone-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight font-semibold ${
                    isCompleted
                      ? "text-[#1F7A4C]"
                      : isCurrent
                      ? "text-[#D12D11]"
                      : "text-stone-400"
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
