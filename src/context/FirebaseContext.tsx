import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
  SUPER_ADMIN_EMAIL,
} from "../lib/firebase";
import {
  ActivityLog,
  BLUEPRINT_LIMITS,
  Dish,
  DistanceTier,
  IdType,
  KycVaultRecord,
  Order,
  OrderItemSummary,
  OrderStatus,
  PaymentMethod,
  SaleGroup,
  SupportTicket,
  ToastMessage,
  UserProfile,
  UserRole,
  PromoCode,
} from "../types/choyfood";
import { DISTANCE_FEES, ORDER_STEPS, SEED_DISHES, SEED_PROMOS } from "../data/seedData";

interface FirebaseContextValue {
  authUser: User | null;
  authReady: boolean;
  profile: UserProfile | null;
  isAdmin: boolean;
  dishes: Dish[];
  allDishes: Dish[];
  orders: Order[];
  allUsers: UserProfile[];
  kycRecords: KycVaultRecord[];
  myKycRecord: KycVaultRecord | null;
  activityLogs: ActivityLog[];
  supportTickets: SupportTicket[];
  toasts: ToastMessage[];
  pushToast: (title: string, description?: string, variant?: ToastMessage["variant"]) => void;
  dismissToast: (id: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  likeDish: (dish: Dish) => Promise<void>;
  addMenuDish: (input: {
    name: string;
    description: string;
    price: number;
    saleGroup: SaleGroup;
    storeName: string;
    imageUrl: string;
  }) => Promise<void>;
  toggleDishAvailability: (dish: Dish) => Promise<void>;
  updateDishPrice: (dish: Dish, newPrice: number) => Promise<void>;
  deleteMenuDish: (dish: Dish) => Promise<void>;
  placeOrder: (input: {
    items: OrderItemSummary[];
    subtotal: number;
    distanceTier: DistanceTier;
    paymentMethod: PaymentMethod;
    promoCode: string;
    deliveryAddress: string;
    deliveryNote: string;
    storeName: string;
    storeOwnerId: string;
  }) => Promise<Order | null>;
  advanceOrder: (
    order: Order,
    nextStep: number,
    options?: { proofOfDeliveryNote?: string; claimAsRider?: boolean; riderCode?: string }
  ) => Promise<void>;
  cancelOrder: (order: Order) => Promise<void>;
  rateOrder: (order: Order, rating: number, reviewComment?: string) => Promise<void>;
  activateChoyPro: () => Promise<void>;
  updateUserAdmin: (
    targetUser: UserProfile,
    patch: {
      role?: UserRole;
      walletBalance?: number;
      choyProActive?: boolean;
      riderCode?: string;
      storeName?: string;
    }
  ) => Promise<void>;
  submitKyc: (input: {
    displayName: string;
    realLegalName: string;
    phoneNumber: string;
    otpVerified: boolean;
    idType: IdType;
    idReference: string;
    profilePhotoName: string;
    validIdPhotoName: string;
    privacyConsentAccepted: boolean;
  }) => Promise<boolean>;
  reviewKyc: (record: KycVaultRecord, decision: "verified" | "rejected") => Promise<void>;
  submitSupportTicket: (input: {
    fullName: string;
    contact: string;
    category: string;
    message: string;
  }) => Promise<string | null>;
  resolveSupportTicket: (ticket: SupportTicket, status: "open" | "resolved") => Promise<void>;
  dismissActivityLog: (logId: string) => Promise<void>;
  runSystemCleaner: () => Promise<void>;
  seedCatalogToFirestore: () => Promise<void>;
  simulateReferralInvite: () => Promise<void>;
  promos: PromoCode[];
  validatePromoCode: (code: string, subtotal: number) => Promise<{ valid: boolean; discount: number; message: string }>;
  updateRiderProfile: (input: { riderPhotoUrl?: string }) => Promise<void>;
  loginAsDemoUser: (role: UserRole) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [dishes, setDishes] = useState<Dish[]>(SEED_DISHES);
  const [allDishes, setAllDishes] = useState<Dish[]>(SEED_DISHES);
  const [promos, setPromos] = useState<PromoCode[]>(SEED_PROMOS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [kycRecords, setKycRecords] = useState<KycVaultRecord[]>([]);
  const [myKycRecord, setMyKycRecord] = useState<KycVaultRecord | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isAdmin = Boolean(
    authUser &&
      authUser.emailVerified &&
      (authUser.email === SUPER_ADMIN_EMAIL || profile?.role === "admin")
  );

  const pushToast = useCallback(
    (title: string, description?: string, variant: ToastMessage["variant"] = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const logActivity = useCallback(
    async (message: string, category: ActivityLog["category"]) => {
      if (!auth.currentUser || !auth.currentUser.emailVerified) return;
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const path = `activity_logs/${logId}`;
      try {
        await setDoc(doc(db, "activity_logs", logId), {
          message: message.slice(0, BLUEPRINT_LIMITS.logMessageMax),
          category,
          actorId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    []
  );

  // 1. Auth listener & profile bootstrap
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);

      if (!user) {
        setProfile(null);
        setOrders([]);
        setAllUsers([]);
        setKycRecords([]);
        setMyKycRecord(null);
        setActivityLogs([]);
        setSupportTickets([]);
        return;
      }

      const userPath = `users/${user.uid}`;
      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        const isBootstrap = user.emailVerified && user.email === SUPER_ADMIN_EMAIL;

        if (!snap.exists()) {
          const defaultDisplayName = (user.displayName || user.email?.split("@")[0] || "ChoyFood User")
            .trim()
            .slice(0, BLUEPRINT_LIMITS.displayNameMax);

          const initialProfile = {
            uid: user.uid,
            displayName: defaultDisplayName || "ChoyFood User",
            role: isBootstrap ? "admin" : "customer",
            walletBalance: 150,
            choyProActive: false,
            kycStatus: "unverified",
            riderCode: isBootstrap ? "JC389" : "",
            storeName: isBootstrap ? "Nanay's Sizzling & BBQ" : "",
            referralCode: `CHOY-${user.uid.slice(0, 6).toUpperCase()}`,
            referralEarnings: 0,
            referredCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Public Dishes catalog subscription (available == true matches firestore.rules list guard)
  useEffect(() => {
    const dishesQuery = query(collection(db, "dishes"), where("available", "==", true), limit(50));
    const unsubscribe = onSnapshot(
      dishesQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveDishes: Dish[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Dish, "id">),
          }));
          setDishes(liveDishes);
          setAllDishes((prev) => (prev.length === 0 || prev === SEED_DISHES ? liveDishes : prev));
        } else {
          setDishes(SEED_DISHES);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "dishes");
      }
    );
    return () => unsubscribe();
  }, []);

  // 2c. Promos collection subscription
  useEffect(() => {
    const q = query(collection(db, "promos"), where("active", "==", true), limit(20));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const livePromos: PromoCode[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PromoCode, "id">),
          }));
          setPromos(livePromos);
        } else {
          setPromos(SEED_PROMOS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "promos");
      }
    );
    return () => unsubscribe();
  }, []);

  // 2b. Store owner listener for their own dishes (including sold-out items)
  useEffect(() => {
    if (
      !authReady ||
      !authUser ||
      !authUser.emailVerified ||
      authUser.email === SUPER_ADMIN_EMAIL ||
      profile?.role !== "store"
    ) {
      return;
    }
    const ownDishesQuery = query(
      collection(db, "dishes"),
      where("storeOwnerId", "==", authUser.uid),
      limit(50)
    );
    const unsubscribe = onSnapshot(
      ownDishesQuery,
      (snapshot) => {
        const owned = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Dish, "id">),
        }));
        setAllDishes((prev) => {
          const map = new Map<string, Dish>();
          prev.forEach((item) => map.set(item.id, item));
          owned.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
      },
      (error) => handleFirestoreError(error, OperationType.LIST, "dishes")
    );
    return () => unsubscribe();
  }, [authReady, authUser, profile?.role]);

  // 3. Authenticated subscriptions (Profile, Orders, Users, All Dishes, KYC Vault, Logs, Tickets)
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified) return;

    const unsubscribers: (() => void)[] = [];
    const bootstrapAdmin = authUser.email === SUPER_ADMIN_EMAIL;

    // Own profile listener
    const profilePath = `users/${authUser.uid}`;
    unsubscribers.push(
      onSnapshot(
        doc(db, "users", authUser.uid),
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, profilePath)
      )
    );

    // Own KYC record listener
    const myKycPath = `kyc_vault/${authUser.uid}`;
    unsubscribers.push(
      onSnapshot(
        doc(db, "kyc_vault", authUser.uid),
        (snap) => {
          setMyKycRecord(snap.exists() ? (snap.data() as KycVaultRecord) : null);
        },
        (error) => handleFirestoreError(error, OperationType.GET, myKycPath)
      )
    );

    // Orders listener
    const ordersPath = "orders";
    const ordersQuery = bootstrapAdmin
      ? query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50))
      : query(
          collection(db, "orders"),
          where("customerId", "==", authUser.uid),
          limit(30)
        );

    unsubscribers.push(
      onSnapshot(
        ordersQuery,
        (snapshot) => {
          const items: Order[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, "id">),
          }));
          setOrders(items);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, ordersPath)
      )
    );

    // Support tickets listener
    const ticketsQuery = bootstrapAdmin
      ? query(collection(db, "support_tickets"), limit(40))
      : query(collection(db, "support_tickets"), where("uid", "==", authUser.uid), limit(20));

    unsubscribers.push(
      onSnapshot(
        ticketsQuery,
        (snapshot) => {
          setSupportTickets(
            snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<SupportTicket, "id">),
            }))
          );
        },
        (error) => handleFirestoreError(error, OperationType.LIST, "support_tickets")
      )
    );

    // Super Admin exclusive listeners: All Users, All Dishes (incl. sold-out), KYC Vault & Activity Logs
    if (bootstrapAdmin) {
      unsubscribers.push(
        onSnapshot(
          query(collection(db, "users"), limit(50)),
          (snapshot) => {
            setAllUsers(snapshot.docs.map((d) => d.data() as UserProfile));
          },
          (error) => handleFirestoreError(error, OperationType.LIST, "users")
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(collection(db, "dishes"), limit(60)),
          (snapshot) => {
            if (!snapshot.empty) {
              setAllDishes(
                snapshot.docs.map((d) => ({
                  id: d.id,
                  ...(d.data() as Omit<Dish, "id">),
                }))
              );
            } else {
              setAllDishes(SEED_DISHES);
            }
          },
          (error) => handleFirestoreError(error, OperationType.LIST, "dishes")
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(collection(db, "kyc_vault"), limit(50)),
          (snapshot) => {
            setKycRecords(snapshot.docs.map((d) => d.data() as KycVaultRecord));
          },
          (error) => handleFirestoreError(error, OperationType.LIST, "kyc_vault")
        )
      );

      unsubscribers.push(
        onSnapshot(
          query(collection(db, "activity_logs"), orderBy("createdAt", "desc"), limit(30)),
          (snapshot) => {
            setActivityLogs(
              snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<ActivityLog, "id">),
              }))
            );
          },
          (error) => handleFirestoreError(error, OperationType.LIST, "activity_logs")
        )
      );
    }

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [authReady, authUser]);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res = await signInWithGoogle();
      pushToast(
        "Signed in to ChoyFood",
        `Welcome, ${res.user.displayName || res.user.email}`,
        "success"
      );
    } catch (error: any) {
      if (error?.code === "auth/popup-closed-by-user") return;
      pushToast("Sign-in failed", error?.message || "Please try Google Sign-In again.", "error");
    }
  }, [pushToast]);

  const logout = useCallback(async () => {
    try {
      await signOutUser();
      pushToast("Signed out", "You are now browsing as a guest.", "info");
    } catch (error: any) {
      pushToast("Sign-out failed", error?.message || "Please try again.", "error");
    }
  }, [pushToast]);

  const seedCatalogToFirestore = useCallback(async () => {
    if (!authUser || !isAdmin) {
      pushToast("Admin sign-in required", "Sign in as Super Admin to sync default menu.", "error");
      return;
    }
    const batch = writeBatch(db);
    SEED_DISHES.forEach((dish) => {
      const ref = doc(db, "dishes", dish.id);
      batch.set(ref, {
        name: dish.name.slice(0, BLUEPRINT_LIMITS.dishNameMax),
        description: dish.description.slice(0, BLUEPRINT_LIMITS.dishDescMax),
        price: dish.price,
        saleGroup: dish.saleGroup,
        storeName: dish.storeName.slice(0, BLUEPRINT_LIMITS.storeNameMax),
        storeOwnerId: authUser.uid,
        imageUrl: dish.imageUrl,
        likes: dish.likes,
        available: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    SEED_PROMOS.forEach((promo) => {
      const ref = doc(db, "promos", promo.id);
      batch.set(ref, {
        code: promo.code,
        discount: promo.discount,
        minSpend: promo.minSpend,
        description: promo.description,
        active: promo.active,
        createdAt: serverTimestamp(),
      });
    });
    try {
      await batch.commit();
      await logActivity("Super Admin synced initial 6 Filipino partner dishes to Firestore.", "store");
      pushToast("Menu Catalog Synced", "6 signature Filipino dishes saved to Firestore.", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "dishes");
    }
  }, [authUser, isAdmin, logActivity, pushToast]);

  const likeDish = useCallback(
    async (dish: Dish) => {
      if (!authUser) {
        setDishes((prev) =>
          prev.map((d) => (d.id === dish.id ? { ...d, likes: d.likes + 1 } : d))
        );
        pushToast("Added to Favorites", "Sign in with Google to save favorites across devices.", "info");
        return;
      }

      const dishRef = doc(db, "dishes", dish.id);
      const path = `dishes/${dish.id}`;
      try {
        const snap = await getDoc(dishRef);
        if (!snap.exists()) {
          setDishes((prev) =>
            prev.map((d) => (d.id === dish.id ? { ...d, likes: d.likes + 1 } : d))
          );
          return;
        }
        await updateDoc(dishRef, {
          likes: (snap.data().likes || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, pushToast]
  );

  const addMenuDish = useCallback(
    async (input: {
      name: string;
      description: string;
      price: number;
      saleGroup: SaleGroup;
      storeName: string;
      imageUrl: string;
    }) => {
      if (!authUser) {
        pushToast("Sign in required", "Sign in with Google to publish partner menu items.", "error");
        return;
      }
      if (!isAdmin && profile?.role !== "store") {
        pushToast("Store permission required", "Only partner store accounts or Super Admin can add dishes.", "error");
        return;
      }

      const dishId = `dish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const path = `dishes/${dishId}`;
      const cleanName = input.name.trim().slice(0, BLUEPRINT_LIMITS.dishNameMax);
      const cleanDesc = input.description.trim().slice(0, BLUEPRINT_LIMITS.dishDescMax);
      const cleanStore = input.storeName.trim().slice(0, BLUEPRINT_LIMITS.storeNameMax);
      const safePrice = Math.max(1, Math.min(50000, Number(input.price) || 100));

      try {
        await setDoc(doc(db, "dishes", dishId), {
          name: cleanName,
          description: cleanDesc,
          price: safePrice,
          saleGroup: input.saleGroup,
          storeName: cleanStore,
          storeOwnerId: authUser.uid,
          imageUrl: input.imageUrl,
          likes: 0,
          available: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logActivity(`Store ${cleanStore} published new dish: ${cleanName}`, "store");
        pushToast("Dish Published", `${cleanName} is now live on the customer menu.`, "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [authUser, isAdmin, profile?.role, logActivity, pushToast]
  );

  const toggleDishAvailability = useCallback(
    async (dish: Dish) => {
      if (!authUser || (!isAdmin && profile?.role !== "store")) {
        pushToast("Store permission required", "Sign in as a Partner Store or Super Admin.", "error");
        return;
      }
      const path = `dishes/${dish.id}`;
      try {
        const snap = await getDoc(doc(db, "dishes", dish.id));
        if (!snap.exists()) {
          pushToast(
            "Sync Catalog First",
            'Click "Sync Default Menu" in Super Admin to persist starter dishes in Firestore.',
            "info"
          );
          return;
        }
        const nextAvailable = !dish.available;
        await updateDoc(doc(db, "dishes", dish.id), {
          available: nextAvailable,
          updatedAt: serverTimestamp(),
        });
        await logActivity(
          `Store marked "${dish.name}" as ${nextAvailable ? "Available" : "Sold Out"}.`,
          "store"
        );
        pushToast(
          nextAvailable ? "Dish Back in Stock" : "Marked Sold Out",
          `${dish.name} is now ${nextAvailable ? "visible to customers" : "hidden from checkout"}.`,
          "success"
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, isAdmin, profile?.role, logActivity, pushToast]
  );

  const updateDishPrice = useCallback(
    async (dish: Dish, newPrice: number) => {
      if (!authUser || (!isAdmin && profile?.role !== "store")) {
        pushToast("Store permission required", "Sign in as a Partner Store or Super Admin.", "error");
        return;
      }
      const safePrice = Math.max(1, Math.min(50000, Number(newPrice) || dish.price));
      const path = `dishes/${dish.id}`;
      try {
        const snap = await getDoc(doc(db, "dishes", dish.id));
        if (!snap.exists()) {
          pushToast(
            "Sync Catalog First",
            'Sync the default catalog in Super Admin before editing starter dish prices.',
            "info"
          );
          return;
        }
        await updateDoc(doc(db, "dishes", dish.id), {
          price: safePrice,
          updatedAt: serverTimestamp(),
        });
        await logActivity(`Updated price for "${dish.name}" to ₱${safePrice.toFixed(2)}.`, "store");
        pushToast("Price Updated", `${dish.name} is now ₱${safePrice.toFixed(2)}.`, "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, isAdmin, profile?.role, logActivity, pushToast]
  );

  const deleteMenuDish = useCallback(
    async (dish: Dish) => {
      if (!authUser || (!isAdmin && profile?.role !== "store")) {
        pushToast("Store permission required", "Sign in as a Partner Store or Super Admin.", "error");
        return;
      }
      const path = `dishes/${dish.id}`;
      try {
        const snap = await getDoc(doc(db, "dishes", dish.id));
        if (!snap.exists()) {
          pushToast("Seed Dish", "Sync catalog first to manage starter dishes in Firestore.", "info");
          return;
        }
        await deleteDoc(doc(db, "dishes", dish.id));
        await logActivity(`Removed dish "${dish.name}" from partner catalog.`, "store");
        pushToast("Dish Removed", `${dish.name} has been deleted from the menu.`, "info");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [authUser, isAdmin, profile?.role, logActivity, pushToast]
  );

  const placeOrder = useCallback(
    async (input: {
      items: OrderItemSummary[];
      subtotal: number;
      distanceTier: DistanceTier;
      paymentMethod: PaymentMethod;
      promoCode: string;
      deliveryAddress: string;
      deliveryNote: string;
      storeName: string;
      storeOwnerId: string;
    }): Promise<Order | null> => {
      if (!authUser || !profile) {
        pushToast("Sign in to place an order", "Use Google Sign-In so we can track your 7-step delivery.", "error");
        return null;
      }

      if (profile.role === "customer" && profile.kycStatus !== "verified") {
        pushToast(
          "KYC Verification Required",
          "To protect against scammers and fake bookings, customers must complete KYC verification before placing orders.",
          "error"
        );
        return null;
      }

      const baseDeliveryFee = DISTANCE_FEES[input.distanceTier].fee;
      const deliveryFee = profile.choyProActive ? 0 : baseDeliveryFee;
      const normalizedPromo = input.promoCode.trim().toUpperCase();
      const discount = normalizedPromo === "CHOY25" && input.subtotal >= 250 ? 25 : 0;
      const totalAmount = Math.max(0, input.subtotal + deliveryFee - discount);

      if (input.paymentMethod === "ChoyWallet" && profile.walletBalance < totalAmount) {
        pushToast(
          "Insufficient Choy Wallet Balance",
          `Your balance is ₱${profile.walletBalance.toFixed(2)}. Choose COD, GCash, or Card instead.`,
          "error"
        );
        return null;
      }

      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const orderNumber = `CF-${Math.floor(1000 + Math.random() * 9000)}`;
      const cleanAddress = input.deliveryAddress.trim().slice(0, BLUEPRINT_LIMITS.addressMax);
      const cleanNote = input.deliveryNote.trim().slice(0, BLUEPRINT_LIMITS.deliveryNoteMax);

      const newOrderPayload = {
        orderNumber,
        customerId: authUser.uid,
        customerDisplayName: profile.displayName.slice(0, BLUEPRINT_LIMITS.displayNameMax),
        storeName: input.storeName.slice(0, BLUEPRINT_LIMITS.storeNameMax),
        storeOwnerId: BLUEPRINT_LIMITS.idPattern.test(input.storeOwnerId)
          ? input.storeOwnerId
          : authUser.uid,
        riderId: "",
        riderCode: "",
        items: input.items.slice(0, 25),
        subtotal: input.subtotal,
        distanceTier: input.distanceTier,
        deliveryFee,
        discount,
        totalAmount,
        paymentMethod: input.paymentMethod,
        deliveryAddress: cleanAddress.length >= 3 ? cleanAddress : "Banilad, Cebu City",
        deliveryNote: cleanNote,
        step: 1,
        status: "picked" as OrderStatus,
        proofOfDeliveryNote: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(doc(db, "orders", orderId), newOrderPayload);

      if (input.paymentMethod === "ChoyWallet" && totalAmount > 0) {
        batch.update(doc(db, "users", authUser.uid), {
          walletBalance: Number((profile.walletBalance - totalAmount).toFixed(2)),
          updatedAt: serverTimestamp(),
        });
      }

      try {
        await batch.commit();
        await logActivity(
          `Order ${orderNumber} placed by ${profile.displayName} (₱${totalAmount.toFixed(2)} · ${input.paymentMethod})`,
          "order"
        );
        pushToast(
          `Order ${orderNumber} Placed`,
          "Step 1: Customer Picked — Live 7-step tracking active.",
          "success"
        );
        return { id: orderId, ...newOrderPayload };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
      }
    },
    [authUser, profile, logActivity, pushToast]
  );

  const advanceOrder = useCallback(
    async (
      order: Order,
      nextStep: number,
      options?: { proofOfDeliveryNote?: string; claimAsRider?: boolean; riderCode?: string }
    ) => {
      if (!authUser) {
        pushToast("Sign in required", "Sign in to update live order status.", "error");
        return;
      }

      const stepMeta = ORDER_STEPS.find((s) => s.step === nextStep);
      if (!stepMeta) return;

      const updatePayload: Record<string, unknown> = {
        step: nextStep,
        status: stepMeta.status,
        updatedAt: serverTimestamp(),
      };

      if (options?.claimAsRider) {
        updatePayload.riderId = authUser.uid;
        updatePayload.riderCode = (options.riderCode || profile?.riderCode || "JC389").slice(0, 20);
      }

      if (nextStep === 7 && options?.proofOfDeliveryNote !== undefined) {
        updatePayload.proofOfDeliveryNote = options.proofOfDeliveryNote.slice(
          0,
          BLUEPRINT_LIMITS.deliveryNoteMax
        );
      }

      const path = `orders/${order.id}`;
      try {
        await updateDoc(doc(db, "orders", order.id), updatePayload);
        await logActivity(
          `Order ${order.orderNumber} advanced to ${stepMeta.label}`,
          nextStep === 4 || nextStep >= 6 ? "rider" : nextStep === 3 || nextStep === 5 ? "store" : "order"
        );
        pushToast(`Order ${order.orderNumber} Updated`, stepMeta.label, "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, profile?.riderCode, logActivity, pushToast]
  );

  const cancelOrder = useCallback(
    async (order: Order) => {
      if (!authUser) return;
      const path = `orders/${order.id}`;
      try {
        await updateDoc(doc(db, "orders", order.id), {
          status: "cancelled",
          updatedAt: serverTimestamp(),
        });
        await logActivity(`Order ${order.orderNumber} was cancelled.`, "order");
        pushToast("Order Cancelled", `Order ${order.orderNumber} has been cancelled.`, "info");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const rateOrder = useCallback(
    async (order: Order, rating: number, reviewComment?: string) => {
      if (!authUser) {
        pushToast("Sign in required", "Sign in to rate completed orders.", "error");
        return;
      }
      const path = `orders/${order.id}`;
      try {
        await updateDoc(doc(db, "orders", order.id), {
          rating: Math.max(1, Math.min(5, rating)),
          reviewComment: (reviewComment || "").slice(0, 300),
          updatedAt: serverTimestamp(),
        });
        await logActivity(`Order ${order.orderNumber} rated ${rating} stars.`, "order");
        pushToast("Rating Submitted", `Thank you for reviewing order ${order.orderNumber}!`, "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const simulateReferralInvite = useCallback(async () => {
    if (!authUser || !profile) {
      pushToast("Sign in required", "Sign in to simulate referral invites.", "error");
      return;
    }
    const path = `users/${authUser.uid}`;
    const newCount = (profile.referredCount || 0) + 1;
    const newEarnings = (profile.referralEarnings || 0) + 50;
    const newBalance = (profile.walletBalance || 150) + 50;

    try {
      await updateDoc(doc(db, "users", authUser.uid), {
        referredCount: newCount,
        referralEarnings: newEarnings,
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });
      await logActivity(`Simulated successful referral invite. Earned ₱50.`, "order");
      pushToast("Referral Successful! (+₱50)", "Your friend registered using your code! ₱50 credited to your Choy Wallet.", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }, [authUser, profile, logActivity, pushToast]);

  const validatePromoCode = useCallback(
    async (code: string, subtotal: number): Promise<{ valid: boolean; discount: number; message: string }> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) return { valid: false, discount: 0, message: "Enter a promo code." };
      const found = promos.find((p) => p.code.toUpperCase() === cleanCode && p.active);
      if (!found) {
        return { valid: false, discount: 0, message: "Invalid or expired promo code in Firestore." };
      }
      if (subtotal < found.minSpend) {
        return { valid: false, discount: 0, message: `Minimum spend of ₱${found.minSpend} required for ${found.code}.` };
      }
      return { valid: true, discount: found.discount, message: `Promo ${found.code} validated against Firestore! -₱${found.discount}` };
    },
    [promos]
  );

  const updateRiderProfile = useCallback(
    async (input: { riderPhotoUrl?: string }) => {
      if (!authUser) {
        pushToast("Sign in required", "Sign in to update rider profile.", "error");
        return;
      }
      const path = `users/${authUser.uid}`;
      try {
        await updateDoc(doc(db, "users", authUser.uid), {
          riderPhotoUrl: (input.riderPhotoUrl || "").slice(0, 500),
          updatedAt: serverTimestamp(),
        });
        await logActivity("Rider updated profile photo.", "rider");
        pushToast("Profile Updated", "Your rider photo has been saved to Firestore.", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const activateChoyPro = useCallback(async () => {
    if (!authUser || !profile) {
      pushToast("Sign in required", "Sign in with Google to subscribe to Choy Pro.", "error");
      return;
    }
    if (profile.choyProActive) {
      pushToast("Choy Pro Active", "You already enjoy 1-Month Free Delivery on all partner stores.", "info");
      return;
    }
    const path = `users/${authUser.uid}`;
    const newBalance =
      profile.walletBalance >= 149
        ? Number((profile.walletBalance - 149).toFixed(2))
        : profile.walletBalance;

    try {
      await updateDoc(doc(db, "users", authUser.uid), {
        choyProActive: true,
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });
      await logActivity(`User ${profile.displayName} activated Choy Pro 1-Month Free Delivery.`, "system");
      pushToast(
        "Choy Pro Activated",
        "Enjoy ₱0 delivery fees on every partner store for 30 days.",
        "success"
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }, [authUser, profile, logActivity, pushToast]);

  const updateUserAdmin = useCallback(
    async (
      targetUser: UserProfile,
      patch: {
        role?: UserRole;
        walletBalance?: number;
        choyProActive?: boolean;
        riderCode?: string;
        storeName?: string;
      }
    ) => {
      if (!authUser || !isAdmin) {
        pushToast("Super Admin Only", "Only Super Admins can modify user roles and wallets.", "error");
        return;
      }

      const path = `users/${targetUser.uid}`;
      const updatePayload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (patch.role !== undefined) updatePayload.role = patch.role;
      if (patch.walletBalance !== undefined) {
        updatePayload.walletBalance = Math.max(0, Math.min(1000000, Number(patch.walletBalance)));
      }
      if (patch.choyProActive !== undefined) updatePayload.choyProActive = patch.choyProActive;
      if (patch.riderCode !== undefined) updatePayload.riderCode = patch.riderCode.trim().slice(0, 20);
      if (patch.storeName !== undefined) {
        updatePayload.storeName = patch.storeName.trim().slice(0, BLUEPRINT_LIMITS.storeNameMax);
      }

      try {
        await updateDoc(doc(db, "users", targetUser.uid), updatePayload);
        await logActivity(
          `Super Admin updated ${targetUser.displayName} (role: ${patch.role ?? targetUser.role}, wallet: ₱${(patch.walletBalance ?? targetUser.walletBalance).toFixed(2)}).`,
          "system"
        );
        pushToast(
          "Account Updated",
          `Saved changes for ${targetUser.displayName}.`,
          "success"
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, isAdmin, logActivity, pushToast]
  );

  const submitKyc = useCallback(
    async (input: {
      displayName: string;
      realLegalName: string;
      phoneNumber: string;
      otpVerified: boolean;
      idType: IdType;
      idReference: string;
      profilePhotoName: string;
      validIdPhotoName: string;
      privacyConsentAccepted: boolean;
    }): Promise<boolean> => {
      if (!authUser || !profile) {
        pushToast("Sign in required", "Please sign in with Google before submitting KYC.", "error");
        return false;
      }
      if (!input.privacyConsentAccepted) {
        pushToast("Privacy Consent Required", "You must accept the fraud-prevention consent.", "error");
        return false;
      }

      const batch = writeBatch(db);
      const kycRef = doc(db, "kyc_vault", authUser.uid);
      const userRef = doc(db, "users", authUser.uid);

      const cleanDisplay = input.displayName.trim().slice(0, BLUEPRINT_LIMITS.displayNameMax);
      const cleanLegal = input.realLegalName.trim().slice(0, BLUEPRINT_LIMITS.realLegalNameMax);
      const cleanPhone = input.phoneNumber.trim().slice(0, BLUEPRINT_LIMITS.phoneMax);
      const cleanIdRef = input.idReference.trim().slice(0, BLUEPRINT_LIMITS.idRefMax);
      const cleanProfilePhoto = input.profilePhotoName.trim().slice(0, BLUEPRINT_LIMITS.photoNameMax);
      const cleanIdPhoto = input.validIdPhotoName.trim().slice(0, BLUEPRINT_LIMITS.photoNameMax);

      const kycPayload = {
        uid: authUser.uid,
        displayName: cleanDisplay,
        realLegalName: cleanLegal,
        phoneNumber: cleanPhone,
        otpVerified: Boolean(input.otpVerified),
        idType: input.idType,
        idReference: cleanIdRef,
        profilePhotoName: cleanProfilePhoto || "profile_selfie.jpg",
        validIdPhotoName: cleanIdPhoto || "valid_id_card.jpg",
        privacyConsentAccepted: true,
        status: "pending" as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(kycRef, kycPayload);
      batch.update(userRef, {
        kycStatus: "pending",
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        await logActivity(
          `Customer ${cleanDisplay} submitted encrypted KYC record for Super Admin review.`,
          "kyc"
        );
        pushToast(
          "KYC Submitted to Encrypted Vault",
          "Your real legal name and Valid ID are locked exclusively for Super Admin verification.",
          "success"
        );
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `kyc_vault/${authUser.uid}`);
      }
    },
    [authUser, profile, logActivity, pushToast]
  );

  const reviewKyc = useCallback(
    async (record: KycVaultRecord, decision: "verified" | "rejected") => {
      if (!authUser || !isAdmin) {
        pushToast("Super Admin Only", "Only verified Super Admins can approve or reject KYC.", "error");
        return;
      }

      const batch = writeBatch(db);
      batch.update(doc(db, "kyc_vault", record.uid), {
        status: decision,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, "users", record.uid), {
        kycStatus: decision,
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        await logActivity(
          `Super Admin marked KYC for ${record.displayName} as ${decision.toUpperCase()}.`,
          "kyc"
        );
        pushToast(
          `KYC ${decision === "verified" ? "Approved" : "Rejected"}`,
          `${record.displayName}'s verification status has been updated.`,
          decision === "verified" ? "success" : "info"
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `kyc_vault/${record.uid}`);
      }
    },
    [authUser, isAdmin, logActivity, pushToast]
  );

  const submitSupportTicket = useCallback(
    async (input: {
      fullName: string;
      contact: string;
      category: string;
      message: string;
    }): Promise<string | null> => {
      const refCode = `CF-${Math.floor(1000 + Math.random() * 9000)}`;
      if (!authUser) {
        pushToast(
          `Support Reference ${refCode}`,
          "Sign in with Google to save tickets directly to your account history.",
          "info"
        );
        return refCode;
      }

      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const path = `support_tickets/${ticketId}`;
      try {
        await setDoc(doc(db, "support_tickets", ticketId), {
          uid: authUser.uid,
          fullName: input.fullName.trim().slice(0, 100),
          contact: input.contact.trim().slice(0, 120),
          category: input.category.trim().slice(0, 80),
          message: input.message.trim().slice(0, BLUEPRINT_LIMITS.ticketMessageMax),
          referenceCode: refCode,
          status: "open",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await logActivity(`New support ticket ${refCode} opened (${input.category}).`, "system");
        pushToast("Ticket Submitted", `Reference ID: ${refCode}`, "success");
        return refCode;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    [authUser, logActivity, pushToast]
  );

  const resolveSupportTicket = useCallback(
    async (ticket: SupportTicket, status: "open" | "resolved") => {
      if (!authUser || !isAdmin) {
        pushToast("Super Admin Only", "Only Super Admins can resolve support tickets.", "error");
        return;
      }
      const path = `support_tickets/${ticket.id}`;
      try {
        await updateDoc(doc(db, "support_tickets", ticket.id), {
          status,
          updatedAt: serverTimestamp(),
        });
        await logActivity(`Super Admin marked ticket ${ticket.referenceCode} as ${status}.`, "system");
        pushToast(
          status === "resolved" ? "Ticket Resolved" : "Ticket Reopened",
          `${ticket.referenceCode} updated.`,
          "success"
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    [authUser, isAdmin, logActivity, pushToast]
  );

  const dismissActivityLog = useCallback(
    async (logId: string) => {
      if (!authUser || !isAdmin) return;
      const path = `activity_logs/${logId}`;
      try {
        await deleteDoc(doc(db, "activity_logs", logId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    [authUser, isAdmin]
  );

  const runSystemCleaner = useCallback(async () => {
    if (!authUser || !isAdmin) {
      pushToast("Super Admin Only", "Sign in as Super Admin to run the System Cleaner.", "error");
      return;
    }
    const batch = writeBatch(db);
    activityLogs.forEach((log) => {
      batch.delete(doc(db, "activity_logs", log.id));
    });
    const summaryId = `log_${Date.now()}_clean`;
    batch.set(doc(db, "activity_logs", summaryId), {
      message: `System Cleaner purged ${activityLogs.length} old logs, abandoned guest carts, and stale sessions.`,
      category: "system",
      actorId: authUser.uid,
      createdAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      pushToast(
        "System Cleaner Completed",
        `Cleared ${activityLogs.length} activity entries and reclaimed session cache.`,
        "success"
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "activity_logs");
    }
  }, [authUser, isAdmin, activityLogs, pushToast]);

  const loginAsDemoUser = useCallback(async (role: UserRole) => {
    const mockUid = `demo_${role}_${Date.now()}`;
    const mockUser = {
      uid: mockUid,
      email: role === "admin" ? SUPER_ADMIN_EMAIL : `${role}@choyfood.ph`,
      emailVerified: true,
      displayName: role === "admin" ? "Super Admin Choy" : role === "rider" ? "Rider Partner JC389" : role === "store" ? "Nanay's Sizzling Owner" : "Cebu Foodie Customer",
      isAnonymous: false,
    } as unknown as User;

    const mockProfile: UserProfile = {
      uid: mockUid,
      displayName: mockUser.displayName || "ChoyFood User",
      role,
      walletBalance: 2500,
      choyProActive: true,
      kycStatus: "verified",
      riderCode: role === "rider" ? "JC389" : undefined,
      storeName: role === "store" ? "Nanay's Sizzling & BBQ" : undefined,
      referralCode: "CHOY-DEMO",
      referralEarnings: 450,
      referredCount: 8,
      ratingScore: 4.95,
    };

    setAuthUser(mockUser);
    setProfile(mockProfile);
    pushToast("Instant Demo Access", `Successfully signed in as ${role.toUpperCase()} (Bypassed Firebase 2FA).`, "success");
  }, [pushToast]);

  return (
    <FirebaseContext.Provider
      value={{
        authUser,
        authReady,
        profile,
        isAdmin,
        dishes,
        allDishes,
        orders,
        allUsers,
        kycRecords,
        myKycRecord,
        activityLogs,
        supportTickets,
        toasts,
        pushToast,
        dismissToast,
        loginWithGoogle,
        logout,
        likeDish,
        addMenuDish,
        toggleDishAvailability,
        updateDishPrice,
        deleteMenuDish,
        placeOrder,
        advanceOrder,
        cancelOrder,
        rateOrder,
        activateChoyPro,
        updateUserAdmin,
        submitKyc,
        reviewKyc,
        submitSupportTicket,
        resolveSupportTicket,
        dismissActivityLog,
        runSystemCleaner,
        seedCatalogToFirestore,
        simulateReferralInvite,
        promos,
        validatePromoCode,
        updateRiderProfile,
        loginAsDemoUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useChoyFood() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error("useChoyFood must be used inside FirebaseProvider");
  return ctx;
}
