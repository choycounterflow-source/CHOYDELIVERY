import React, { useState } from "react";
import { CreditCard, Lock, ShieldCheck, Smartphone, X } from "lucide-react";

interface SecurePaymentModalProps {
  isOpen: boolean;
  method: "Card" | "GCash";
  amount: number;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export const SecurePaymentModal: React.FC<SecurePaymentModalProps> = ({
  isOpen,
  method,
  amount,
  onSuccess,
  onClose,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [gcashOtp, setGcashOtp] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [reference, setReference] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment processing failed.");
      }
      setReference(data.reference);
      setStep("success");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Payment processing failed.");
      setStep("input");
    }
  };

  const handleFinish = () => {
    onSuccess(reference);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1F7A4C]" />
            <h3 className="font-display text-base font-bold text-[#1C1917]">
              Secure {method === "Card" ? "Stripe Credit/Debit Card" : "PayMaya / GCash E-Wallet"} Checkout
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "input" && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-[#1F7A4C]">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">PCI DSS Level 1 Certified &amp; 3D Secure Encrypted</p>
                <p className="text-[11px] text-stone-600">
                  Card and wallet details are tokenized securely. Raw numbers are never stored.
                </p>
              </div>
            </div>

            {method === "Card" ? (
              <>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Card Number (Tokenized)</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 font-mono text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      placeholder="12/28"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono text-sm tabular-nums"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mobile Number (GCash / PayMaya)</label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={gcashNumber}
                      onChange={(e) => setGcashNumber(e.target.value)}
                      placeholder="0917 000 0000"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-stone-300 font-mono text-sm tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">6-Digit SMS Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={gcashOtp}
                    onChange={(e) => setGcashOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono text-sm tracking-widest tabular-nums text-center"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Demo OTP: enter any 6 digits (e.g. 555888)
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <div>
                <p className="text-stone-500">Amount to Charge</p>
                <p className="font-display text-lg font-bold text-[#1C1917] font-mono tabular-nums">
                  ₱{amount.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1F7A4C] hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  Authorize Payment
                </button>
              </div>
            </div>
          </form>
        )}

        {step === "processing" && (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#1F7A4C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-display text-base font-bold text-[#1C1917]">
              Authorizing Secure {method === "Card" ? "Stripe" : "PayMaya"} Transaction...
            </p>
            <p className="text-xs text-stone-500">Processing tokenized 3D Secure authentication</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-[#1F7A4C] rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold text-[#1C1917]">Payment Authorized!</p>
              <p className="text-xs font-mono text-stone-600">Reference: {reference}</p>
            </div>
            <button
              onClick={handleFinish}
              className="w-full bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold py-3 rounded-lg transition-colors"
            >
              Complete Food Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
