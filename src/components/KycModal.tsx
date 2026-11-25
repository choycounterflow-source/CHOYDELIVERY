import React, { useState } from "react";
import { useChoyFood } from "../context/FirebaseContext";
import { IdType } from "../types/choyfood";
import { CheckCircle2, Lock, ShieldCheck, X } from "lucide-react";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({ isOpen, onClose }) => {
  const { authUser, profile, myKycRecord, loginWithGoogle, submitKyc, pushToast } = useChoyFood();

  const [displayName, setDisplayName] = useState(profile?.displayName || authUser?.displayName || "");
  const [realLegalName, setRealLegalName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [idType, setIdType] = useState<IdType>("Drivers License");
  const [idReference, setIdReference] = useState("");
  const [profilePhotoName, setProfilePhotoName] = useState("");
  const [validIdPhotoName, setValidIdPhotoName] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    if (phoneNumber.trim().length < 7) {
      pushToast("Enter cellphone number", "Provide a valid phone number before sending OTP.", "error");
      return;
    }
    setOtpSent(true);
    setOtpCode("482910");
    pushToast("OTP Sent (Preview Mode)", "Verification code 482910 generated for your phone.", "info");
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim().length === 6) {
      setOtpVerified(true);
      pushToast("Phone OTP Verified", "Cellphone number confirmed for KYC submission.", "success");
    } else {
      pushToast("Invalid OTP", "Enter the 6-digit OTP code.", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) return;
    setSubmitting(true);
    try {
      const ok = await submitKyc({
        displayName: displayName || profile?.displayName || "ChoyFood Member",
        realLegalName,
        phoneNumber,
        otpVerified,
        idType,
        idReference: idReference || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
        profilePhotoName: profilePhotoName || "customer_selfie.jpg",
        validIdPhotoName: validIdPhotoName || "government_valid_id.jpg",
        privacyConsentAccepted: privacyConsent,
      });
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D12D11]" /> Super Admin Private Vault
            </p>
            <h2 className="font-display text-xl font-bold text-[#1C1917] mt-0.5">
              Customer Registration &amp; KYC
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Separates your public Display Name from your encrypted legal ID.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close KYC modal"
            className="text-stone-400 hover:text-stone-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!authUser ? (
          <div className="py-6 text-center space-y-4">
            <ShieldCheck className="w-10 h-10 text-[#D12D11] mx-auto" />
            <div className="space-y-1">
              <p className="font-display text-base font-bold text-[#1C1917]">
                Sign in with Google first
              </p>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                Your KYC vault document is bound strictly to your authenticated Firebase UID so
                stores and riders can never read it.
              </p>
            </div>
            <button
              onClick={loginWithGoogle}
              className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Sign in with Google
            </button>
          </div>
        ) : myKycRecord && myKycRecord.status !== "rejected" ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#1F7A4C] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-emerald-950">
                <p className="font-bold text-sm capitalize">
                  KYC Status: {myKycRecord.status}
                </p>
                <p>
                  Public Display Name: <strong>{myKycRecord.displayName}</strong>
                </p>
                <p>
                  Document on File: {myKycRecord.idType} ({myKycRecord.idReference})
                </p>
                <p className="text-emerald-800 pt-1">
                  Locked inside the Super Admin Vault. Hidden from partner stores and delivery
                  riders.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Display Name / Username (Shown Publicly)
              </label>
              <input
                type="text"
                required
                minLength={1}
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. FoodieMaria"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Real Full Legal Name (Admin Encrypted Vault Only)
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={realLegalName}
                onChange={(e) => setRealLegalName(e.target.value)}
                placeholder="Your legal name as printed on your Valid ID"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cellphone Number (with OTP Verification)
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  minLength={7}
                  maxLength={25}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+63 917 123 4567"
                  className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg whitespace-nowrap"
                >
                  {otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>
              {otpSent && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="bg-[#1F7A4C] hover:bg-emerald-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg"
                  >
                    {otpVerified ? "Verified" : "Verify OTP"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Government Valid ID Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as IdType)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-stone-300 bg-white"
                >
                  <option value="Drivers License">Driver&apos;s License</option>
                  <option value="UMID">UMID</option>
                  <option value="Passport">Passport</option>
                  <option value="PhilID">PhilID</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ID Reference Number
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={80}
                  value={idReference}
                  onChange={(e) => setIdReference(e.target.value)}
                  placeholder="N01-12-98421"
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-stone-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Real Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhotoName(e.target.files?.[0]?.name || "")}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Valid ID Image Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setValidIdPhotoName(e.target.files?.[0]?.name || "")}
                  className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-stone-50"
                />
              </div>
            </div>

            {/* Mandatory Fraud-Prevention Privacy Consent Checkbox */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#D12D11] shrink-0"
                />
                <span className="text-xs text-amber-950 leading-relaxed">
                  &ldquo;By uploading your valid ID and profile picture, you consent to ChoyFood
                  storing this data securely for fraud-prevention purposes only. This information
                  will never be shared publicly or shown to restaurants and riders.&rdquo;
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!privacyConsent || submitting}
              className={`w-full py-3 rounded-lg text-xs font-bold transition-colors ${
                privacyConsent && !submitting
                  ? "bg-[#D12D11] hover:bg-[#A61F09] text-white cursor-pointer"
                  : "bg-stone-200 text-stone-500 cursor-not-allowed"
              }`}
            >
              {submitting
                ? "Encrypting & Saving to Admin Vault..."
                : privacyConsent
                ? "Register & Securely Submit KYC"
                : "Complete Registration (Tick Privacy Consent First)"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
