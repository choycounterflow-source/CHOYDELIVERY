import React, { useState } from "react";
import { useChoyFood } from "../context/SupabaseContext";
import { ORDER_STEPS } from "../data/seedData";
import { StoreOperatingStatus } from "../types/choyfood";
import {
  Bell,
  Bike,
  Bot,
  Check,
  CheckCircle2,
  ClipboardCheck,
  LifeBuoy,
  Lock,
  ShieldAlert,
  Store,
  Tag,
  Trash2,
  Truck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

export const AdminOpsDashboard: React.FC = () => {
  const {
    authUser,
    profile,
    isAdmin,
    isSuperAdmin,
    orders,
    dishes,
    allDishes,
    promos,
    supportTickets,
    allUsers,
    advanceOrder,
    resolveSupportTicket,
    openAuthModal,
    openAskChoy,
    cmsSettings,
    updateCmsSettings,
    setStoreStatus,
    approveDish,
    adjustRiderScore,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useChoyFood();

  const [opsTab, setOpsTab] = useState<"dispatch" | "tickets" | "fleet" | "promos">("dispatch");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const pendingOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );
  const openTickets = supportTickets.filter((t) => t.status === "open");
  const activeRiders = allUsers.filter((u) => u.role === "rider");
  const activeStores = allUsers.filter((u) => u.role === "store");
  const adminNotifs = notifications.filter((n) => n.audience === "admin" || n.audience === "all");
  const unreadOpsNotifs = adminNotifs.filter((n) => !n.read).length;
  const storeNamesList = Array.from(
    new Set([
      ...Object.keys(cmsSettings.storeStatuses),
      ...allDishes.map((d) => d.storeName),
    ].filter(Boolean))
  );
  const pendingDishes = allDishes.filter((d) => d.approvalStatus === "pending");

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkAdvance = async (targetStep: number) => {
    const targets = orders.filter(
      (o) => selectedOrderIds.includes(o.id) && o.status !== "cancelled"
    );
    for (const order of targets) {
      await advanceOrder(order, targetStep);
    }
    setSelectedOrderIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Operations Admin Header */}
      <header className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <p className="text-xs font-mono text-sky-400">
            Dashboard 2 of 5 · Admin Operations Portal
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
            Dispatch Verification &amp; Daily Operations
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Verify incoming customer orders (Step 2), dispatch batches to riders, manage support
            tickets, and monitor active partner stores. Private legal KYC documents remain locked
            exclusively to the Super Admin Vault.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => updateCmsSettings({ soundEnabled: !cmsSettings.soundEnabled })}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            {cmsSettings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{cmsSettings.soundEnabled ? "Sound ON" : "Muted"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Alerts</span>
            {unreadOpsNotifs > 0 && (
              <span className="bg-[#D12D11] text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                {unreadOpsNotifs}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={openAskChoy}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold px-3 py-2.5 rounded-lg transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Choy AI</span>
          </button>

          {!isAdmin ? (
            <button
              onClick={() => openAuthModal("admin")}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Sign In as Admin
            </button>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs">
              <p className="text-slate-400">Active Operator</p>
              <p className="font-semibold text-white">
                {profile?.displayName || authUser?.displayName || "Admin"}{" "}
                <span className="text-sky-400 font-mono">
                  ({isSuperAdmin ? "Super Admin" : "Admin"})
                </span>
              </p>
            </div>
          )}
        </div>
      </header>

      {isNotifOpen && (
        <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <h2 className="font-display text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D12D11]" />
              <span>Operations Alerts ({adminNotifs.length})</span>
            </h2>
            <div className="flex items-center gap-3 text-xs">
              {unreadOpsNotifs > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead("admin")}
                  className="text-[#1F7A4C] hover:underline font-semibold"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsNotifOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {adminNotifs.length === 0 ? (
            <p className="text-xs text-stone-500 py-3 text-center">No dispatch notifications yet.</p>
          ) : (
            <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto">
              {adminNotifs.map((n) => (
                <div key={n.id} className={`py-2.5 flex items-start justify-between gap-3 text-xs ${n.read ? "opacity-65" : ""}`}>
                  <div>
                    <p className="font-semibold text-[#1C1917]">{n.title}</p>
                    <p className="text-stone-600">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className="p-1 text-[#1F7A4C] hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(n.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Account Gate Notice */}
      {!isAdmin && (
        <div className="bg-white border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1C1917]">Admin Operations Sign-In Required</p>
              <p className="text-xs text-stone-600">
                Sign in with your Admin Operations Mobile &amp; PIN or a Supabase account granted
                the <span className="font-mono font-semibold">admin</span> role by Super Admin to
                verify orders and resolve tickets.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal("admin")}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Admin Login
          </button>
        </div>
      )}

      {/* Operations KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-stone-500 flex items-center justify-between">
            <span>Active Orders Queue</span>
            <ClipboardCheck className="w-4 h-4 text-sky-600" />
          </p>
          <p className="font-display text-2xl font-extrabold text-[#1C1917] tabular-nums">
            {pendingOrders.length}
          </p>
          <p className="text-[11px] text-stone-500">Out of {orders.length} total orders</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-stone-500 flex items-center justify-between">
            <span>Open Support Tickets</span>
            <LifeBuoy className="w-4 h-4 text-amber-600" />
          </p>
          <p className="font-display text-2xl font-extrabold text-[#1C1917] tabular-nums">
            {openTickets.length}
          </p>
          <p className="text-[11px] text-stone-500">{supportTickets.length} total logged</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-stone-500 flex items-center justify-between">
            <span>Partner Stores &amp; Dishes</span>
            <Store className="w-4 h-4 text-[#D12D11]" />
          </p>
          <p className="font-display text-2xl font-extrabold text-[#1C1917] tabular-nums">
            {dishes.length} Dishes
          </p>
          <p className="text-[11px] text-stone-500">
            {activeStores.length} registered store account{activeStores.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-1">
          <p className="text-xs text-stone-500 flex items-center justify-between">
            <span>Rider Fleet Accounts</span>
            <Bike className="w-4 h-4 text-[#1F7A4C]" />
          </p>
          <p className="font-display text-2xl font-extrabold text-[#1C1917] tabular-nums">
            {activeRiders.length}
          </p>
          <p className="text-[11px] text-stone-500">Active dispatch partners</p>
        </div>
      </section>

      {/* Operations Section Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/70 rounded-xl w-fit">
        {[
          { id: "dispatch", label: "Order Dispatch Queue", icon: Truck },
          { id: "tickets", label: "Support & Top-Ups", icon: LifeBuoy },
          { id: "fleet", label: "Stores & Riders", icon: Store },
          { id: "promos", label: "Active Promos", icon: Tag },
        ].map((t) => {
          const Icon = t.icon;
          const active = opsTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpsTab(t.id as any)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                active ? "bg-white text-[#1C1917] shadow-xs" : "text-stone-600 hover:text-[#1C1917]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live Dispatch Queue */}
      {opsTab === "dispatch" && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1C1917]">
                Order Verification &amp; Dispatch Queue
              </h2>
              <p className="text-xs text-stone-500">
                Approve incoming Step 1 orders (Admin Checked) or bulk-advance dispatch stages.
              </p>
            </div>
            {isAdmin && selectedOrderIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-sky-700">
                  {selectedOrderIds.length} selected:
                </span>
                <button
                  onClick={() => handleBulkAdvance(2)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                >
                  Mark Admin Checked (Step 2)
                </button>
                <button
                  onClick={() => handleBulkAdvance(4)}
                  className="bg-[#1F7A4C] hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded-lg"
                >
                  Dispatch Rider (Step 4)
                </button>
              </div>
            )}
          </div>

          {orders.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              No live orders in Supabase yet. Orders placed in Customer View will stream here for
              Step 2 verification.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
                  <tr>
                    <th className="py-3 px-3 w-10">Sel</th>
                    <th className="py-3 px-3 font-semibold">Order #</th>
                    <th className="py-3 px-3 font-semibold">Customer</th>
                    <th className="py-3 px-3 font-semibold">Partner Store</th>
                    <th className="py-3 px-3 font-semibold">Current Stage</th>
                    <th className="py-3 px-3 font-semibold text-right">Total</th>
                    <th className="py-3 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => {
                    const stepMeta = ORDER_STEPS.find((s) => s.step === order.step);
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={selectedOrderIds.includes(order.id)}
                            onChange={() => toggleSelectOrder(order.id)}
                            aria-label={`Select ${order.orderNumber}`}
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#1C1917]">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-3">{order.customerDisplayName}</td>
                        <td className="py-3 px-3">{order.storeName}</td>
                        <td className="py-3 px-3 font-medium text-sky-700">
                          {order.status === "cancelled"
                            ? "Cancelled"
                            : stepMeta?.label || `Step ${order.step}`}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                          ₱{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isAdmin && order.step < 7 && order.status !== "cancelled" && (
                            <button
                              onClick={() => advanceOrder(order, order.step + 1)}
                              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md whitespace-nowrap"
                            >
                              Advance to Step {order.step + 1}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Support Tickets & Wallet Top-Up Screening */}
      {opsTab === "tickets" && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <h2 className="font-display text-lg font-bold text-[#1C1917]">
              Support Tickets &amp; Rider Applications
            </h2>
            <p className="text-xs text-stone-500">
              Review customer inquiries, GCash top-up requests, and new rider onboarding checklists.
            </p>
          </div>
          {supportTickets.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              No support tickets submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-stone-100">
              {supportTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-mono font-bold text-[#1C1917]">
                      {ticket.referenceCode} ·{" "}
                      <span className="text-amber-700">{ticket.category}</span>
                    </p>
                    <p className="text-stone-700">{ticket.message}</p>
                    <p className="text-[11px] text-stone-500">
                      From {ticket.fullName} ({ticket.contact})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        ticket.status === "resolved"
                          ? "bg-emerald-100 text-[#1F7A4C]"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ticket.status}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() =>
                          resolveSupportTicket(
                            ticket,
                            ticket.status === "resolved" ? "open" : "resolved"
                          )
                        }
                        className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {ticket.status === "resolved" ? "Reopen" : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Partner Stores, Dish Approvals & Fleet Score Controls */}
      {opsTab === "fleet" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-[#1C1917] flex items-center gap-2">
                <Store className="w-4 h-4 text-[#D12D11]" /> Partner Store Status Controls
              </h3>
              <ul className="divide-y divide-stone-100 text-xs">
                {storeNamesList.map((storeName) => {
                  const status: StoreOperatingStatus = cmsSettings.storeStatuses[storeName] || "open";
                  return (
                    <li key={storeName} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1C1917]">{storeName}</p>
                        <p className="text-[11px] text-stone-500 capitalize">Status: {status.replace("_", " ")}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(["open", "closed", "coming_soon"] as StoreOperatingStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => setStoreStatus(storeName, st)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold capitalize ${
                              status === st
                                ? st === "open"
                                  ? "bg-[#1F7A4C] text-white"
                                  : st === "closed"
                                  ? "bg-rose-600 text-white"
                                  : "bg-amber-600 text-white"
                                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                            }`}
                          >
                            {st.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-[#1C1917] flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#1F7A4C]" /> Delivery Riders &amp; Score Adjustment
              </h3>
              {activeRiders.length === 0 ? (
                <p className="text-xs text-stone-500">
                  No registered rider accounts yet. Riders can register from the Sign In → Rider tab.
                </p>
              ) : (
                <ul className="divide-y divide-stone-100 text-xs">
                  {activeRiders.map((r) => {
                    const pts = Math.round((r.ratingScore ?? 4.7) * 20);
                    const batch = pts >= 85 ? "Batch A" : pts >= 75 ? "Batch B" : "Batch C";
                    return (
                      <li key={r.uid} className="py-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#1C1917]">{r.displayName}</p>
                          <p className="text-[11px] font-mono text-stone-500">
                            {r.riderCode || "JC389"} · {pts}/100 ({batch})
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => adjustRiderScore(r, -1)}
                            className="bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-700 font-mono font-bold px-2.5 py-1 rounded"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => adjustRiderScore(r, 1)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-[#1F7A4C] font-mono font-bold px-2.5 py-1 rounded"
                          >
                            +1
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#1C1917]">
                Store Menu Dish Approval Queue
              </h3>
              <span className="font-mono text-xs text-amber-700 font-semibold">
                {pendingDishes.length} pending review
              </span>
            </div>
            <div className="divide-y divide-stone-100 text-xs">
              {allDishes.map((d) => {
                const approval = d.approvalStatus || "approved";
                return (
                  <div key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#1C1917]">
                        {d.name} · <span className="font-mono text-[#D12D11]">₱{d.price.toFixed(2)}</span>
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {d.storeName} · Approval: <strong className="capitalize">{approval}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={!isAdmin || approval === "approved"}
                        onClick={() => approveDish(d.id, "approved")}
                        className="bg-[#1F7A4C] hover:bg-emerald-800 disabled:opacity-40 text-white font-semibold px-3 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={!isAdmin || approval === "rejected"}
                        onClick={() => approveDish(d.id, "rejected")}
                        className="bg-stone-200 hover:bg-rose-600 hover:text-white disabled:opacity-40 text-stone-700 font-semibold px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: Active Promos */}
      {opsTab === "promos" && (
        <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#1C1917]">Active Promo Codes</h2>
              <p className="text-xs text-stone-500">Live discount vouchers synced with Supabase.</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
              <Lock className="w-3.5 h-3.5" /> Role &amp; KYC Vault controls are Super Admin only
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {promos.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#D12D11] text-sm">{p.code}</span>
                  <span className="bg-emerald-100 text-[#1F7A4C] px-2 py-0.5 rounded font-bold">
                    ₱{p.discount} OFF
                  </span>
                </div>
                <p className="text-stone-700">{p.description}</p>
                <p className="text-[11px] font-mono text-stone-500">Min. Spend: ₱{p.minSpend}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
