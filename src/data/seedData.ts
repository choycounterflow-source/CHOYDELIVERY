import { BlogPost, Dish, DistanceTier, OrderStatus, PromoCode } from "../types/choyfood";

export const SEED_PROMOS: PromoCode[] = [
  { id: "promo-choy25", code: "CHOY25", discount: 25, minSpend: 250, description: "₱25 OFF on orders ₱250+", active: true },
  { id: "promo-choy50", code: "CHOY50", discount: 50, minSpend: 500, description: "₱50 OFF on orders ₱500+", active: true },
  { id: "promo-surigao", code: "SURIGAO100", discount: 100, minSpend: 1000, description: "₱100 OFF Surigao & Cebu Fiesta orders ₱1,000+", active: true },
];

export const HERO_FEAST_IMAGE = "/src/assets/images/hero_filipino_feast_1795580870947.jpg";

export const DISH_IMAGES = {
  lechonKawali: "/src/assets/images/dish_lechon_kawali_1795580873130.jpg",
  sizzlingSisig: "/src/assets/images/dish_sizzling_sisig_1795580873051.jpg",
  crispyPata: "/src/assets/images/dish_crispy_pata_1795580874566.jpg",
  haloHalo: "/src/assets/images/dish_halo_halo_1795580874831.jpg",
  porkBbq: "/src/assets/images/dish_pork_bbq_1795580876845.jpg",
} as const;

export const SEED_DISHES: Dish[] = [
  {
    id: "dish-lechon-kawali",
    name: "Lechon Kawali Fiesta Combo",
    description:
      "Golden crackling pork belly paired with fragrant garlic rice, pickled papaya atchara, and spiced vinegar.",
    price: 220,
    saleGroup: "Combo Meal",
    storeName: "Nanay's Sizzling & BBQ",
    storeOwnerId: "store_nanays_bbq",
    imageUrl: DISH_IMAGES.lechonKawali,
    likes: 342,
    available: true,
  },
  {
    id: "dish-sizzling-sisig",
    name: "Sizzling Pork Sisig with Egg",
    description:
      "Finely chopped crispy pork tossed with red onions, siling labuyo, calamansi, and a glossy egg yolk.",
    price: 180,
    saleGroup: "Solo",
    storeName: "Nanay's Sizzling & BBQ",
    storeOwnerId: "store_nanays_bbq",
    imageUrl: DISH_IMAGES.sizzlingSisig,
    likes: 512,
    available: true,
  },
  {
    id: "dish-crispy-pata",
    name: "Family Crispy Pata Feast",
    description:
      "Whole deep-fried pork knuckle served over banana leaf with spiced soy-vinegar dipping bowl. Good for 4-5.",
    price: 680,
    saleGroup: "Good for Family",
    storeName: "Cebu Grill Hub",
    storeOwnerId: "store_cebu_grill",
    imageUrl: DISH_IMAGES.crispyPata,
    likes: 289,
    available: true,
  },
  {
    id: "dish-halo-halo",
    name: "Halo-Halo Special Supreme",
    description:
      "Shaved ice layered with ube halaya ice cream, creamy leche flan, sweetened beans, macapuno, and crisp pinipig.",
    price: 120,
    saleGroup: "Promo",
    storeName: "Sweet Corner",
    storeOwnerId: "store_sweet_corner",
    imageUrl: DISH_IMAGES.haloHalo,
    likes: 620,
    available: true,
  },
  {
    id: "dish-garlic-rice-duo",
    name: "Garlic Rice & Fried Egg Duo",
    description:
      "Toasted golden garlic fried rice topped with a crispy-edged sunny-side-up egg. Ideal add-on for sizzling mains.",
    price: 45,
    saleGroup: "Extra",
    storeName: "Nanay's Sizzling & BBQ",
    storeOwnerId: "store_nanays_bbq",
    imageUrl: DISH_IMAGES.porkBbq,
    likes: 115,
    available: true,
  },
  {
    id: "dish-pork-bbq-skewers",
    name: "Charcoal Pork BBQ Skewers (5 pcs)",
    description:
      "Sweet-savory marinated pork skewers flame-grilled over hot charcoal and served with spiced Cebu vinegar.",
    price: 175,
    saleGroup: "Solo",
    storeName: "Cebu Grill Hub",
    storeOwnerId: "store_cebu_grill",
    imageUrl: DISH_IMAGES.porkBbq,
    likes: 430,
    available: true,
  },
];

export const DISTANCE_FEES: Record<DistanceTier, { label: string; fee: number; eta: string }> = {
  "0-2km": { label: "0 - 2 km (Near Neighborhood)", fee: 25, eta: "15-20 mins" },
  "2-5km": { label: "2 - 5 km (Standard Town Delivery)", fee: 35, eta: "22-30 mins" },
  "5-10km": { label: "5 - 10 km (Extended Distance)", fee: 50, eta: "35-45 mins" },
};

