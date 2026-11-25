import React, { useState } from "react";
import { Order } from "../types/choyfood";
import { Navigation, MapPin, Store, CheckCircle2, ChevronRight, Compass, Clock, ArrowRight, CornerUpRight } from "lucide-react";

interface RiderNavigationMapProps {
  activeOrder?: Order;
}

export const RiderNavigationMap: React.FC<RiderNavigationMapProps> = ({ activeOrder }) => {
  const [navStepIndex, setNavStepIndex] = useState(0);

  const storeName = activeOrder?.storeName || "ChoyFood Partner Kitchen (Surigao/Cebu)";
  const address = activeOrder?.deliveryAddress || "Purok 4, Surigao City & Cebu Central";
  const tier = activeOrder?.distanceTier || "2-5km";
  const eta = tier === "0-2km" ? "8 mins" : tier === "2-5km" ? "15 mins" : "28 mins";

  const steps = [
    { instruction: `Depart from ${storeName} kitchen`, distance: "0 m", icon: Store },
    { instruction: "Head north on main provincial arterial road", distance: "450 m", icon: ArrowRight },
    { instruction: "Turn right at the traffic intersection toward commercial strip", distance: "1.2 km", icon: CornerUpRight },
    { instruction: `Arrive at delivery pin: ${address}`, distance: "300 m", icon: MapPin },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1C1917] flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#1F7A4C]" />
            <span>Turn-by-Turn Rider Navigation</span>
          </h2>
          <p className="text-xs text-stone-500">
            Optimized free routing from pickup partner kitchen to customer destination.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-[#1F7A4C] text-xs font-bold px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>ETA: {eta}</span>
          </span>
          <span className="bg-stone-100 text-stone-700 text-xs font-mono font-bold px-3 py-1 rounded-lg">
            {tier}
          </span>
        </div>
      </div>

      {/* Free Interactive OpenStreetMap Embed */}
      <div className="relative rounded-xl overflow-hidden border border-stone-200 h-64 sm:h-72 bg-stone-100">
        <iframe
          title="Free Route Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=125.49%2C9.75%2C125.55%2C9.80&layer=mapnik&marker=9.78%2C125.50`}
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-stone-200 rounded-lg p-2.5 shadow-md space-y-1 text-xs">
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-[#D12D11]" />
            <span className="truncate max-w-[200px]">{storeName}</span>
          </p>
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1F7A4C]" />
            <span className="truncate max-w-[200px]">{address}</span>
          </p>
        </div>
      </div>

      {/* Turn-by-Turn Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Navigation Maneuvers ({navStepIndex + 1} of {steps.length})
          </p>
          <button
            onClick={() => setNavStepIndex((prev) => (prev + 1) % steps.length)}
            className="text-xs font-semibold text-[#1F7A4C] hover:underline"
          >
            Next Step →
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = idx === navStepIndex;
            const isDone = idx < navStepIndex;
            return (
              <div
                key={idx}
                onClick={() => setNavStepIndex(idx)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                  isCurrent
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold shadow-xs"
                    : isDone
                    ? "bg-stone-50 border-stone-200 text-stone-500 opacity-75"
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? "bg-[#1F7A4C] text-white" : "bg-stone-100 text-stone-600"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={isCurrent ? "font-bold text-[#1F7A4C]" : ""}>{s.instruction}</p>
                    <p className="text-[11px] text-stone-500 font-mono">Distance: {s.distance}</p>
                  </div>
                </div>
                {isCurrent && (
                  <span className="bg-[#1F7A4C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
