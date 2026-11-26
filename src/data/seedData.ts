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
  garlicRiceEgg: "/src/assets/images/dish_garlic_rice_egg_1795666306678.jpg",
  jbChickenjoy: "/src/assets/images/jb_chickenjoy_1795665902402.jpg",
  jbChickenBucket: "/src/assets/images/jb_chicken_bucket_1795665903072.jpg",
  jbSpaghetti: "/src/assets/images/jb_spaghetti_palabok_1795665903397.jpg",
  jbPalabok: "/src/assets/images/jb_palabok_1795666307416.jpg",
  jbChickenSpaghetti: "/src/assets/images/jb_chicken_spaghetti_1795666307794.jpg",
  jbChickenPalabok: "/src/assets/images/jb_chicken_palabok_1795666307386.jpg",
  jbChickenSteak: "/src/assets/images/jb_chicken_steak_combo_1795666308611.jpg",
  jbYumburger: "/src/assets/images/jb_yumburger_solo_1795666308375.jpg",
  jbChickenSandwich: "/src/assets/images/jb_chicken_sandwich_1795666309297.jpg",
  jbBurgerSteak: "/src/assets/images/jb_burger_steak_1795665903824.jpg",
  jbSilogBreakfast: "/src/assets/images/jb_silog_breakfast_1795666311301.jpg",
  jbCrispyFries: "/src/assets/images/jb_crispy_fries_1795666309336.jpg",
  jbPeachMangoPie: "/src/assets/images/jb_peach_mango_pie_1795666310389.jpg",
  jbChocoSundae: "/src/assets/images/jb_choco_sundae_1795666309883.jpg",
  jbCokeFloat: "/src/assets/images/jb_coke_float_1795666310123.jpg",
} as const;

