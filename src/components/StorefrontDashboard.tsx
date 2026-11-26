import React, { useMemo, useState } from "react";
import { Dish, SaleGroup, StoreOperatingStatus, StorePermitChecklist } from "../types/choyfood";
import { HERO_FEAST_IMAGE } from "../data/seedData";
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from "lucide-react";

interface StorefrontDashboardProps {
  storeName: string;
  dishes: Dish[];
  initialDish: Dish | null;
  storeStatus: StoreOperatingStatus;
  storePermits?: StorePermitChecklist;
  onBack: () => void;
  onAddToCart: (dish: Dish, qty?: number, choiceLabel?: string) => void;
  onLikeDish: (dish: Dish) => Promise<void>;
}

const STORE_SALE_GROUPS: ("All" | SaleGroup)[] = [
  "All",
  "Combo Meal",
  "Solo",
  "Extra",
  "Promo",
  "Good for Family",
];

const PREP_CHOICES = [
  "Regular Prep",
  "Spicy / Extra Chili",
  "Separate Sauce",
  "No Garnish / Plain",
];

export const StorefrontDashboard: React.FC<StorefrontDashboardProps> = ({
  storeName,
  dishes,
  initialDish,
  storeStatus,
  storePermits,
  onBack,
  onAddToCart,
  onLikeDish,
}) => {
  const storeDishes = useMemo(
    () => dishes.filter((d) => d.storeName.toLowerCase() === storeName.toLowerCase()),
    [dishes, storeName]
  );

  const [selectedDish, setSelectedDish] = useState<Dish | null>(
    initialDish || storeDishes[0] || null
  );
  const [choiceQty, setChoiceQty] = useState<number>(1);
  const [prepChoice, setPrepChoice] = useState<string>(PREP_CHOICES[0]);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeGroup, setStoreGroup] = useState<"All" | SaleGroup>("All");

  // Sync if user clicks a different dish from outside while viewing
  React.useEffect(() => {
    if (initialDish && initialDish.storeName.toLowerCase() === storeName.toLowerCase()) {
      setSelectedDish(initialDish);
      setChoiceQty(1);
      setPrepChoice(PREP_CHOICES[0]);
    } else if (!selectedDish && storeDishes.length > 0) {
      setSelectedDish(storeDishes[0]);
    }
  }, [initialDish, storeName, storeDishes]);

  const filteredStoreDishes = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    return storeDishes.filter((d) => {
      const matchGroup = storeGroup === "All" || d.saleGroup === storeGroup;
      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.saleGroup.toLowerCase().includes(q);
      return matchGroup && matchQuery;
    });
  }, [storeDishes, storeGroup, storeSearch]);

  const totalLikes = storeDishes.reduce((sum, d) => sum + (d.likes || 0), 0);
  const coverImage = selectedDish?.imageUrl || storeDishes[0]?.imageUrl || HERO_FEAST_IMAGE;
  const permitsVerifiedCount = storePermits
    ? [storePermits.dti, storePermits.bir, storePermits.mayors, storePermits.sanitary].filter(
        Boolean
      ).length
    : 0;

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
    setChoiceQty(1);
    setPrepChoice(PREP_CHOICES[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 bg-white hover:bg-stone-100 text-[#1C1917] border border-stone-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#D12D11]" />
          <span>Back to All Stores &amp; Menus</span>
        </button>

        <span className="text-xs font-mono text-stone-500">
          Storefront Dashboard · {storeDishes.length} approved choice
          {storeDishes.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Store Owner Hero Banner */}
      <section className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 min-h-[210px] shadow-sm">
        <img
          src={coverImage}
          alt={storeName}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/90 via-black/70 to-black/30" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#D12D11] text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                <Store className="w-3.5 h-3.5" />
                <span>Partner Storefront</span>
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md uppercase ${
                  storeStatus === "open"
                    ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40"
                    : storeStatus === "coming_soon"
                    ? "bg-amber-500/25 text-amber-200 border border-amber-400/40"
                    : "bg-rose-500/25 text-rose-200 border border-rose-400/40"
                }`}
              >
                {storeStatus === "open"
                  ? "Open & Cooking"
                  : storeStatus === "coming_soon"
                  ? "Coming Soon"
                  : "Closed"}
              </span>
              {permitsVerifiedCount > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/15 text-stone-100 text-[11px] font-semibold px-2.5 py-1 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{permitsVerifiedCount}/4 Permits Verified</span>
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              {storeName}
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              Browse all kitchen specials from {storeName}, choose your dish, prep option, and
              quantity below, or tap any item in this store&apos;s menu to compare choices.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/45 border border-white/15 rounded-xl px-4 py-3 text-xs shrink-0">
            <div>
              <p className="text-stone-300">Menu Choices</p>
              <p className="font-display text-lg font-extrabold text-white tabular-nums">
                {storeDishes.length}
              </p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-stone-300">Favorites</p>
              <p className="font-display text-lg font-extrabold text-amber-300 tabular-nums">
                {totalLikes}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clicked Dish Choice Picker Panel */}
      {selectedDish && (
        <section className="bg-white border-2 border-[#D12D11]/30 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D12D11]" />
              <h2 className="font-display text-base sm:text-lg font-bold text-[#1C1917]">
                Selected Food Choice from {storeName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDish(null)}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Minimize</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 relative border border-stone-200">
              <img
                src={selectedDish.imageUrl}
                alt={selectedDish.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onLikeDish(selectedDish)}
                aria-label={`Favorite ${selectedDish.name}`}
                className="absolute top-3 right-3 bg-white/95 hover:bg-white text-stone-700 hover:text-[#D12D11] p-2 rounded-lg border border-stone-200 shadow-xs transition-colors"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="bg-amber-100 text-amber-900 font-semibold px-2.5 py-0.5 rounded-md">
                    {selectedDish.saleGroup}
                  </span>
                  <span className="text-stone-500 font-mono">
                    {selectedDish.likes} favorites
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold text-[#1C1917]">
                  {selectedDish.name}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {selectedDish.description}
                </p>
              </div>

              {/* Prep / Flavor Choice Selector */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-700">Choose Preparation Style:</p>
                <div className="flex flex-wrap gap-2">
                  {PREP_CHOICES.map((opt) => {
                    const active = prepChoice === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPrepChoice(opt)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                          active
                            ? "bg-[#D12D11] border-[#D12D11] text-white"
                            : "bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price + Quantity + Add to Bag */}
              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] text-stone-500">Total for Selected Choice</p>
                  <p className="font-display text-2xl font-extrabold text-[#D12D11] tabular-nums">
                    ₱{(selectedDish.price * choiceQty).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center border border-stone-300 rounded-xl bg-stone-50">
                    <button
                      type="button"
                      onClick={() => setChoiceQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="p-2.5 text-stone-700 hover:text-[#D12D11]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 font-mono text-sm font-bold text-[#1C1917] tabular-nums">
                      {choiceQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChoiceQty((q) => Math.min(20, q + 1))}
                      aria-label="Increase quantity"
                      className="p-2.5 text-stone-700 hover:text-[#D12D11]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCart(selectedDish, choiceQty, prepChoice)}
                    className="inline-flex items-center gap-2 bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add {choiceQty}x to Bag</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Store's Full Menu Choices & Category Filter */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              All Menu Choices at {storeName}
            </h2>
            <p className="text-xs text-stone-500">
              Click any dish below to view choices &amp; quantity, or click + Add for quick checkout.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              placeholder={`Search ${storeName}...`}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-stone-100 rounded-xl w-fit max-w-full">
          {STORE_SALE_GROUPS.map((group) => {
            const active = storeGroup === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setStoreGroup(group)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? "bg-[#D12D11] text-white shadow-xs"
                    : "text-stone-600 hover:text-[#1C1917]"
                }`}
              >
                {group === "All" ? "All Choices" : group}
              </button>
            );
          })}
        </div>

        {filteredStoreDishes.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center space-y-2">
            <p className="font-display text-base font-bold text-[#1C1917]">
              No matching menu items in {storeName}
            </p>
            <p className="text-xs text-stone-500">
              Try another category or clear your store search filter.
            </p>
            {(storeSearch || storeGroup !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setStoreSearch("");
                  setStoreGroup("All");
                }}
                className="mt-2 bg-[#D12D11] text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Show All {storeName} Choices
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStoreDishes.map((dish) => {
              const isSelected = selectedDish?.id === dish.id;
              return (
                <article
                  key={dish.id}
                  onClick={() => handleSelectDish(dish)}
                  className={`group cursor-pointer bg-white rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected
                      ? "border-2 border-[#D12D11] ring-2 ring-[#D12D11]/15"
                      : "border border-stone-200"
                  }`}
                >
                  <div>
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLikeDish(dish);
                        }}
                        aria-label={`Favorite ${dish.name}`}
                        className="absolute top-3 right-3 bg-white/95 hover:bg-white text-stone-600 hover:text-[#D12D11] p-2 rounded-lg border border-stone-200 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      {isSelected && (
                        <span className="absolute bottom-2.5 left-2.5 bg-[#D12D11] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                          Selected Choice
                        </span>
                      )}
                    </div>

                    <div className="p-5 space-y-2">
                      <p className="text-xs text-stone-500">{dish.saleGroup}</p>
                      <h3 className="font-display text-base font-bold text-[#1C1917] group-hover:text-[#D12D11] transition-colors leading-snug">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                        {dish.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-extrabold text-[#D12D11] tabular-nums">
                        ₱{dish.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-stone-500 tabular-nums">{dish.likes} favorites</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(dish, 1);
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
