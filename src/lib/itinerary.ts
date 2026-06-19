import { rankOptions } from "./rankings";
import { Category, ItineraryCandidate, RankedOption, Rating, Traveler, TripOption, tripDates } from "./types";

const requiredCategories: Category[] = ["temples", "beaches", "shopping", "nightlife"];
const flow: Record<Category, string> = {
  temples: "Morning",
  food: "Lunch",
  shopping: "Afternoon",
  beaches: "Sunset",
  nightlife: "Night",
  stay: "Check-in"
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function pickTop(ranked: RankedOption[], category: Category, used: Set<string>) {
  return ranked.find((option) => option.category === category && !used.has(option.id));
}

function nearbyBonus(option: RankedOption, anchorArea: string) {
  if (!anchorArea) return 0;
  return normalize(option.location).includes(anchorArea) || anchorArea.includes(normalize(option.location)) ? 0.65 : 0;
}

function dayHeadcount(travelers: Traveler[], date: string) {
  return travelers.filter((traveler) => traveler.attendance.includes(date as never)).length;
}

function makeStop(option: RankedOption, reasonPrefix: string) {
  return {
    time: flow[option.category],
    optionId: option.id,
    optionName: option.name,
    category: option.category,
    location: option.location,
    reason: `${reasonPrefix} ${option.averageRating ? option.averageRating.toFixed(1) : "unrated"} stars from ${option.ratingCount} rating${option.ratingCount === 1 ? "" : "s"}.`
  };
}

function buildCandidate(
  id: string,
  name: string,
  summary: string,
  ranked: RankedOption[],
  travelers: Traveler[],
  style: "balanced" | "travel-light" | "experience-max"
): ItineraryCandidate {
  const used = new Set<string>();
  const warnings: string[] = [];
  const days = tripDates.map((date, index) => ({
    date,
    title: ["Arrival and White Town", "Culture and Coast", "Markets and Food", "Farewell Loop"][index],
    headcount: dayHeadcount(travelers, date),
    stops: [] as ReturnType<typeof makeStop>[]
  }));

  const anchors = requiredCategories.map((category) => {
    const option = pickTop(ranked, category, used);
    if (!option) {
      warnings.push(`Add at least one ${category} option to satisfy the minimum itinerary.`);
      return null;
    }
    used.add(option.id);
    return option;
  });

  const placement = style === "experience-max" ? [1, 2, 0, 2] : style === "travel-light" ? [1, 1, 2, 2] : [1, 2, 2, 1];
  anchors.forEach((option, index) => {
    if (option) days[placement[index]].stops.push(makeStop(option, "Required stop selected with"));
  });

  const topStay = pickTop(ranked, "stay", used);
  if (topStay) {
    used.add(topStay.id);
    days[0].stops.unshift(makeStop(topStay, "Best stay candidate with"));
  } else {
    warnings.push("No stay option has been added yet.");
  }

  const anchorArea = normalize(days[1].stops[0]?.location ?? "");
  const fillerCount = style === "experience-max" ? 8 : style === "travel-light" ? 4 : 6;
  const filler = ranked
    .filter((option) => !used.has(option.id) && option.category !== "stay")
    .map((option) => ({
      option,
      adjustedScore: option.score + (style === "travel-light" ? nearbyBonus(option, anchorArea) : 0)
    }))
    .sort((a, b) => b.adjustedScore - a.adjustedScore)
    .slice(0, fillerCount)
    .map(({ option }) => option);

  filler.forEach((option, index) => {
    used.add(option.id);
    const dayIndex = style === "travel-light" ? (index % 2) + 1 : index % 4;
    days[dayIndex].stops.push(makeStop(option, style === "travel-light" ? "Efficient nearby pick with" : "High-value filler with"));
  });

  days.forEach((day) => {
    day.stops.sort((a, b) => Object.values(flow).indexOf(a.time) - Object.values(flow).indexOf(b.time));
  });

  const coverage = Array.from(new Set(days.flatMap((day) => day.stops.map((stop) => stop.category)))) as Category[];
  return {
    id,
    name,
    summary,
    days,
    coverage,
    warnings,
    createdAt: new Date().toISOString()
  };
}

export function generateItineraries(options: TripOption[], ratings: Rating[], travelers: Traveler[]) {
  const ranked = rankOptions(options, ratings);

  return [
    buildCandidate(
      "balanced",
      "Balanced Best Overall",
      "Uses group ratings first, spreads must-have experiences across the trip, and fills gaps with strong food/culture picks.",
      ranked,
      travelers,
      "balanced"
    ),
    buildCandidate(
      "travel-light",
      "Travel-Light Route",
      "Keeps the plan clustered around stronger anchor areas where possible, even if it skips a few lower-priority extras.",
      ranked,
      travelers,
      "travel-light"
    ),
    buildCandidate(
      "experience-max",
      "Experience-Max Plan",
      "Packs more highly ranked options into the four days while still preserving the required categories.",
      ranked,
      travelers,
      "experience-max"
    )
  ];
}
