import { Category, TripOption, TripState, Traveler, tripDates } from "./types";

const travelerDetails = [
  { age: 12, name: "Avanthi", gender: "Female" },
  { age: 13, name: "Naimish", gender: "Male" },
  { age: 22, name: "Keerthi", gender: "Female" },
  { age: 22, name: "Ananya", gender: "Female" },
  { age: 22, name: "Sadana", gender: "Female" },
  { age: 23, name: "Anirudh", gender: "Male" },
  { age: 23, name: "Vasista", gender: "Male" },
  { age: 47, name: "Sravanthi", gender: "Female" },
  { age: 49, name: "Lavanya Nallamala", gender: "Female" },
  { age: 52, name: "Ramesh", gender: "Male" },
  { age: 55, name: "Srinivasa Rao Kolla", gender: "Male" },
  { age: 50, name: "Mohana Kota", gender: "Female" },
  { age: 28, name: "Bhavya", gender: "Female" },
  { age: 53, name: "Kusuma", gender: "Female" },
  { age: 57, name: "Siva Prasad", gender: "Male" }
] as const;

export function createSeedTravelers(): Traveler[] {
  return travelerDetails.map((traveler, index) => {
    const attendance = tripDates.filter((date) => {
      if (date === "2026-08-01" && index >= 12) return false;
      if (date === "2026-08-04" && (traveler.name === "Sadana" || traveler.name === "Anirudh")) return false;
      return true;
    });

    return {
      id: `traveler-${index + 1}`,
      name: traveler.name,
      age: traveler.age,
      gender: traveler.gender,
      isOrganizer: traveler.name === "Keerthi" || traveler.name === "Mohana Kota",
      attendance
    };
  });
}

