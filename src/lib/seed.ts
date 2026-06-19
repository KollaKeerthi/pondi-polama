import { TripState, Traveler, tripDates } from "./types";

const travelerNames = [
  "Traveler 1",
  "Traveler 2",
  "Traveler 3",
  "Traveler 4",
  "Traveler 5",
  "Traveler 6",
  "Traveler 7",
  "Traveler 8",
  "Traveler 9",
  "Traveler 10",
  "Traveler 11",
  "Traveler 12",
  "Traveler 13",
  "Traveler 14",
  "Traveler 15"
];

export function createSeedTravelers(): Traveler[] {
  return travelerNames.map((name, index) => {
    const attendance = tripDates.filter((date) => {
      if (date === "2026-08-01" && index >= 12) return false;
      if (date === "2026-08-04" && (index === 0 || index === 1)) return false;
      return true;
    });

    return {
      id: `traveler-${index + 1}`,
      name,
      isOrganizer: index === 0,
      attendance
    };
  });
}

export function createInitialState(): TripState {
  return {
    travelers: createSeedTravelers(),
    options: [],
    ratings: [],
    savedItinerary: null
  };
}