export const ORDER_STEPS: {
  step: number;
  shortLabel: string;
  label: string;
  status: OrderStatus;
}[] = [
  { step: 1, shortLabel: "Pick", label: "Step 1: Customer Picked", status: "picked" },
  { step: 2, shortLabel: "Check", label: "Step 2: Admin Checked", status: "admin_checked" },
  { step: 3, shortLabel: "Cook", label: "Step 3: Store Accepted", status: "store_accepted" },
  { step: 4, shortLabel: "Rider", label: "Step 4: Rider Accepted", status: "rider_accepted" },
  { step: 5, shortLabel: "Ready", label: "Step 5: Food Ready", status: "food_ready" },
  { step: 6, shortLabel: "Way", label: "Step 6: Rider Picked Up", status: "picked_up" },
  { step: 7, shortLabel: "Done", label: "Step 7: Delivered", status: "delivered" },
];

export const COMMUNITY_BLOG_POSTS: BlogPost[] = [
  {
    id: "blog-street-food",
    title: "Top 10 Must-Try Filipino Street & Grill Favorites in 2026",
    readMinutes: 4,
    publishedDate: "November 2026",
    tag: "Food Culture",
    summary:
      "Explore smoky charcoal-grilled pork skewers, crispy lechon kawali, and neighborhood sizzling specialties across Metro Cebu.",
    imageUrl: DISH_IMAGES.porkBbq,
    body: [
      "Across Cebu and neighboring provinces, late-afternoon charcoal smoke signals the best hour of the day. Family-run stalls and neighborhood karinderyas keep generations-old marinades alive using calamansi, soy sauce, crushed garlic, and banana ketchup.",
      "With ChoyFood, these beloved street-side favorites are packed hot in vented containers so crackling skin stays crisp from grill to doorstep.",
      "Pro tip: pair Charcoal Pork BBQ Skewers with a Garlic Rice & Fried Egg Duo and apply voucher CHOY25 on orders over ₱250.",
    ],
  },
  {
    id: "blog-karinderyas",
    title: "How ChoyFood Empowers Neighborhood Karinderyas",
    readMinutes: 5,
    publishedDate: "November 2026",
    tag: "Community",
    summary:
      "Digitizing home cooks and independent kitchens brings authentic family recipes to busy households without predatory platform fees.",
    imageUrl: DISH_IMAGES.lechonKawali,
    body: [
      "Traditional delivery apps often charge independent kitchens up to 30% commission per dish, squeezing margins for family eateries.",
      "ChoyFood's transparent store portal lets neighborhood cooks manage their live kitchen queue, update solo or family platters in seconds, and keep fair earnings on every ticket.",
    ],
  },
  {
    id: "blog-rider-life",
    title: "A Day in the Life of a ChoyFood Delivery Rider",
    readMinutes: 6,
    publishedDate: "October 2026",
    tag: "Rider Story",
    summary:
      "Behind the handlebars: how 60-second fair dispatch windows and transparent distance tiers protect our verified rider fleet.",
    imageUrl: HERO_FEAST_IMAGE,
    body: [
      "Every morning, verified riders like Rider JC389 check in through the Rider Portal to accept nearby neighborhood runs with clear distance payouts before leaving the curb.",
      "Clear 0-2 km, 2-5 km, and 5-10 km distance tiers ensure riders are compensated fairly for fuel and effort, while Proof of Delivery verification protects both riders and customers.",
    ],
  },
  {
    id: "blog-kitchen-safety",
    title: "Food Safety and Hygiene: Our Partner Kitchen Checklist",
    readMinutes: 4,
    publishedDate: "October 2026",
    tag: "Safety",
    summary:
      "How every ChoyFood partner kitchen verifies sanitary permits, tamper-evident sealing, and hot-cold separation.",
    imageUrl: DISH_IMAGES.sizzlingSisig,
    body: [
      "Every store onboarded to ChoyFood undergoes business and sanitary permit review by our Super Admin team before going live.",
      "Hot sizzling dishes and cold desserts like Halo-Halo Special Supreme are packed in insulated thermal compartments so every item arrives at its intended temperature.",
    ],
  },
  {
    id: "blog-smart-ordering",
    title: "Save More on Every Meal with Choy Wallet and Choy Pro",
    readMinutes: 3,
    publishedDate: "October 2026",
    tag: "Savings Guide",
    summary:
      "Combine Combo Meals, CHOY25 promo vouchers, and Choy Pro 1-month free delivery to cut household lunch costs.",
    imageUrl: DISH_IMAGES.haloHalo,
    body: [
      "Frequent weekday diners save immediately with Choy Pro at ₱149/month — unlocking ₱0 delivery fees on every distance tier across all partner stores.",
      "Pair Choy Pro with Good for Family platters like the Family Crispy Pata Feast for weekend gatherings.",
    ],
  },
  {
    id: "blog-privacy-kyc",
    title: "Why ChoyFood Separates Your Display Name from Your Legal ID",
    readMinutes: 5,
    publishedDate: "September 2026",
    tag: "Trust & Privacy",
    summary:
      "Inside our Supabase Row-Level Security architecture that locks Valid IDs inside an encrypted Super Admin Vault.",
    imageUrl: DISH_IMAGES.crispyPata,
    body: [
      "Fake bookings hurt local kitchens and riders alike. Yet customers deserve strong personal privacy when ordering dinner.",
      "ChoyFood solves both with a split-collection vault: stores and riders only see your public Display Name, while your legal name and Valid ID remain strictly locked to verified Super Admin review.",
    ],
  },
];
