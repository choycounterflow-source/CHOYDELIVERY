import React, { useEffect, useState } from "react";
import { CartItem, DeliveryCoords, DistanceTier, PaymentMethod } from "../types/choyfood";
import { DISTANCE_FEES } from "../data/seedData";
import { calculateOrderPoints } from "../lib/rewards";
import { useChoyFood } from "../context/SupabaseContext";
import { Award, Crosshair, Heart, MapPin, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { SecurePaymentModal } from "./SecurePaymentModal";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onChangeQty: (dishId: string, delta: number) => void;
  onClearCart: () => void;
  externalPromoCode?: string;
  externalPromoSeq?: number;
}

const PIN_PRESETS: { label: string; coords: DeliveryCoords; address: string; tier: DistanceTier }[] = [
  {
    label: "Surigao City Proper",
    coords: { lat: 9.789, lng: 125.495, label: "Surigao City Proper" },
    address: "Rizal St., Brgy. Washington, Surigao City",
    tier: "0-2km",
  },
  {
    label: "Banilad / Cebu IT Park",
    coords: { lat: 10.3304, lng: 123.9058, label: "Cebu IT Park / Banilad" },
    address: "Unit 402, Acacia Heights, Banilad, Cebu",
    tier: "0-2km",
  },
  {
    label: "Surigao Luna / Sabang",
    coords: { lat: 9.768, lng: 125.482, label: "Brgy. Luna / Sabang" },
    address: "National Highway, Brgy. Luna, Surigao City",
    tier: "2-5km",
  },
];

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onChangeQty,
  onClearCart,
  externalPromoCode,
  externalPromoSeq,
}) => {
  const { authUser, profile, promos, rewardsSummary, placeOrder, openAuthModal, pushToast } =
    useChoyFood();

  const [distanceTier, setDistanceTier] = useState<DistanceTier>("0-2km");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [promoCode, setPromoCode] = useState("CHOY25");
  const [deliveryAddress, setDeliveryAddress] = useState("Unit 402, Acacia Heights, Banilad, Cebu");
  const [deliveryNote, setDeliveryNote] = useState("Leave at guardhouse lobby");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTipInput, setCustomTipInput] = useState<string>("");
  const [deliveryCoords, setDeliveryCoords] = useState<DeliveryCoords | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isSecureModalOpen, setIsSecureModalOpen] = useState(false);
  const [secureMethod, setSecureMethod] = useState<"Card" | "GCash">("Card");

  useEffect(() => {
    if (externalPromoCode) {
      setPromoCode(externalPromoCode);
    }
  }, [externalPromoCode, externalPromoSeq]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.dish.price * item.qty, 0);
  const rawDeliveryFee = DISTANCE_FEES[distanceTier].fee;
  const deliveryFee = profile?.choyProActive ? 0 : rawDeliveryFee;

  const normalizedPromo = promoCode.trim().toUpperCase();
  const matchedPromo = promos.find(
    (p) => p.active && p.code.toUpperCase() === normalizedPromo
  );
  const promoApplied = Boolean(matchedPromo && subtotal >= matchedPromo.minSpend);
  const discount = promoApplied && matchedPromo ? matchedPromo.discount : 0;
  const safeTip = Math.max(0, Number(tipAmount) || 0);
  const grandTotal = Math.max(0, subtotal + deliveryFee + safeTip - discount);
  const estimatedPoints = calculateOrderPoints(grandTotal, "picked").totalPoints;

  const readyRewardVouchers = rewardsSummary.vouchers.filter((v) => v.active);

  const handlePinCurrentLocation = () => {
    if (!navigator.geolocation) {
      const fallback = PIN_PRESETS[0];
      setDeliveryCoords(fallback.coords);
      pushToast(
        "Location Pinned",
        `Using verified landmark: ${fallback.coords.label}`,
        "info"
      );
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: DeliveryCoords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          label: "Current GPS Pin",
        };
        setDeliveryCoords(coords);
        setLocatingGps(false);
        pushToast(
          "GPS Location Pinned",
          `Coordinates ${coords.lat}, ${coords.lng} attached for your rider.`,
          "success"
        );
      },
      () => {
        setLocatingGps(false);
        const fallback = PIN_PRESETS[0];
        setDeliveryCoords(fallback.coords);
        pushToast(
          "GPS Unavailable — Preset Applied",
          `Pinned ${fallback.coords.label}. You can also select a zone preset below.`,
          "info"
        );
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const executeOrderPlacement = async (paymentRef?: string) => {
    setSubmitting(true);
    try {
      const primaryStore = cart[0].dish;
      const noteWithRef = paymentRef
        ? `${deliveryNote} [Paid via ${paymentMethod} Ref: ${paymentRef}]`
        : deliveryNote;

      const created = await placeOrder({
        items: cart.map((c) => ({
          dishId: c.dish.id,
          name: c.dish.name,
          price: c.dish.price,
          qty: c.qty,
        })),
        subtotal,
        distanceTier,
        paymentMethod,
        promoCode,
        deliveryAddress,
        deliveryNote: noteWithRef,
        tipAmount: safeTip,
        deliveryCoords,
        storeName: primaryStore.storeName,
        storeOwnerId: primaryStore.storeOwnerId,
      });
      if (created) {
        onClearCart();
        setTipAmount(0);
        setCustomTipInput("");
        if (normalizedPromo.startsWith("CHOYRW-")) {
          setPromoCode("CHOY25");
        }
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!authUser) {
      openAuthModal("customer");
      return;
    }

    if (paymentMethod === "Card") {
      setSecureMethod("Card");
      setIsSecureModalOpen(true);
      return;
    }
    if (paymentMethod === "GCash") {
      setSecureMethod("GCash");
      setIsSecureModalOpen(true);
      return;
    }

    await executeOrderPlacement();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
        <aside className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl border-l border-stone-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#D12D11]" />
              <h2 className="font-display text-lg font-bold text-[#1C1917]">Food Saver Bag</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close cart drawer"
              className="p-1.5 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Items & Delivery Config */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {cart.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="font-display text-base font-bold text-[#1C1917]">Your bag is empty</p>
                <p className="text-xs text-stone-500">
                  Add Filipino combos, sizzling mains, or desserts from the menu to start an order.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-stone-100">
                  {cart.map((item) => (
                    <div key={item.dish.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1C1917] truncate">
                          {item.dish.name}
                        </p>
                        <p className="text-xs text-stone-500 font-mono tabular-nums">
                          ₱{item.dish.price.toFixed(2)} × {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onChangeQty(item.dish.id, -1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                        >
                          {item.qty === 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onChangeQty(item.dish.id, 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Settings */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Delivery Distance Tier
                    </label>
                    <select
                      value={distanceTier}
                      onChange={(e) => setDistanceTier(e.target.value as DistanceTier)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs"
                    >
                      <option value="0-2km">0 - 2 km (₱25.00 · Near Delivery)</option>
                      <option value="2-5km">2 - 5 km (₱35.00 · Standard Town)</option>
                      <option value="5-10km">5 - 10 km (₱50.00 · Extended Distance)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs"
                    >
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="GCash">GCash / PayMaya E-Wallet (Secure 3DS)</option>
                      <option value="Card">Debit / Credit Card (Stripe Tokenized)</option>
                      <option value="ChoyWallet">
                        Choy Wallet (₱{(profile?.walletBalance ?? 150).toFixed(2)} Available)
                      </option>
                    </select>
                  </div>

                  {/* Rider Tip Selector */}
                  <div>
                    <label className="flex items-center gap-1.5 font-semibold text-stone-700 mb-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#D12D11]" />
                      <span>Optional Rider Tip (100% goes to your rider)</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0, 10, 20, 50].map((preset) => {
                        const active = tipAmount === preset && customTipInput === "";
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setTipAmount(preset);
                              setCustomTipInput("");
                            }}
                            className={`py-1.5 rounded-lg border text-[11px] font-mono font-semibold tabular-nums transition-colors ${
                              active
                                ? "bg-[#114B22] border-[#114B22] text-white"
                                : "bg-white border-stone-300 text-stone-700 hover:border-[#114B22]"
                            }`}
                          >
                            {preset === 0 ? "None" : `₱${preset}`}
                          </button>
                        );
                      })}
                      <input
                        type="number"
                        min={0}
                        max={2000}
                        placeholder="Custom"
                        value={customTipInput}
                        onChange={(e) => {
                          setCustomTipInput(e.target.value);
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setTipAmount(val);
                        }}
                        aria-label="Custom rider tip amount"
                        className="px-2 py-1.5 rounded-lg border border-stone-300 bg-white font-mono text-[11px] text-center tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Promo / Choy Rewards Voucher Code
                    </label>
                    <div className="relative">
                      <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="CHOY25 or CHOYRW-XXXX"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-300 bg-white font-mono uppercase text-xs"
                      />
                    </div>
                    <p
                      className={`text-[11px] mt-1 ${
                        promoApplied ? "text-[#114B22] font-semibold" : "text-stone-500"
                      }`}
                    >
                      {promoApplied && matchedPromo
                        ? `${matchedPromo.code} applied: ₱${matchedPromo.discount.toFixed(2)} off your meal.`
                        : matchedPromo
                        ? `Add ₱${(matchedPromo.minSpend - subtotal).toFixed(2)} more to unlock ${matchedPromo.code} (min. ₱${matchedPromo.minSpend.toFixed(0)}).`
                        : "Use CHOY25 on orders ₱250+ or apply a redeemed Choy Rewards voucher."}
                    </p>

                    {readyRewardVouchers.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-stone-200/80 space-y-1.5">
                        <p className="text-[11px] font-semibold text-[#114B22]">
                          Your Ready Choy Rewards Vouchers:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {readyRewardVouchers.map((v) => {
                            const selected = normalizedPromo === v.code.toUpperCase();
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setPromoCode(v.code)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-colors ${
                                  selected
                                    ? "bg-[#114B22] border-[#114B22] text-white"
                                    : "bg-white border-stone-300 text-stone-700 hover:border-[#114B22]"
                                }`}
                              >
                                {v.code} (-₱{v.discount.toFixed(0)})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Address & GPS Location Pin Check */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-semibold text-stone-700">Delivery Address &amp; Pin</label>
                      <button
                        type="button"
                        onClick={handlePinCurrentLocation}
                        disabled={locatingGps}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#114B22] hover:underline disabled:opacity-60"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>{locatingGps ? "Checking GPS..." : "Check / Pin GPS"}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={240}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PIN_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setDeliveryAddress(preset.address);
                            setDeliveryCoords(preset.coords);
                            setDistanceTier(preset.tier);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-stone-200 hover:border-[#114B22] text-[10px] font-medium text-stone-700"
                        >
                          <MapPin className="w-3 h-3 text-[#D12D11]" />
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                    {deliveryCoords && (
                      <p className="text-[11px] font-mono text-[#114B22] bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1.5">
                        Pinned: {deliveryCoords.label || "GPS"} ({deliveryCoords.lat}, {deliveryCoords.lng})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Drop-Off Note for Rider
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      placeholder="Optional landmark or gate instructions"
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Totals & Checkout CTA */}
          <div className="px-6 py-5 border-t border-stone-200 bg-stone-50/70 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Food Subtotal</span>
                <span className="font-mono tabular-nums">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  Delivery Fee ({distanceTier}
                  {profile?.choyProActive ? " · Choy Pro Free" : ""})
                </span>
                <span className="font-mono tabular-nums">₱{deliveryFee.toFixed(2)}</span>
              </div>
              {safeTip > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Rider Tip</span>
                  <span className="font-mono tabular-nums">₱{safeTip.toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && matchedPromo && (
                <div className="flex justify-between text-[#1F7A4C] font-semibold">
                  <span>Discount ({matchedPromo.code})</span>
                  <span className="font-mono tabular-nums">-₱{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#1C1917] pt-2 border-t border-stone-200">
                <span>Total Pay</span>
                <span className="font-mono tabular-nums">₱{grandTotal.toFixed(2)}</span>
              </div>
              {cart.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-[#114B22] font-semibold pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Choy Rewards Earned
                  </span>
                  <span className="font-mono tabular-nums">+{estimatedPoints} pts</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className="w-full bg-[#D12D11] hover:bg-[#A61F09] disabled:bg-stone-300 disabled:text-stone-500 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
            >
              {submitting
                ? "Submitting Order..."
                : !authUser
                ? "Sign In to Checkout"
                : paymentMethod === "Card" || paymentMethod === "GCash"
                ? `Proceed to Secure ${paymentMethod === "Card" ? "Stripe" : "PayMaya"} Payment (₱${grandTotal.toFixed(2)})`
                : "Confirm Food Order (Step 1)"}
            </button>
          </div>
        </aside>
      </div>

      <SecurePaymentModal
        isOpen={isSecureModalOpen}
        method={secureMethod}
        amount={grandTotal}
        onSuccess={(ref) => {
          executeOrderPlacement(ref);
        }}
        onClose={() => setIsSecureModalOpen(false)}
      />
    </>
  );
};
