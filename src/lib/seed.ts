import { TripState, Traveler, tripDates } from "./types";

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
      if (date === "2026-08-04" && (index === 0 || index === 1)) return false;
      return true;
    });

    return {
      id: `traveler-${index + 1}`,
      name: traveler.name,
      age: traveler.age,
      gender: traveler.gender,
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