const seedOptionGroups: Array<{
  category: Category;
  items: Array<{ name: string; type: string; bestTime: string; notes: string }>;
}> = [
  {
    category: "food",
    items: [
      { name: "Anthe Restaurant", type: "Cafe / continental-style food", bestTime: "Brunch or dinner", notes: "Good for a relaxed group meal" },
      { name: "Bread & Chocolate", type: "Bakery, cafe, breakfast, desserts, chocolate, smoothie bowls, pizza", bestTime: "Breakfast / brunch, 9 AM-12 PM", notes: "Best for breakfast, coffee, baked goods, chocolate" },
      { name: "GMT Gelato", type: "Gelato / dessert", bestTime: "Afternoon or after dinner, 4 PM-10 PM", notes: "Good dessert stop after beach or dinner" },
      { name: "Coromandel Cafe", type: "Cafe, Continental, Italian, tea, beverages", bestTime: "Brunch or early dinner", notes: "Good for a pretty Pondicherry cafe meal; listed as cafe/continental/Italian on Zomato." },
      { name: "Tanto Pondy", type: "Italian, pizza, pasta", bestTime: "Lunch or dinner", notes: "Good group-friendly food option" },
      { name: "KBS Cafe", type: "Coffee / cafe", bestTime: "Morning coffee or evening coffee", notes: "Good quick coffee stop" },
      { name: "Maison Perumal", type: "Tamil / South Indian heritage dining", bestTime: "Dinner", notes: "Better as a slow, heritage-style meal" },
      { name: "Villa Shanti", type: "Indian + European cuisine, restaurant/cafe-bar", bestTime: "Dinner, 7 PM onwards", notes: "Strong dinner option in White Town; boutique hotel with restaurant and cafe bar." },
      { name: "Pondicherry Kamatchi", type: "Spicy Indian / South Indian non-veg", bestTime: "Lunch", notes: "Best when you want proper spicy local Indian food" },
      { name: "Dune Eco Village", type: "Ayurvedic spa + wellness food experience", bestTime: "Late morning to afternoon", notes: "More of a wellness/spa experience than just food" },
      { name: "Le Petit Four", type: "French bakery / cafe", bestTime: "Evening snack", notes: "Your note: mid food, so keep as optional" },
      { name: "The Spot", type: "Cafe / beach-view food and drinks", bestTime: "Sunset / evening", notes: "Your note: bad service, but great vibe and view" },
      { name: "Baker Street", type: "French bakery, cafe, pastries, sandwiches", bestTime: "Breakfast / brunch", notes: "Good for pastries, sandwiches, quick cafe food" },
      { name: "Hotel Madurai Veedu", type: "South Indian / Tamil meals", bestTime: "Lunch", notes: "Good for local-style meal" },
      { name: "Pretty Starbucks", type: "Coffee / cafe chain", bestTime: "Afternoon coffee", notes: "Add only if the space/location is worth the vibe" },
      { name: "Chez Francis", type: "French / European / heritage dining", bestTime: "Dinner", notes: "Better for a slow evening meal" },
      { name: "Hotel Rolex", type: "Local Indian food", bestTime: "Lunch or late dinner", notes: "Add as a casual/local food stop" }
    ]
  },
  {
    category: "shopping",
    items: [
      { name: "Flowerchild Closet", type: "Cotton clothing / boutique", bestTime: "11 AM-6 PM", notes: "Good for soft Pondicherry-style clothing" },
      { name: "Hidesign Factory Outlet", type: "Leather bags / accessories", bestTime: "11 AM-7 PM", notes: "Good for bags, wallets, leather goods" },
      { name: "Street Shopping - Nehru Street / Sunday Market / A2B area", type: "Street shopping, clothes, accessories, local finds", bestTime: "Sunday morning to evening", notes: "Best when you want a busy local shopping vibe" },
      { name: "Chintz", type: "Boutique / clothing / home-style pieces", bestTime: "11 AM-6 PM", notes: "Good for curated shopping" },
      { name: "Janaki", type: "Boutique / lifestyle / clothing", bestTime: "11 AM-6 PM", notes: "Good for Pondicherry aesthetic shopping" },
      { name: "Anokhi", type: "Cotton clothing / block prints", bestTime: "11 AM-6 PM", notes: "Good for quality cottons and prints" },
      { name: "Via Pondicherry", type: "Boutique / souvenirs / lifestyle", bestTime: "11 AM-6 PM", notes: "Good for gifting and Pondicherry-themed finds" },
      { name: "Crepes in Touch", type: "Gifting / cotton headbands / small items", bestTime: "Afternoon", notes: "Good for cute gifting pieces" },
      { name: "Church Gate", type: "Chocolates, cheese, French-style items", bestTime: "Afternoon / evening", notes: "Good for edible gifts and French-style items" },
      { name: "La Maison Rose", type: "Boutique / cafe area / aesthetic stop", bestTime: "Afternoon", notes: "Good for photos, browsing, and cafe pairing" },
      { name: "Kalinka Art Gallery", type: "Art / gallery / culture shopping", bestTime: "Afternoon", notes: "Good for slower, artsy shopping" }
    ]
  },
  {
    category: "temples",
    items: [
      { name: "Sri Aurobindo Ashram", type: "Ashram / spiritual place", bestTime: "Morning, 8 AM-11:30 AM, or afternoon, 2 PM-6 PM", notes: "Official visiting hours are 8 AM-11:30 AM and 2 PM-6 PM." },
      { name: "Vinayagar Temple", type: "Hindu temple", bestTime: "Early morning or evening", notes: "Best when it is cooler and calmer" },
      { name: "Varadaraja Perumal Temple", type: "Hindu temple", bestTime: "Morning or evening", notes: "Good for a traditional temple visit" },
      { name: "Sacred Heart Basilica", type: "Church / basilica", bestTime: "Morning or early evening", notes: "Best for quiet time and architecture" }
    ]
  },
  {
    category: "beaches",
    items: [
      { name: "Rock Beach", type: "Promenade / beach walk", bestTime: "Sunrise or evening", notes: "Especially good early morning for sunrise or evening for the promenade vibe." },
      { name: "Sunrise", type: "Beach sunrise experience", bestTime: "5:45 AM-6:30 AM", notes: "Best paired with Rock Beach / Promenade" },
      { name: "Eden Beach", type: "Clean beach / relaxed beach time", bestTime: "Morning or late afternoon", notes: "Avoid harsh afternoon sun" },
      { name: "Pondy Marina", type: "Beach / food stalls / evening outing", bestTime: "Evening", notes: "Good for a casual group evening" },
      { name: "Mangrove Forest", type: "Nature / boating / scenic experience", bestTime: "Morning", notes: "Best before it gets too hot" },
      { name: "Arikamedu", type: "Heritage / ruins / history spot", bestTime: "Morning or late afternoon", notes: "Better as a calm sightseeing stop" },
      { name: "Pondy Yacht Club", type: "Water / boating / leisure", bestTime: "Sunset / early evening", notes: "Good for a slightly premium coastal experience" },
      { name: "Chunnambar Boat House", type: "Boating / backwater / beach access", bestTime: "Morning to afternoon", notes: "Better earlier in the day before heat and crowds" },
      { name: "French Colony / White Town", type: "Walking area / streets / photos / cafes", bestTime: "Morning walk or golden hour", notes: "Best for colonial streets, photos, cafes, and slow walking" }
    ]
  },
  {
    category: "nightlife",
    items: []
  }
];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function createSeedOptions(): TripOption[] {
  return seedOptionGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: `seed-${group.category}-${slug(item.name)}`,
      category: group.category,
      name: item.name,
      location: "Pondicherry",
      link: "",
      description: item.type,
      famousFor: item.bestTime,
      notes: item.notes,
      totalCost: null,
      perPersonCost: null,
      capacityNotes: "",
      createdBy: "traveler-3",
      createdAt: "2026-06-20T00:00:00.000Z"
    }))
  );
}

export function createInitialState(): TripState {
  return {
    travelers: createSeedTravelers(),
    options: createSeedOptions(),
    ratings: [],
    savedItinerary: null
  };
}
