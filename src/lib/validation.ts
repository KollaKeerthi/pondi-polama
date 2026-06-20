import { z } from "zod";
import { categories, tripDates } from "./types";

export const travelerSchema = z.object({
  name: z.string().min(1).max(80),
  isOrganizer: z.boolean().default(false),
  attendance: z.array(z.enum(tripDates)).min(1)
});

export const optionSchema = z.object({
  category: z.enum(categories),
  name: z.string().min(1).max(120),
  location: z.string().min(1).max(160),
  link: z.string().url().or(z.literal("")).default(""),
  description: z.string().max(700).default(""),
  famousFor: z.string().max(500).default(""),
  notes: z.string().max(800).default(""),
  totalCost: z.coerce.number().nonnegative().nullable().optional(),
  perPersonCost: z.coerce.number().nonnegative().nullable().optional(),
  capacityNotes: z.string().max(300).default(""),
  createdBy: z.string().min(1)
});

export const optionUpdateSchema = optionSchema.omit({ createdBy: true }).partial();

export const ratingSchema = z.object({
  optionId: z.string().min(1),
  travelerId: z.string().min(1),
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(300).default("")
});

export const saveItinerarySchema = z.object({
  itineraryId: z.string().min(1)
});
