import { rankOptions } from "./rankings";
import { Category, ItineraryCandidate, RankedOption, Rating, Traveler, TripOption, tripDates } from "./types";

const requiredCategories: Category[] = ["temples", "beaches", "shopping", "nightlife"];
const flow: Record<Category, string> = {
  temples: "8:00 AM",
  stay: "12:00 PM",
  food: "1:00 PM",
  shopping: "4:00 PM",
  beaches: "5:30 PM",
  nightlife: "9:00 PM"
};

const flowOrder: Category[] = ["temples", "stay", "food", "shopping", "beaches", "nightlife"];

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
    arrivalTime: flow[option.category],
    commuteDuration: "Starting point",
    commuteDistance: "-",
    optionId: option.id,
    optionName: option.name,
    category: option.category,
    location: option.location,
    reason: `${reasonPrefix} ${option.averageRating ? option.averageRating.toFixed(1) : "unrated"} stars from ${option.ratingCount} rating${option.ratingCount === 1 ? "" : "s"}.`
  };
}

function areaFor(stop: ReturnType<typeof makeStop>) {
  const text = `${stop.optionName} ${stop.location}`.toLowerCase();
  if (text.includes("auroville")) return "Auroville";
  if (text.includes("rock beach") || text.includes("promenade") || text.includes("sunrise")) return "Promenade";
  if (text.includes("white town") || text.includes("french colony") || text.includes("heritage")) return "White Town";
  if (text.includes("eden")) return "Eden Beach";
  if (text.includes("chunnambar") || text.includes("marina") || text.includes("boat")) return "Chunnambar";
  if (text.includes("nehru") || text.includes("market")) return "Nehru Street";
  return "Pondicherry";
}

const commuteMatrix: Record<string, { km: number; minutes: number }> = {
  "Pondicherry|White Town": { km: 2, minutes: 12 },
  "Pondicherry|Promenade": { km: 2, minutes: 10 },
  "White Town|Promenade": { km: 1, minutes: 8 },
  "White Town|Nehru Street": { km: 2, minutes: 12 },
  "Promenade|Nehru Street": { km: 2.5, minutes: 14 },
  "Pondicherry|Auroville": { km: 12, minutes: 35 },
  "White Town|Auroville": { km: 12, minutes: 35 },
  "Promenade|Auroville": { km: 13, minutes: 38 },
  "Pondicherry|Eden Beach": { km: 9, minutes: 28 },
  "White Town|Eden Beach": { km: 10, minutes: 30 },
  "Promenade|Eden Beach": { km: 10, minutes: 30 },
  "Pondicherry|Chunnambar": { km: 8, minutes: 25 },
  "White Town|Chunnambar": { km: 9, minutes: 28 },
  "Promenade|Chunnambar": { km: 9, minutes: 28 },
  "Auroville|Eden Beach": { km: 20, minutes: 55 },
  "Auroville|Chunnambar": { km: 21, minutes: 58 },
  "Eden Beach|Chunnambar": { km: 7, minutes: 20 }
};

function commuteBetween(previous: ReturnType<typeof makeStop> | undefined, current: ReturnType<typeof makeStop>) {
  if (!previous) return { commuteDuration: "Starting point", commuteDistance: "-" };
  const from = areaFor(previous);
  const to = areaFor(current);
  if (from === to) return { commuteDuration: "8 min", commuteDistance: "1 km" };
  const direct = commuteMatrix[`${from}|${to}`] ?? commuteMatrix[`${to}|${from}`] ?? { km: 5, minutes: 20 };
  return {
    commuteDuration: `${direct.minutes} min`,
    commuteDistance: `${direct.km} km`
  };
}

function addCommuteEstimates(stops: ReturnType<typeof makeStop>[]) {
  return stops.map((stop, index) => {
    const commute = commuteBetween(stops[index - 1], stop);
    return {
      ...stop,
      arrivalTime: stop.time,
      ...commute
    };
  });
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
    day.stops.sort((a, b) => flowOrder.indexOf(a.category) - flowOrder.indexOf(b.category));
    day.stops = addCommuteEstimates(day.stops);
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
