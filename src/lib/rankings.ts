import { Rating, RankedOption, TripOption } from "./types";

const categoryWeight: Record<string, number> = {
  stay: 0.9,
  food: 1,
  shopping: 1.08,
  temples: 1.16,
  beaches: 1.16,
  nightlife: 1.16
};

export function rankOptions(options: TripOption[], ratings: Rating[]): RankedOption[] {
  return options
    .map((option) => {
      const optionRatings = ratings.filter((rating) => rating.optionId === option.id);
      const averageRating =
        optionRatings.length === 0
          ? 0
          : optionRatings.reduce((total, rating) => total + rating.stars, 0) / optionRatings.length;
      const confidence = Math.min(optionRatings.length / 5, 1);
      const score = (averageRating * 0.78 + confidence * 1.1) * (categoryWeight[option.category] ?? 1);

      return {
        ...option,
        averageRating,
        ratingCount: optionRatings.length,
        score,
        ratings: optionRatings
      };
    })
    .sort((a, b) => b.score - a.score || b.averageRating - a.averageRating || b.ratingCount - a.ratingCount);
}
