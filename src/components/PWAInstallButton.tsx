import React, { useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { useOnlineStatus, usePWAInstall } from "../hooks/usePWAInstall";
import { useChoyFood } from "../context/SupabaseContext";

interface PWAInstallButtonProps {
  variant?: "header" | "sidebar";
  onActionComplete?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = "header",
  onActionComplete,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { pushToast } = useChoyFood();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Suppress install prompt when already running in standalone installed mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        pushToast("App Installed", "CHOY DELIVERY is now installed on your device!", "success");
        onActionComplete?.();
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[44px] flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#1C1917] text-xs font-extrabold transition-colors shadow-xs"
        >
          <span className="inline-flex items-center gap-3">
            <Download className="w-4 h-4 text-[#D12D11]" />
            <span>{isIOS ? "Install App (iPhone / iPad)" : "Install ChoyDelivery App"}</span>
          </span>
          <span className="text-[10px] font-mono uppercase bg-white/80 text-[#114B22] px-1.5 py-0.5 rounded">
            PWA
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-[#1C1917] text-xs font-semibold px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Install CHOY DELIVERY App"
        >
          <Download className="w-3.5 h-3.5 text-[#D12D11]" />
          <span className="hidden sm:inline">{isIOS ? "Install iOS App" : "Install App"}</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install CHOY DELIVERY App Guide"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-6 shadow-2xl space-y-4 text-[#1C1917]">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D12D11] text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">
                    {isIOS ? "Install on iPhone / iPad" : "Install CHOY DELIVERY"}
                  </h3>
                  <p className="text-[11px] text-stone-500">Add to your Home Screen for 1-tap access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#D12D11]">1.</span>
                  <span>
                    Tap the <strong className="inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 text-sky-600 inline" /></strong> button in your Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#D12D11]">2.</span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#D12D11]">3.</span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner to launch CHOY DELIVERY fullscreen.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#D12D11]">1.</span>
                  <span>
                    Open this site directly in <strong>Chrome, Edge, or Samsung Internet</strong> (outside an in-app preview).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-mono font-bold text-[#D12D11]">2.</span>
                  <span>
                    Tap the browser menu (<strong>⋮</strong>) or the install icon in the address bar, then select{" "}
                    <strong>Install app</strong> / <strong>Add to Home screen</strong>.
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => {
                setShowGuideModal(false);
                onActionComplete?.();
              }}
              className="w-full rounded-xl bg-[#D12D11] hover:bg-[#A61F09] py-2.5 text-xs font-bold text-white transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 border border-amber-400 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>Offline Mode — Cached menu &amp; orders are shown.</span>
    </div>
  );
};
