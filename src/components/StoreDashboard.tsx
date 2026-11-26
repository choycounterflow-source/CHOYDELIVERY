import React, { useEffect, useMemo, useState } from "react";
import { useChoyFood } from "../context/SupabaseContext";
import { DISH_IMAGES, ORDER_STEPS } from "../data/seedData";
import { Dish, SaleGroup, StorePermitChecklist } from "../types/choyfood";
import { playNotificationChime } from "../lib/fees";
import {
  Bot,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  Flame,
  KeyRound,
  Megaphone,
  Menu,
  Pencil,
  Plus,
  ReceiptText,
  ScrollText,
  Trash2,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type StoreTab = "queue" | "permits" | "sales" | "rules" | "account";

const IMAGE_PRESETS = [
  { label: "Lechon Kawali Platter", url: DISH_IMAGES.lechonKawali },
  { label: "Sizzling Pork Sisig", url: DISH_IMAGES.sizzlingSisig },
  { label: "Crispy Pata Feast", url: DISH_IMAGES.crispyPata },
  { label: "Halo-Halo Supreme", url: DISH_IMAGES.haloHalo },
  { label: "Charcoal Pork BBQ", url: DISH_IMAGES.porkBbq },
  { label: "Garlic Rice & Fried Egg", url: DISH_IMAGES.garlicRiceEgg },
  { label: "Chickenjoy Rice Meal", url: DISH_IMAGES.jbChickenjoy },
  { label: "Chickenjoy Family Bucket", url: DISH_IMAGES.jbChickenBucket },
  { label: "Jolly Spaghetti", url: DISH_IMAGES.jbSpaghetti },
  { label: "Palabok Fiesta", url: DISH_IMAGES.jbPalabok },
  { label: "Chickenjoy w/ Spaghetti", url: DISH_IMAGES.jbChickenSpaghetti },
  { label: "Chickenjoy w/ Palabok", url: DISH_IMAGES.jbChickenPalabok },
  { label: "Chickenjoy w/ Burger Steak", url: DISH_IMAGES.jbChickenSteak },
  { label: "Yumburger / Cheeseburger", url: DISH_IMAGES.jbYumburger },
  { label: "Crunchy Chicken Sandwich", url: DISH_IMAGES.jbChickenSandwich },
  { label: "Burger Steak Meal", url: DISH_IMAGES.jbBurgerSteak },
  { label: "Breakfast Silog Plate", url: DISH_IMAGES.jbSilogBreakfast },
  { label: "Jolly Crispy Fries", url: DISH_IMAGES.jbCrispyFries },
  { label: "Peach Mango Pie", url: DISH_IMAGES.jbPeachMangoPie },
  { label: "Choco Sundae Twirl", url: DISH_IMAGES.jbChocoSundae },
  { label: "Coke Float", url: DISH_IMAGES.jbCokeFloat },
];

export const StoreDashboard: React.FC = () => {
  const {
    authUser,
    profile,
    isAdmin,
    allDishes,
    orders,
    advanceOrder,
    addMenuDish,
    toggleDishAvailability,
    updateDishPrice,
    deleteMenuDish,
    openAuthModal,
    openAskChoy,
    cmsSettings,
    setStorePermit,
    changeUserPassword,
    pushToast,
  } = useChoyFood();

  const [storeTab, setStoreTab] = useState<StoreTab>("queue");
  const [isStoreSidebarOpen, setIsStoreSidebarOpen] = useState(false);
  const [storeChimeOn, setStoreChimeOn] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dishName, setDishName] = useState("");
  const [dishDesc, setDishDesc] = useState("");
  const [dishPrice, setDishPrice] = useState("195");
  const [saleGroup, setSaleGroup] = useState<SaleGroup>("Combo Meal");
  const [storeName, setStoreName] = useState(profile?.storeName || "Nanay's Sizzling & BBQ");
  const [selectedImage, setSelectedImage] = useState<string>(DISH_IMAGES.lechonKawali);
  const [submitting, setSubmitting] = useState(false);

  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Store Account password state
  const [storeNewPass, setStoreNewPass] = useState("");
  const [storeConfirmPass, setStoreConfirmPass] = useState("");
  const [storePassStatus, setStorePassStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [updatingStorePass, setUpdatingStorePass] = useState(false);

  const canManageCatalog = Boolean(authUser && (isAdmin || profile?.role === "store"));
  const currentStoreLabel = profile?.storeName || "Nanay's Sizzling & BBQ";
  const isScopedStoreUser = Boolean(!isAdmin && profile?.role === "store" && profile?.storeName);

  useEffect(() => {
    if (profile?.storeName) {
      setStoreName(profile.storeName);
    }
  }, [profile?.storeName]);

  const matchesCurrentStore = (itemStoreName: string, itemStoreOwnerId?: string) => {
    if (!isScopedStoreUser) return true;
    const targetLower = currentStoreLabel.toLowerCase();
    if (itemStoreName.toLowerCase() === targetLower) return true;
    if (
      targetLower === "jollibee / centro" &&
      (itemStoreOwnerId === "store_jollibee_surigao" ||
        itemStoreName.toLowerCase() === "jollibee surigao city")
    ) {
      return true;
    }
    return false;
  };

  const storeOperatingStatus = cmsSettings.storeStatuses[currentStoreLabel] || "open";
  const currentPermits: StorePermitChecklist = cmsSettings.storePermits[currentStoreLabel] || {
    dti: false,
    bir: false,
    mayors: false,
    sanitary: false,
  };

  const triggerStoreChime = () => {
    if (storeChimeOn && cmsSettings.soundEnabled) {
      playNotificationChime("store");
    }
  };

  const kitchenOrders = orders.filter(
    (o) =>
      o.status !== "delivered" &&
      o.status !== "cancelled" &&
      matchesCurrentStore(o.storeName, o.storeOwnerId)
  );

  const scopedDishes = useMemo(
    () => allDishes.filter((d) => matchesCurrentStore(d.storeName, d.storeOwnerId)),
    [allDishes, isScopedStoreUser, currentStoreLabel]
  );

  const storeSalesOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "cancelled" &&
          (isAdmin || matchesCurrentStore(o.storeName, o.storeOwnerId))
      ),
    [orders, isAdmin, isScopedStoreUser, currentStoreLabel]
  );

  const totalStoreRevenue = storeSalesOrders.reduce((sum, o) => sum + o.subtotal, 0);

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dishName.trim().length < 2) return;
    setSubmitting(true);
    try {
      await addMenuDish({
        name: dishName,
        description: dishDesc || "Freshly cooked neighborhood specialty prepared to order.",
        price: Number(dishPrice) || 150,
        saleGroup,
        storeName,
        imageUrl: selectedImage,
      });
      setDishName("");
      setDishDesc("");
      setDishPrice("195");
      setIsAddModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditPrice = (dish: Dish) => {
    setEditingPriceId(dish.id);
    setDraftPrice(String(dish.storePrice ?? dish.price));
    setConfirmDeleteId(null);
  };

  const handleSavePrice = async (dish: Dish) => {
    const parsed = Number(draftPrice);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    await updateDishPrice(dish, parsed);
    setEditingPriceId(null);
  };

  const availableCount = scopedDishes.filter((d) => d.available).length;

  const handleStorePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storeNewPass !== storeConfirmPass) {
      setStorePassStatus({ ok: false, text: "Passwords do not match." });
      return;
    }
    setUpdatingStorePass(true);
    setStorePassStatus(null);
    try {
      const res = await changeUserPassword(storeNewPass);
      if (res.ok) {
        setStorePassStatus({ ok: true, text: "Store password updated." });
        setStoreNewPass("");
        setStoreConfirmPass("");
      } else {
        setStorePassStatus({ ok: false, text: res.error || "Failed to update password." });
      }
    } finally {
      setUpdatingStorePass(false);
    }
  };

  const storeMenuTabs: { id: StoreTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "queue", label: "Kitchen Queue & Menu", icon: Flame },
    { id: "permits", label: "Business Permits", icon: FileBadge2 },
    { id: "sales", label: "Sales & Earnings", icon: ReceiptText },
    { id: "rules", label: "Store Rules & SLA", icon: ScrollText },
    { id: "account", label: "Account & Password", icon: KeyRound },
  ];

  return (
    <div className="space-y-8">
      {/* Store Moving Marquee Banner */}
      <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-xl px-3.5 h-10 flex items-center gap-2.5 text-xs font-bold shadow-xs">
        <Megaphone className="w-4 h-4 text-[#A61F09] shrink-0" />
        <div className="overflow-hidden flex-1">
          <div className="animate-marquee whitespace-nowrap">{cmsSettings.bannerText}</div>
        </div>
      </div>

      {/* Store Board Header with Sidebar Drawer Trigger, Ask Choy AI, and Sound Toggle */}
      <section className="bg-[#A61F09] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={() => {
              triggerStoreChime();
              setIsStoreSidebarOpen(true);
            }}
            aria-label="Open store menu"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0 mt-0.5"
            title="Open Store Sidebar Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="space-y-1.5">
            <p className="text-xs text-orange-100 font-medium">
              Dashboard 3 of 5 · Partner Store Kitchen ·{" "}
              <span className="uppercase font-mono font-bold text-amber-300">
                {storeOperatingStatus === "open"
                  ? "Open & Receiving"
                  : storeOperatingStatus === "coming_soon"
                  ? "Coming Soon"
                  : "Closed"}
              </span>
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              {currentStoreLabel}
            </h1>
            <p className="text-sm text-orange-50/90">
              Accept live customer orders (Step 3), signal Food Ready for riders (Step 5), and manage
              dish stock, pricing, and fresh specials in real time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={() => {
              setStoreChimeOn((prev) => !prev);
              if (!storeChimeOn) playNotificationChime("store");
            }}
            className="inline-flex items-center gap-1.5 bg-black/25 hover:bg-black/35 text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
            title="Toggle store click chime"
          >
            {storeChimeOn ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4 text-orange-200" />}
            <span>{storeChimeOn ? "Chime ON" : "Muted"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerStoreChime();
              openAskChoy();
            }}
            className="inline-flex items-center gap-1.5 bg-black/25 hover:bg-black/35 text-white text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4 text-amber-300" />
            <span>Ask Choy AI</span>
          </button>
          <button
            onClick={() => {
              triggerStoreChime();
              if (authUser) setIsAddModalOpen(true);
              else openAuthModal("store");
            }}
            className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-[#A61F09] font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </section>

      {!authUser && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm text-[#1C1917]">
              Sign in with your Partner Store account
            </p>
            <p className="text-xs text-stone-500">
              Sign in or register a Store account to accept kitchen tickets, toggle stock, and
              publish live dishes to Supabase.
            </p>
          </div>
          <button
            onClick={() => openAuthModal("store")}
            className="bg-[#A61F09] hover:bg-[#8A1807] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Sign In / Register Store
          </button>
        </div>
      )}

      {storeTab === "queue" && (
        <div className="space-y-8">
      {/* Active Kitchen Queue */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#D12D11]" />
            <h2 className="font-display text-lg font-bold text-[#1C1917]">Active Kitchen Queue</h2>
          </div>
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            {kitchenOrders.length} active ticket{kitchenOrders.length === 1 ? "" : "s"}
          </span>
        </div>

        {kitchenOrders.length === 0 ? (
          <div className="py-8 text-center space-y-1.5">
            <UtensilsCrossed className="w-6 h-6 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-[#1C1917]">Kitchen queue is clear</p>
            <p className="text-xs text-stone-500">
              Orders submitted in Customer View will stream into this kitchen board automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {kitchenOrders.map((order) => {
              const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
              return (
                <div
                  key={order.id}
                  className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-xs font-bold text-[#1C1917]">
                      {order.orderNumber} · {stepMeta?.label}
                    </p>
                    <p className="text-sm text-stone-700">
                      {order.items.map((item) => `${item.qty}x ${item.name}`).join(", ")}
                    </p>
                    <p className="text-xs text-stone-500 tabular-nums">
                      Customer: {order.customerDisplayName} · Subtotal: ₱{order.subtotal.toFixed(2)}{" "}
                      · {order.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => {
                        triggerStoreChime();
                        advanceOrder(order, 3);
                      }}
                      disabled={order.step >= 3}
                      className="inline-flex items-center gap-1.5 bg-[#E08E00] hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{order.step >= 3 ? "Cooking" : "Accept Ticket (Step 3)"}</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerStoreChime();
                        advanceOrder(order, 5);
                      }}
                      disabled={order.step >= 5}
                      className="inline-flex items-center gap-1.5 bg-[#1F7A4C] hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <span>{order.step >= 5 ? "Ready for Rider" : "Food is Ready (Step 5)"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Published Partner Menu Table with Stock, Approval Status, Price & Delete Controls */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Live Store Menu Catalog
            </h2>
            <p className="text-xs text-stone-500">
              Toggle availability, edit store base prices (requires Admin approval before posting live), or track approval status
            </p>
          </div>
          <span className="text-xs text-stone-500 font-mono tabular-nums">
            {availableCount} in stock · {scopedDishes.length} total dishes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-xs text-stone-500">
              <tr>
                <th className="py-2.5 pr-4 font-semibold">Dish</th>
                <th className="py-2.5 px-3 font-semibold">Store &amp; Group</th>
                <th className="py-2.5 px-3 font-semibold">Approval</th>
                <th className="py-2.5 px-3 font-semibold">Stock Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Store Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Likes</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {scopedDishes.map((dish) => {
                const isEditingPrice = editingPriceId === dish.id;
                const isConfirmingDelete = confirmDeleteId === dish.id;
                const approval = dish.approvalStatus || "approved";
                return (
                  <tr
                    key={dish.id}
                    className={`hover:bg-stone-50/70 ${!dish.available ? "opacity-75" : ""}`}
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-[#1C1917]">{dish.name}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-stone-600">
                      {dish.storeName} · {dish.saleGroup}
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded capitalize ${
                          approval === "approved"
                            ? "bg-emerald-100 text-[#1F7A4C]"
                            : approval === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {approval === "pending" ? "Pending Admin" : approval}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold">
                      <span className={dish.available ? "text-[#1F7A4C]" : "text-stone-500"}>
                        {dish.available ? "In Stock" : "Sold Out"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-[#1C1917] tabular-nums whitespace-nowrap">
                      {isEditingPrice ? (
                        <div className="inline-flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min={1}
                            max={50000}
                            value={draftPrice}
                            onChange={(e) => setDraftPrice(e.target.value)}
                            className="w-20 text-right text-xs px-2 py-1 border border-stone-300 rounded-md font-mono tabular-nums focus:outline-none focus:border-[#D12D11]"
                            aria-label={`New price for ${dish.name}`}
                          />
                          <button
                            onClick={() => handleSavePrice(dish)}
                            className="p-1 bg-[#1F7A4C] hover:bg-emerald-800 text-white rounded-md"
                            aria-label="Save price"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-md"
                            aria-label="Cancel price edit"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          <button
                            onClick={() => canManageCatalog && handleStartEditPrice(dish)}
                            disabled={!canManageCatalog}
                            className="inline-flex items-center gap-1 hover:text-[#D12D11] disabled:hover:text-[#1C1917] transition-colors"
                            title={canManageCatalog ? "Click to edit store price (requires Admin approval)" : "Sign in as Store/Admin"}
                          >
                            <span>₱{(dish.storePrice ?? dish.price).toFixed(2)}</span>
                            {canManageCatalog && <Pencil className="w-3 h-3 text-stone-400" />}
                          </button>
                          {(dish.adminMarkup ?? 0) > 0 && (
                            <span className="text-[10px] font-normal text-stone-500">
                              Customer: ₱{dish.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-stone-600 tabular-nums">
                      {dish.likes}
                    </td>
                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleDishAvailability(dish)}
                          disabled={!canManageCatalog}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors disabled:opacity-40 ${
                            dish.available
                              ? "border-stone-300 text-stone-700 hover:border-[#D12D11] hover:text-[#D12D11]"
                              : "border-[#1F7A4C] bg-[#1F7A4C] text-white hover:bg-emerald-800"
                          }`}
                        >
                          {dish.available ? "Mark Sold Out" : "Restock"}
                        </button>

                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={async () => {
                                await deleteMenuDish(dish);
                                setConfirmDeleteId(null);
                              }}
                              className="bg-[#D12D11] hover:bg-[#A61F09] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold px-2 py-1.5 rounded-md"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(dish.id)}
                            disabled={!canManageCatalog}
                            aria-label={`Delete ${dish.name}`}
                            className="p-1.5 text-stone-400 hover:text-[#D12D11] disabled:opacity-35 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
        </div>
      )}

      {storeTab === "permits" && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <FileBadge2 className="w-5 h-5 text-[#A61F09]" />
              <span>Government Permits &amp; Sanitary Compliance</span>
            </h2>
            <p className="text-xs text-stone-500">
              Required DTI, BIR, Mayor&apos;s, and Sanitary clearances verified by Super Admin &amp; Admin Ops.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {(
              [
                { key: "dti", label: "DTI Business Name Registration", desc: "Department of Trade and Industry certificate" },
                { key: "bir", label: "BIR Certificate of Registration (2303)", desc: "Active tax & official receipt compliance" },
                { key: "mayors", label: "Mayor's / Business Permit", desc: "LGU city operating permit for Surigao / Cebu" },
                { key: "sanitary", label: "Sanitary & Food Safety Permit", desc: "City Health Office kitchen sanitation clearance" },
              ] as const
            ).map((item) => {
              const verified = currentPermits[item.key];
              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                    verified ? "bg-emerald-50 border-emerald-200" : "bg-stone-50 border-stone-200"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#1C1917]">{item.label}</p>
                    <p className="text-stone-600">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerStoreChime();
                      if (isAdmin) {
                        setStorePermit(currentStoreLabel, item.key, !verified);
                      } else {
                        pushToast("Permit Logged", `${item.label} flagged for Admin verification.`, "info");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold shrink-0 ${
                      verified
                        ? "bg-[#1F7A4C] text-white"
                        : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {verified ? "Verified" : isAdmin ? "Mark Verified" : "Pending"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {storeTab === "sales" && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-[#A61F09]" />
                <span>Store Sales &amp; Kitchen Revenue</span>
              </h2>
              <p className="text-xs text-stone-500">Live sales summary across all active and completed store tickets.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right">
              <p className="text-[11px] text-emerald-800 font-semibold">Total Kitchen Sales</p>
              <p className="font-display text-xl font-extrabold text-[#1F7A4C] tabular-nums">
                ₱{totalStoreRevenue.toFixed(2)}
              </p>
            </div>
          </div>

          {storeSalesOrders.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">No store orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 text-stone-500">
                  <tr>
                    <th className="py-2.5 pr-4 font-semibold">Order #</th>
                    <th className="py-2.5 px-3 font-semibold">Items</th>
                    <th className="py-2.5 px-3 font-semibold">Payment</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 pl-3 font-semibold text-right">Kitchen Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {storeSalesOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50">
                      <td className="py-3 pr-4 font-mono font-bold text-[#1C1917]">{o.orderNumber}</td>
                      <td className="py-3 px-3 text-stone-700">
                        {o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                      </td>
                      <td className="py-3 px-3 font-mono">{o.paymentMethod}</td>
                      <td className="py-3 px-3 capitalize font-semibold text-[#1F7A4C]">{o.status}</td>
                      <td className="py-3 pl-3 text-right font-mono font-bold tabular-nums">
                        ₱{o.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {storeTab === "rules" && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-5 text-xs leading-relaxed">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#A61F09]" />
              <span>Partner Store Rules &amp; Kitchen SLA</span>
            </h2>
            <p className="text-stone-500">Quality, packaging, and dispatch standards for CHOY DELIVERY kitchens.</p>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-stone-700">
            <li><strong>10-Minute Prep Confirmation:</strong> Accept incoming orders promptly (Step 3) and mark Food Ready (Step 5) before rider arrival.</li>
            <li><strong>Tamper-Evident Packaging:</strong> Seal all food containers and soup bowls tightly to prevent spills during motorcycle transit.</li>
            <li><strong>Accurate Menu Pricing:</strong> Keep prices aligned with in-store rates; newly added items require Admin approval before appearing publicly.</li>
            <li><strong>Stock Accuracy:</strong> Immediately mark sold-out items to avoid rider wait times and order cancellations.</li>
          </ol>
        </section>
      )}

      {storeTab === "account" && (
        <section className="max-w-2xl bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 text-xs">
          <div className="border-b border-stone-200 pb-4">
            <h2 className="font-display text-xl font-bold text-[#1C1917] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#A61F09]" />
              <span>Store Account &amp; Password Settings</span>
            </h2>
            <p className="text-stone-500">Kitchen account: <strong className="text-[#1C1917]">{currentStoreLabel}</strong></p>
          </div>

          <form onSubmit={handleStorePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={storeNewPass}
                  onChange={(e) => setStoreNewPass(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={storeConfirmPass}
                  onChange={(e) => setStoreConfirmPass(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>
            {storePassStatus && (
              <p className={`font-semibold ${storePassStatus.ok ? "text-[#1F7A4C]" : "text-rose-700"}`}>
                {storePassStatus.text}
              </p>
            )}
            <button
              type="submit"
              disabled={updatingStorePass}
              className="bg-[#A61F09] hover:bg-[#8A1807] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              {updatingStorePass ? "Updating..." : "Update Store Password"}
            </button>
          </form>
        </section>
      )}

      {/* Store Sidebar Drawer */}
      {isStoreSidebarOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs">
          <aside className="w-80 max-w-[85vw] bg-[#7F1D1D] text-white h-full flex flex-col justify-between shadow-2xl">
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-display text-lg font-extrabold">Partner Store Menu</p>
                <p className="text-xs text-orange-100 truncate">{currentStoreLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreSidebarOpen(false)}
                className="p-1.5 text-orange-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1" aria-label="Store sidebar menu">
              {storeMenuTabs.map((item) => {
                const Icon = item.icon;
                const active = storeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      triggerStoreChime();
                      setStoreTab(item.id);
                      setIsStoreSidebarOpen(false);
                    }}
                    className={`w-full min-h-[44px] flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                      active
                        ? "bg-white text-[#A61F09] shadow-sm"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  triggerStoreChime();
                  setIsStoreSidebarOpen(false);
                  openAskChoy();
                }}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 bg-[#FF5A1F] hover:bg-[#E54B12] text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Choy AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsStoreSidebarOpen(false);
                  openAuthModal("store");
                }}
                className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <span>Switch Store Account</span>
              </button>
            </div>
          </aside>
          <div className="flex-1" onClick={() => setIsStoreSidebarOpen(false)} />
        </div>
      )}

      {/* Add Menu Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-[#1C1917]">
                  Publish New Menu Dish
                </h3>
                <p className="text-xs text-stone-500">
                  {isAdmin || profile?.role === "store"
                    ? "Saved directly to Supabase live catalog"
                    : "Requires Partner Store or Super Admin role"}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Chicken Inasal Pecho Combo"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                  placeholder="Served hot with unlimited garlic rice, chicken oil, and spiced vinegar."
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                />
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900">
                All newly posted dishes and price updates stay hidden until reviewed and approved by Admin (with any platform markup) before posting to the Customer Dashboard.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Store Price (PHP)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50000}
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sale Group
                  </label>
                  <select
                    value={saleGroup}
                    onChange={(e) => setSaleGroup(e.target.value as SaleGroup)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                  >
                    <option value="Combo Meal">Combo Meal</option>
                    <option value="Solo">Solo</option>
                    <option value="Extra">Extra</option>
                    <option value="Promo">Promo</option>
                    <option value="Good for Family">Good for Family</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Kitchen / Store Name
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#D12D11]/30 focus:border-[#D12D11]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Dish Photography Preset
                </label>
                <select
                  value={selectedImage}
                  onChange={(e) => setSelectedImage(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-stone-300 bg-white"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#D12D11] hover:bg-[#A61F09] disabled:opacity-60 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? "Publishing..." : "Publish Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
