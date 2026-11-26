import React, { useState } from "react";
import { AppView, BlogPost, Dish } from "../types/choyfood";
import { COMMUNITY_BLOG_POSTS, HERO_FEAST_IMAGE } from "../data/seedData";
import { useChoyFood } from "../context/SupabaseContext";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Timer,
  Wallet,
  X,
} from "lucide-react";

interface PublicPagesProps {
  view: "landing" | "blog" | "about" | "contact" | "privacy";
  onNavigate: (view: AppView) => void;
  onOpenKyc: () => void;
  onSelectStore?: (storeName: string, dish?: Dish | null) => void;
}

export const PublicPages: React.FC<PublicPagesProps> = ({
  view,
  onNavigate,
  onOpenKyc,
  onSelectStore,
}) => {
  const { submitSupportTicket, supportTickets, dishes, cmsSettings } = useChoyFood();
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Contact form state
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("Customer Order & Refund Concern");
  const [message, setMessage] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [lastRefCode, setLastRefCode] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2 || contact.trim().length < 3 || message.trim().length < 5) {
      return;
    }
    setIsSubmittingTicket(true);
    try {
      const ref = await submitSupportTicket({ fullName, contact, category, message });
      if (ref) {
        setLastRefCode(ref);
        setFullName("");
        setContact("");
        setMessage("");
      }
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  if (view === "landing") {
    return (
      <div className="space-y-14">
        {/* Split Editorial Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-2">
            <p className="text-xs font-medium text-stone-500">
              Cebu &amp; Neighborhood Kitchens · Live 7-Step Tracking · Choy Wallet
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1C1917] leading-[1.08]">
              Fresh local Filipino eats, delivered hot from neighborhood kitchens.
            </h1>
            <p className="text-base text-stone-600 leading-relaxed max-w-xl">
              Order crispy Lechon Kawali, sizzling Pork Sisig, and chilled Halo-Halo from certified
              local partner stores. Enjoy transparent distance fees, Choy Pro free delivery, and an
              encrypted Admin-only KYC vault.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate("customer")}
                className="inline-flex items-center gap-2 bg-[#D12D11] hover:bg-[#A61F09] text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Order Food Now</span>
              </button>
              <button
                onClick={() => onNavigate("blog")}
                className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-[#1C1917] border border-stone-300 font-semibold text-sm px-5 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Read Community Stories</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden bg-stone-900 border border-stone-200">
              <img
                src={HERO_FEAST_IMAGE}
                alt="Abundant Filipino feast with crispy lechon kawali, sizzling pork sisig, and charcoal-grilled skewers"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs text-stone-200 font-medium">
                  Promo Code CHOY25 · ₱25 off orders over ₱250
                </p>
                <p className="font-display text-lg sm:text-xl font-bold mt-1">
                  Fiesta platters straight from verified neighborhood grills
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width 4-Column Platform Pillars Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-stone-200 pt-10">
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
            <ShieldCheck className="w-5 h-5 text-[#D12D11]" />
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              Super Admin KYC Vault
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Valid IDs and real legal names are stored privately in an Admin-only Supabase vault,
              never exposed to kitchens or riders.
            </p>
            <button
              onClick={onOpenKyc}
              className="text-xs font-semibold text-[#D12D11] hover:underline pt-1 inline-flex items-center gap-1"
            >
              <span>Verify Identity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
            <Wallet className="w-5 h-5 text-[#E08E00]" />
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              Choy Wallet &amp; Pro
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Non-withdrawable food credits paired with ₱149/month Choy Pro unlimited free delivery
              across every partner store.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
            <Timer className="w-5 h-5 text-[#1F7A4C]" />
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              60-Sec Rider Dispatch
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Verified local riders receive clear distance-tier payouts and capture Proof of
              Delivery at every doorstep.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
            <Bot className="w-5 h-5 text-stone-800" />
            <h2 className="font-display text-base font-bold text-[#1C1917]">Ask Choy AI</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Real-time meal pairing, promo lookup, and onboarding answers powered by server-side
              Gemini intelligence.
            </p>
          </div>
        </section>

        {/* Clickable Partner Storefronts Directory */}
        {(() => {
          const storeMap = new Map<string, Dish[]>();
          dishes.forEach((d) => {
            if (!d.storeName) return;
            const list = storeMap.get(d.storeName) || [];
            list.push(d);
            storeMap.set(d.storeName, list);
          });
          const stores = Array.from(storeMap.entries()).sort((a, b) =>
            a[0].localeCompare(b[0])
          );
          if (stores.length === 0) return null;
          return (
            <section className="border-t border-stone-200 pt-10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#1C1917]">
                    Partner Kitchens &amp; Storefronts
                  </h2>
                  <p className="text-xs text-stone-500">
                    Tap any store name to open its dedicated Storefront Dashboard and pick food
                    choices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("customer")}
                  className="text-xs font-semibold text-[#D12D11] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View All Menus</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map(([storeName, storeDishes]) => {
                  const status = cmsSettings.storeStatuses[storeName] || "open";
                  return (
                    <button
                      key={storeName}
                      type="button"
                      onClick={() =>
                        onSelectStore ? onSelectStore(storeName, null) : onNavigate("customer")
                      }
                      className="text-left bg-white hover:bg-amber-50/40 border border-stone-200 hover:border-[#D12D11]/50 rounded-xl p-4 flex items-center justify-between gap-3 transition-all shadow-xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#D12D11]/10 text-[#D12D11] flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-[#1C1917] group-hover:text-[#D12D11] truncate transition-colors">
                            {storeName}
                          </p>
                          <p className="text-xs text-stone-500 tabular-nums">
                            {storeDishes.length} approved choice
                            {storeDishes.length === 1 ? "" : "s"} ·{" "}
                            <span className="text-[#1F7A4C] font-semibold">
                              {status === "coming_soon" ? "Coming Soon" : "Open"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#D12D11] shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })()}
      </div>
    );
  }

  if (view === "blog") {
    return (
      <div className="space-y-8">
        <div className="border-b border-stone-200 pb-6">
          <p className="text-xs text-stone-500">ChoyFood Journal · Local Culinary &amp; Fleet Stories</p>
          <h1 className="font-display text-3xl font-extrabold text-[#1C1917] mt-1">
            Community Blog &amp; Local Food Scene
          </h1>
          <p className="text-sm text-stone-600 mt-2 max-w-2xl">
            Kitchen hygiene standards, smart household meal savings, and stories from the local
            cooks and delivery riders who power ChoyFood.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMMUNITY_BLOG_POSTS.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2.5">
                  <p className="text-xs text-stone-500">
                    {post.tag} · {post.publishedDate} · {post.readMinutes} min read
                  </p>
                  <h2 className="font-display text-lg font-bold text-[#1C1917] leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-stone-600 leading-relaxed">{post.summary}</p>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-stone-100">
                <button
                  onClick={() => setActivePost(post)}
                  className="text-xs font-semibold text-[#D12D11] hover:underline inline-flex items-center gap-1"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Clean Article Reader Modal */}
        {activePost && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-xl">
              <div className="aspect-[16/9] bg-stone-100 relative overflow-hidden">
                <img
                  src={activePost.imageUrl}
                  alt={activePost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setActivePost(null)}
                  className="absolute top-4 right-4 bg-white/95 text-stone-800 p-2 rounded-lg border border-stone-200 hover:bg-white transition-colors"
                  aria-label="Close article"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 sm:p-8 space-y-4">
                <p className="text-xs text-stone-500">
                  {activePost.tag} · {activePost.publishedDate} · {activePost.readMinutes} min read
                </p>
                <h2 className="font-display text-2xl font-bold text-[#1C1917]">
                  {activePost.title}
                </h2>
                <div className="space-y-4 text-sm text-stone-700 leading-relaxed pt-2">
                  {activePost.body.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button
                    onClick={() => {
                      setActivePost(null);
                      onNavigate("customer");
                    }}
                    className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Browse Partner Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "about") {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="space-y-3">
          <p className="text-xs text-stone-500">Our Mission · Cebu &amp; Local Food Ecosystem</p>
          <h1 className="font-display text-3xl font-extrabold text-[#1C1917]">About ChoyFood</h1>
          <p className="text-base text-stone-600 leading-relaxed">
            ChoyFood connects independent neighborhood kitchens, family karinderyas, and beloved
            grill houses directly with local diners through a verified fleet of delivery riders and
            zero-trust customer privacy architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-stone-200">
          <div className="space-y-2 pt-4">
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              01. Fair Store Margins
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Independent home cooks and local eateries manage live kitchen queues without
              predatory platform commission models.
            </p>
          </div>
          <div className="space-y-2 pt-4">
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              02. Dignified Rider Payouts
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Transparent 0-2 km, 2-5 km, and 5-10 km distance tiers with fast acceptance timers
              and Proof of Delivery protection.
            </p>
          </div>
          <div className="space-y-2 pt-4">
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              03. Fraud-Safe Privacy
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Your public Display Name is all kitchens and riders ever see. Legal IDs stay locked
              in the encrypted Super Admin KYC Vault.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "contact") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs text-stone-500">ChoyFood Help Desk · Direct Ticket Queue</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#1C1917] mt-1">
              Contact ChoyFood Support
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Submit an order concern, partner store permit request, or rider remittance inquiry.
            </p>
          </div>

          {lastRefCode && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#1F7A4C] shrink-0" />
              <span>
                Ticket received. Reference ID:{" "}
                <strong className="font-mono tabular-nums">{lastRefCode}</strong>
              </span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Maria Santos"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Email or Phone
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="name@email.com or +63 9XX..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Inquiry Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
              >
                <option>Customer Order &amp; Refund Concern</option>
                <option>Rider Application &amp; Remittance</option>
                <option>Partner Store Permit Approval</option>
                <option>Choy Pro Subscription Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Message Details
              </label>
              <textarea
                rows={4}
                required
                minLength={5}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your order number or concern clearly..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingTicket}
              className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
            >
              {isSubmittingTicket ? "Submitting Ticket..." : "Submit Support Ticket"}
            </button>
          </form>
        </div>

        {supportTickets.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-[#1C1917]">
              Recent Support Tickets
            </h2>
            <div className="divide-y divide-stone-100">
              {supportTickets.map((t) => (
                <div key={t.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-[#1C1917]">
                      <span className="font-mono text-xs text-[#D12D11] mr-2">
                        {t.referenceCode}
                      </span>
                      {t.category}
                    </p>
                    <p className="text-xs text-stone-600 mt-0.5">{t.message}</p>
                  </div>
                  <span className="text-xs font-medium text-stone-500 capitalize shrink-0">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 space-y-6 text-sm text-stone-700 leading-relaxed">
      <div className="border-b border-stone-200 pb-4">
        <p className="text-xs text-stone-500">Legal &amp; Security · Last Revised November 2026</p>
        <h1 className="font-display text-3xl font-extrabold text-[#1C1917] mt-1">
          Privacy Policy &amp; Terms of Service
        </h1>
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-[#1C1917]">
          1. Fraud-Prevention &amp; Private Customer KYC Storage
        </h2>
        <p>
          By uploading your government-issued valid ID and profile photograph, you consent to
          ChoyFood storing this data in an isolated, access-controlled Super Admin KYC Vault for
          fraud prevention, bogus buyer deterrence, and platform safety only.{" "}
          <strong className="text-[#1C1917]">
            This information is never shown publicly and is strictly blocked from partner
            restaurants, delivery riders, and non-admin accounts at the database rule layer.
          </strong>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-[#1C1917]">
          2. Separation of Public Display Name and Legal Identity
        </h2>
        <p>
          Customers place orders using their chosen Display Name. Real legal names and Valid ID
          references are separated into an admin-restricted vault collection and reviewed only by
          verified Super Admins.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-[#1C1917]">
          3. Choy Wallet &amp; Choy Pro Terms
        </h2>
        <p>
          Choy Wallet credit balances are strictly non-withdrawable and redeemable exclusively for
          food and beverage orders across registered partner kitchens. Choy Pro unlocks ₱0 delivery
          fees across all standard distance tiers for 30 days.
        </p>
      </section>
    </article>
  );
};