const jbDish = (
  id: string,
  name: string,
  description: string,
  originalPrice: number,
  saleGroup: Dish["saleGroup"],
  imageUrl: string
): Dish => ({
  id,
  name,
  description,
  price: originalPrice,
  storePrice: originalPrice,
  adminMarkup: 0,
  saleGroup,
  storeName: "Jollibee / Centro",
  storeOwnerId: "store_jollibee_surigao",
  imageUrl,
  likes: 0,
  available: true,
  approvalStatus: "approved",
});

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
    likes: 0,
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
    likes: 0,
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
    likes: 0,
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
    likes: 0,
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
    imageUrl: DISH_IMAGES.garlicRiceEgg,
    likes: 0,
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
    likes: 0,
    available: true,
  },

  // Jollibee Surigao City — Full Menu at Current Store Counter Price (Admin Markup Blank / ₱0)
  jbDish(
    "dish-jb-1pc-chickenjoy-solo",
    "1-pc Chickenjoy Solo",
    "Philippines' best-tasting crispylicious, juicylicious fried chicken served with steamed rice and signature gravy.",
    96,
    "Solo",
    DISH_IMAGES.jbChickenjoy
  ),
  jbDish(
    "dish-jb-1pc-chickenjoy-drink",
    "1-pc Chickenjoy with Drink",
    "1-piece golden crispy Chickenjoy with steamed white rice, gravy, and regular soft drink.",
    118,
    "Combo Meal",
    DISH_IMAGES.jbChickenjoy
  ),
  jbDish(
    "dish-jb-2pc-chickenjoy-solo",
    "2-pc Chickenjoy Solo",
    "Double crispylicious, juicylicious Chickenjoy pieces with steamed rice and signature brown gravy.",
    188,
    "Solo",
    DISH_IMAGES.jbChickenjoy
  ),
  jbDish(
    "dish-jb-2pc-chickenjoy-drink",
    "2-pc Chickenjoy with Drink",
    "2-piece golden Chickenjoy served with steamed white rice, signature gravy, and ice-cold soft drink.",
    210,
    "Combo Meal",
    DISH_IMAGES.jbChickenjoy
  ),
  jbDish(
    "dish-jb-chickenjoy-spaghetti",
    "1-pc Chickenjoy with Jolly Spaghetti",
    "1-pc Chickenjoy paired with sweet-sarap Jolly Spaghetti, steamed rice, and gravy.",
    155,
    "Combo Meal",
    DISH_IMAGES.jbChickenSpaghetti
  ),
  jbDish(
    "dish-jb-chickenjoy-palabok",
    "1-pc Chickenjoy with Palabok Fiesta",
    "Crispy 1-pc Chickenjoy served alongside savory Palabok Fiesta topped with shrimp, egg, and chicharon.",
    227,
    "Combo Meal",
    DISH_IMAGES.jbChickenPalabok
  ),
  jbDish(
    "dish-jb-chickenjoy-burgersteak",
    "1-pc Chickenjoy with Burger Steak",
    "1-pc crispy Chickenjoy paired with 1-pc beef Burger Steak in mushroom gravy and steamed rice.",
    151,
    "Combo Meal",
    DISH_IMAGES.jbChickenSteak
  ),
  jbDish(
    "dish-jb-6pc-bucket",
    "6-pc Chickenjoy Bucket",
    "6 pieces of crispylicious, juicylicious Chickenjoy in a sharing bucket with signature gravy.",
    494,
    "Good for Family",
    DISH_IMAGES.jbChickenBucket
  ),
  jbDish(
    "dish-jb-8pc-bucket",
    "8-pc Chickenjoy Bucket",
    "8 pieces of golden crispy Chickenjoy family bucket with cups of signature brown gravy.",
    604,
    "Good for Family",
    DISH_IMAGES.jbChickenBucket
  ),
  jbDish(
    "dish-jb-6pc-bucket-meal",
    "6-pc Chickenjoy Bucket Meal",
    "6-pc Chickenjoy Bucket complete with rice bowls, Jolly Spaghetti Family Pan, and drinks.",
    747,
    "Good for Family",
    DISH_IMAGES.jbChickenBucket
  ),
  jbDish(
    "dish-jb-8pc-bucket-meal",
    "8-pc Chickenjoy Bucket Meal",
    "8-pc Chickenjoy Bucket fiesta bundle with rice bowls, Jolly Spaghetti Family Pan, and drinks.",
    899,
    "Good for Family",
    DISH_IMAGES.jbChickenBucket
  ),
  jbDish(
    "dish-jb-spaghetti-solo",
    "Jolly Spaghetti Solo",
    "Classic Filipino sweet-style meaty spaghetti loaded with chunky hotdog slices and grated cheddar cheese.",
    65,
    "Solo",
    DISH_IMAGES.jbSpaghetti
  ),
  jbDish(
    "dish-jb-spaghetti-drink",
    "Jolly Spaghetti with Drink",
    "Meaty, cheesy sweet-sarap Jolly Spaghetti served with a regular chilled soft drink.",
    89,
    "Combo Meal",
    DISH_IMAGES.jbSpaghetti
  ),
  jbDish(
    "dish-jb-spaghetti-family",
    "Jolly Spaghetti Family Pan",
    "Sharing pan of Jolly Spaghetti with rich meat sauce, hotdog slices, and extra cheddar cheese. Good for 4-5.",
    265,
    "Good for Family",
    DISH_IMAGES.jbSpaghetti
  ),
  jbDish(
    "dish-jb-palabok-solo",
    "Palabok Fiesta Solo",
    "Traditional rice noodles coated in rich garlic-shrimp sauce, topped with pork cracklings, egg, and shrimp.",
    115,
    "Solo",
    DISH_IMAGES.jbPalabok
  ),
  jbDish(
    "dish-jb-palabok-family",
    "Palabok Fiesta Family Pan",
    "Large fiesta tray of savory Palabok noodles with shrimp, boiled eggs, and crispy chicharon bits.",
    425,
    "Good for Family",
    DISH_IMAGES.jbPalabok
  ),
  jbDish(
    "dish-jb-yumburger-solo",
    "Yumburger Solo",
    "Langhap-Sarap 100% beef patty with signature sweet-creamy dressing inside a soft toasted bun.",
    48,
    "Solo",
    DISH_IMAGES.jbYumburger
  ),
  jbDish(
    "dish-jb-cheesy-yumburger",
    "Cheesy Yumburger Solo",
    "Langhap-Sarap beef patty topped with creamy melted cheddar cheese and special burger dressing.",
    76,
    "Solo",
    DISH_IMAGES.jbYumburger
  ),
  jbDish(
    "dish-jb-champ-solo",
    "Champ Burger Solo",
    "1/3-pound 100% pure beef patty with crisp lettuce, fresh tomato, cheddar cheese, and creamy dressing.",
    185,
    "Solo",
    DISH_IMAGES.jbYumburger
  ),
  jbDish(
    "dish-jb-aloha-champ",
    "Aloha Champ Solo",
    "Big 1/3-pound beef Champ patty layered with sweet grilled pineapple ring, crispy bacon, lettuce, and honey mustard.",
    225,
    "Solo",
    DISH_IMAGES.jbYumburger
  ),
  jbDish(
    "dish-jb-crunchy-chicken-sandwich",
    "Crunchy Chicken Sandwich Solo",
    "Crispy golden chicken fillet with tangy-creamy sandwich dressing on a soft toasted bun.",
    65,
    "Solo",
    DISH_IMAGES.jbChickenSandwich
  ),
  jbDish(
    "dish-jb-1pc-burger-steak",
    "1-pc Burger Steak Solo",
    "Savory 100% beef patty smothered in rich mushroom gravy with sliced button mushrooms and steamed rice.",
    68,
    "Solo",
    DISH_IMAGES.jbBurgerSteak
  ),
  jbDish(
    "dish-jb-2pc-burger-steak",
    "2-pc Burger Steak with Drink",
    "Two juicy beef patties in savory mushroom gravy with steamed white rice and regular soft drink.",
    142,
    "Combo Meal",
    DISH_IMAGES.jbBurgerSteak
  ),
  jbDish(
    "dish-jb-super-meal-a",
    "Jolly Super Meal A",
    "All-in-one feast: 1-pc Chickenjoy, half Jolly Spaghetti, 3-pc Lumpiang Shanghai, steamed rice, and drink.",
    220,
    "Combo Meal",
    DISH_IMAGES.jbChickenSpaghetti
  ),
  jbDish(
    "dish-jb-breakfast-longganisa",
    "Breakfast Longganisa Solo",
    "Two savory-sweet Filipino pork longganisa links served with garlic rice and sunny-side-up fried egg.",
    165,
    "Solo",
    DISH_IMAGES.jbSilogBreakfast
  ),
  jbDish(
    "dish-jb-breakfast-corned-beef",
    "Breakfast Corned Beef Solo",
    "Tender sautéed Filipino corned beef with onions paired with fragrant garlic rice and fried egg.",
    165,
    "Solo",
    DISH_IMAGES.jbSilogBreakfast
  ),
  jbDish(
    "dish-jb-fries-regular",
    "Jolly Crispy Fries (Regular)",
    "Golden crispy potato fries lightly salted and cooked fresh to order.",
    55,
    "Extra",
    DISH_IMAGES.jbCrispyFries
  ),
  jbDish(
    "dish-jb-fries-large",
    "Jolly Crispy Fries (Large)",
    "Large sharing portion of hot, golden-crisp Jolly Crispy Fries.",
    88,
    "Extra",
    DISH_IMAGES.jbCrispyFries
  ),
  jbDish(
    "dish-jb-peach-mango-pie",
    "Peach Mango Pie",
    "Crispy golden pocket crust filled with warm, sweet Philippine mangoes and juicy peaches.",
    50,
    "Extra",
    DISH_IMAGES.jbPeachMangoPie
  ),
  jbDish(
    "dish-jb-peach-mango-3pc",
    "3-pc Peach Mango Pie Box",
    "Three warm, flaky Peach Mango Pies packed in a sharing box.",
    145,
    "Promo",
    DISH_IMAGES.jbPeachMangoPie
  ),
  jbDish(
    "dish-jb-choco-sundae",
    "Choco Sundae Twirl",
    "Creamy vanilla soft-serve sundae generously swirled with rich chocolate fudge sauce.",
    55,
    "Extra",
    DISH_IMAGES.jbChocoSundae
  ),
  jbDish(
    "dish-jb-coke-float",
    "Coke Float",
    "Ice-cold Coca-Cola topped with creamy vanilla soft-serve ice cream and chocolate drizzle.",
    62,
    "Extra",
    DISH_IMAGES.jbCokeFloat
  ),
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
