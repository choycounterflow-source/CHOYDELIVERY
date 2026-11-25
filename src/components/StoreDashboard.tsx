import React, { useState } from "react";
import { useChoyFood } from "../context/FirebaseContext";
import { DISH_IMAGES, ORDER_STEPS } from "../data/seedData";
import { Dish, SaleGroup } from "../types/choyfood";
import { Check, Flame, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";

const IMAGE_PRESETS = [
  { label: "Lechon Kawali Platter", url: DISH_IMAGES.lechonKawali },
  { label: "Sizzling Pork Sisig", url: DISH_IMAGES.sizzlingSisig },
  { label: "Crispy Pata Feast", url: DISH_IMAGES.crispyPata },
  { label: "Halo-Halo Supreme", url: DISH_IMAGES.haloHalo },
  { label: "Charcoal Pork BBQ", url: DISH_IMAGES.porkBbq },
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
    loginWithGoogle,
  } = useChoyFood();

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

  const canManageCatalog = Boolean(authUser && (isAdmin || profile?.role === "store"));

  const kitchenOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );

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
    setDraftPrice(String(dish.price));
    setConfirmDeleteId(null);
  };

  const handleSavePrice = async (dish: Dish) => {
    const parsed = Number(draftPrice);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    await updateDishPrice(dish, parsed);
    setEditingPriceId(null);
  };

  const availableCount = allDishes.filter((d) => d.available).length;

  return (
    <div className="space-y-8">
      {/* Store Board Header */}
      <section className="bg-[#A61F09] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs text-orange-100 font-medium">
            Partner Store Kitchen · Open &amp; Receiving Tickets
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
            {profile?.storeName || "Nanay's Sizzling & BBQ"}
          </h1>
          <p className="text-sm text-orange-50/90">
            Accept live customer orders (Step 3), signal Food Ready for riders (Step 5), and manage
            dish stock, pricing, and fresh specials in real time.
          </p>
        </div>

        <button
          onClick={() => (authUser ? setIsAddModalOpen(true) : loginWithGoogle())}
          className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-[#A61F09] font-semibold text-xs px-4 py-3 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </section>

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
                      onClick={() => advanceOrder(order, 3)}
                      disabled={order.step >= 3}
                      className="inline-flex items-center gap-1.5 bg-[#E08E00] hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{order.step >= 3 ? "Cooking" : "Accept Ticket (Step 3)"}</span>
                    </button>
                    <button
                      onClick={() => advanceOrder(order, 5)}
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

      {/* Published Partner Menu Table with Stock, Price & Delete Controls */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Live Store Menu Catalog
            </h2>
            <p className="text-xs text-stone-500">
              Toggle availability, edit prices inline, or remove discontinued dishes
            </p>
          </div>
          <span className="text-xs text-stone-500 font-mono tabular-nums">
            {availableCount} in stock · {allDishes.length} total dishes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 text-xs text-stone-500">
              <tr>
                <th className="py-2.5 pr-4 font-semibold">Dish</th>
                <th className="py-2.5 px-3 font-semibold">Store &amp; Group</th>
                <th className="py-2.5 px-3 font-semibold">Stock Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Likes</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {allDishes.map((dish) => {
                const isEditingPrice = editingPriceId === dish.id;
                const isConfirmingDelete = confirmDeleteId === dish.id;
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
                        <button
                          onClick={() => canManageCatalog && handleStartEditPrice(dish)}
                          disabled={!canManageCatalog}
                          className="inline-flex items-center gap-1 hover:text-[#D12D11] disabled:hover:text-[#1C1917] transition-colors"
                          title={canManageCatalog ? "Click to edit price" : "Sign in as Store/Admin"}
                        >
                          <span>₱{dish.price.toFixed(2)}</span>
                          {canManageCatalog && <Pencil className="w-3 h-3 text-stone-400" />}
                        </button>
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
                    ? "Saved directly to Firestore live catalog"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Price (PHP)
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
