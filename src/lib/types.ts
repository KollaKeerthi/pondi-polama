export const tripDates = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"] as const;

export const categories = ["stay", "food", "shopping", "temples", "beaches", "nightlife"] as const;

export type TripDate = (typeof tripDates)[number];
export type Category = (typeof categories)[number];

export type Traveler = {
  id: string;
  name: string;
  isOrganizer: boolean;
  attendance: TripDate[];
};

export type TripOption = {
  id: string;
  category: Category;
  name: string;
  location: string;
  link: string;
  description: string;
  famousFor: string;
  notes: string;
  totalCost: number | null;
  perPersonCost: number | null;
  capacityNotes: string;
  createdBy: string;
  createdAt: string;
};

export type Rating = {
  id: string;
  optionId: string;
  travelerId: string;
  stars: number;
  comment: string;
};

export type RankedOption = TripOption & {
  averageRating: number;
  ratingCount: number;
  score: number;
  ratings: Rating[];
};

export type ItineraryStop = {
  time: string;
  optionId: string;
  optionName: string;
  category: Category;
  location: string;
  reason: string;
};

export type ItineraryCandidate = {
  id: string;
  name: string;
  summary: string;
  days: Array<{
    date: TripDate;
    title: string;
    headcount: number;
    stops: ItineraryStop[];
  }>;
  coverage: Category[];
  warnings: string[];
  createdAt: string;
};

export type TripState = {
  travelers: Traveler[];
  options: TripOption[];
  ratings: Rating[];
  savedItinerary: ItineraryCandidate | null;
};
